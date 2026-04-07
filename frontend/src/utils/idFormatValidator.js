/**
 * User ID Format Validator
 * Validates and formats User IDs according to organization-specific rules
 */

/**
 * Build a regex pattern from Django IdFormat model data
 * @param {Object} format - IdFormat object from backend with fields: prefix, admin_separator, user_separator, segment1_len, segment2_len, segment3_len, is_active
 * @param {String} role - User role ('Admin', 'User', etc.)
 * @returns {Object} - {pattern, regex, hint}
 */
export const buildIdFormatPattern = (format, role) => {
  if (!format) {
    return null;
  }

  // Choose separator based on role
  const separator = role === 'Admin' ? format.admin_separator : format.user_separator;

  // Build pattern string
  let patternStr = format.prefix;
  const segments = [];
  
  if (format.segment1_len) {
    segments.push('X'.repeat(format.segment1_len));
    patternStr += separator + 'X'.repeat(format.segment1_len);
  }
  
  if (format.segment2_len) {
    segments.push('X'.repeat(format.segment2_len));
    patternStr += separator + 'X'.repeat(format.segment2_len);
  }
  
  if (format.segment3_len) {
    segments.push('X'.repeat(format.segment3_len));
    patternStr += separator + 'X'.repeat(format.segment3_len);
  }

  // Build regex pattern
  const escapedSeparator = separator === '.' ? '\\.' : '\\' + separator;
  let regexStr = '^' + format.prefix;
  
  if (format.segment1_len) {
    regexStr += escapedSeparator + '[0-9]{' + format.segment1_len + '}';
  }
  
  if (format.segment2_len) {
    regexStr += escapedSeparator + '[0-9]{' + format.segment2_len + '}';
  }
  
  if (format.segment3_len) {
    regexStr += escapedSeparator + '[0-9]{' + format.segment3_len + '}';
  }
  
  regexStr += '$';

  return {
    pattern: patternStr,
    regex: new RegExp(regexStr),
    hint: `${format.prefix}${separator}${segments.join(separator)} (${role} format)`,
    separator,
    segments
  };
};

/**
 * Validate a User ID against the format rules
 * @param {String} userId - The user ID to validate
 * @param {Object} format - IdFormat object from backend
 * @param {String} role - User role
 * @returns {Object} - {isValid, error, pattern}
 */
export const validateUserId = (userId, format, role) => {
  if (!userId) {
    return {
      isValid: false,
      error: 'User ID is required',
      pattern: null
    };
  }

  if (!format) {
    return {
      isValid: false,
      error: 'No ID format configured for this organization',
      pattern: null
    };
  }

  if (!format.is_active) {
    return {
      isValid: false,
      error: 'ID format is not active',
      pattern: null
    };
  }

  const formatInfo = buildIdFormatPattern(format, role);
  
  if (!formatInfo) {
    return {
      isValid: false,
      error: 'Invalid format configuration',
      pattern: null
    };
  }

  const isValid = formatInfo.regex.test(userId);

  if (!isValid) {
    return {
      isValid: false,
      error: `Invalid format. Expected: ${formatInfo.pattern}`,
      pattern: formatInfo.pattern
    };
  }

  return {
    isValid: true,
    error: null,
    pattern: formatInfo.pattern,
    hint: formatInfo.hint
  };
};

/**
 * Generate sample User IDs for preview
 * @param {Object} format - IdFormat object from backend
 * @param {String} role - User role
 * @returns {Object} - {admin, user}
 */
export const generateSampleIds = (format, role) => {
  if (!format) {
    return { admin: '', user: '' };
  }

  const adminSeparator = format.admin_separator;
  const userSeparator = format.user_separator;
  const separator = role === 'Admin' ? adminSeparator : userSeparator;

  let adminId = format.prefix;
  let userId = format.prefix;

  if (format.segment1_len) {
    adminId += adminSeparator + '0'.repeat(format.segment1_len);
    userId += userSeparator + '0'.repeat(format.segment1_len);
  }

  if (format.segment2_len) {
    adminId += adminSeparator + '0'.repeat(format.segment2_len);
    userId += userSeparator + '0'.repeat(format.segment2_len);
  }

  if (format.segment3_len) {
    adminId += adminSeparator + '0'.repeat(format.segment3_len);
    userId += userSeparator + '0'.repeat(format.segment3_len);
  }

  return { admin: adminId, user: userId };
};

/**
 * Get format hint for a specific role
 * @param {Object} format - IdFormat object from backend
 * @param {String} role - User role
 * @returns {String} - Formatted hint text
 */
export const getFormatHint = (format, role) => {
  if (!format) {
    return 'Please configure user ID format';
  }

  const formatInfo = buildIdFormatPattern(format, role);
  if (!formatInfo) {
    return 'Invalid format configuration';
  }

  return `Format: ${formatInfo.pattern} (${role})`;
};

export default {
  buildIdFormatPattern,
  validateUserId,
  generateSampleIds,
  getFormatHint
};
