import os
import sys

# SET TESSERACT PATH BEFORE IMPORTING PYTESSERACT
# This must be done before pytesseract is imported
if os.name == 'nt':  # Windows
    os.environ['PATH'] += r';C:\Program Files\Tesseract-OCR'

import pytesseract
import cv2
import numpy as np
from PIL import Image
import re
from datetime import datetime, timedelta
from dateutil import parser as date_parser
from pathlib import Path
from pdf2image import convert_from_path
import logging

logger = logging.getLogger(__name__)

# Configure Tesseract path explicitly
try:
    pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    logger.info("Tesseract path configured successfully")
except Exception as e:
    logger.warning(f"Could not set Tesseract path: {str(e)}")

# Tesseract configuration for better accuracy
TESSERACT_CONFIG = r'--oem 3 --psm 6'  # PSM 6 = assume single uniform block of text


def extract_text_from_image(image_path):
    """
    Extract text from image using Tesseract OCR.
    Optimized for 300+ DPI scans.
    
    Args:
        image_path (str): Path to image file
        
    Returns:
        str: Extracted text
    """
    try:
        logger.info(f"Starting OCR on image: {image_path}")
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to read image: {image_path}")
        
        logger.info(f"Image loaded, shape: {img.shape}")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Try basic extraction first with minimal preprocessing
        logger.info("Attempting basic OCR extraction...")
        text_basic = pytesseract.image_to_string(gray, config=TESSERACT_CONFIG)
        
        if text_basic.strip():
            logger.info(f"Basic OCR successful, extracted {len(text_basic)} characters")
            return text_basic.strip()
        
        # If basic extraction failed, try with preprocessing
        logger.info("Basic extraction empty, trying with preprocessing...")
        
        # Upscale for better OCR accuracy if image is small
        height, width = gray.shape
        if height < 500 or width < 500:
            scale_factor = max(500 / height, 500 / width)
            gray = cv2.resize(gray, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
            logger.info(f"Image upscaled by factor {scale_factor}")
        
        # Apply light thresholding only
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        
        # Try OCR on thresholded image
        text_thresh = pytesseract.image_to_string(thresh, config=TESSERACT_CONFIG)
        
        if text_thresh.strip():
            logger.info(f"Thresholded OCR successful, extracted {len(text_thresh)} characters")
            return text_thresh.strip()
        
        logger.warning(f"Both extraction methods returned empty for {image_path}")
        return ""
        
    except Exception as e:
        logger.error(f"Error extracting text from image {image_path}: {str(e)}", exc_info=True)
        return ""


def extract_text_from_pdf(pdf_path):
    """
    Extract text from PDF using pdf2image and Tesseract.
    
    Args:
        pdf_path (str): Path to PDF file
        
    Returns:
        str: Extracted text from all pages
    """
    try:
        logger.info(f"Starting PDF OCR on: {pdf_path}")
        images = convert_from_path(pdf_path, dpi=300)
        logger.info(f"Converted PDF to {len(images)} pages")
        full_text = []
        
        for idx, image in enumerate(images):
            logger.info(f"Processing PDF page {idx + 1}/{len(images)}")
            # Convert PIL image to numpy array
            img_array = np.array(image)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Try basic extraction first
            text = pytesseract.image_to_string(gray, config=TESSERACT_CONFIG)
            
            if not text.strip():
                # Try with light thresholding
                _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
                text = pytesseract.image_to_string(thresh, config=TESSERACT_CONFIG)
            
            full_text.append(text)
        
        result = "\n".join(full_text).strip()
        logger.info(f"PDF OCR complete, extracted {len(result)} characters from {len(images)} pages")
        return result
    except Exception as e:
        logger.error(f"Error extracting text from PDF {pdf_path}: {str(e)}", exc_info=True)
        return ""


def detect_document_fields(text):
    """
    Detect and extract structured fields from OCR text using regex patterns.
    
    Fields detected:
    - Names: Patterns like "Name:", "Full Name:", etc.
    - Dates: Various date formats (MM/DD/YYYY, DD-MM-YYYY, etc.)
    - Document Types: Invoice, Receipt, Contract, Student Record, Memorandum, etc.
    - Reference Numbers: ID numbers, reference codes, etc.
    
    Args:
        text (str): OCR extracted text
        
    Returns:
        dict: Structured fields with detected values
    """
    fields = {
        'names': [],
        'dates': [],
        'document_type': None,
        'reference_numbers': []
    }
    
    try:
        # Case-insensitive search
        text_lower = text.lower()
        
        # Extract names (after "name:" or similar patterns)
        name_patterns = [
            r'(?:full\s+)?name[:\s]+([A-Za-z\s]+?)(?:\n|,|$)',
            r'(?:student\s+)?name[:\s]+([A-Za-z\s]+?)(?:\n|,|$)',
            r'(?:applicant|recipient|prepared\s+by|signed\s+by)[:\s]+([A-Za-z\s]+?)(?:\n|,|$)',
        ]
        for pattern in name_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                name = match.strip()
                if name and len(name) > 2:
                    fields['names'].append(name)
        
        # Extract dates (multiple formats)
        date_patterns = [
            r'\d{1,2}[-/]\d{1,2}[-/]\d{4}',  # MM/DD/YYYY or DD/MM/YYYY
            r'\d{4}[-/]\d{1,2}[-/]\d{1,2}',  # YYYY/MM/DD
            r'(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}',  # Month DD, YYYY
        ]
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            fields['dates'].extend(matches)
        
        # Remove duplicates
        fields['dates'] = list(set(fields['dates']))
        
        # Detect document type
        doc_type_keywords = {
            'Invoice': ['invoice', 'bill', 'payment'],
            'Receipt': ['receipt', 'received'],
            'Contract': ['contract', 'agreement', 'terms'],
            'Student Record': ['student', 'transcript', 'record', 'academic'],
            'Memorandum': ['memorandum', 'memo', 'memo of understanding'],
            'Legal Document': ['legal', 'document', 'statute', 'law'],
        }
        
        for doc_type, keywords in doc_type_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    fields['document_type'] = doc_type
                    break
            if fields['document_type']:
                break
        
        # Extract reference numbers (IDs, case numbers, invoice numbers, etc.)
        ref_patterns = [
            r'(?:id|ID|id\s+number)[:\s]+([A-Z0-9\-]+)',
            r'(?:invoice|case|reference|ref)[:\s]+(?:number)?[:\s]*([A-Z0-9\-]+)',
            r'(?:student\s+)?(?:id|number)[:\s]+([0-9\-]+)',
        ]
        for pattern in ref_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                ref = match.strip()
                if ref and len(ref) > 2:
                    fields['reference_numbers'].append(ref)
        
        # Remove duplicates
        fields['reference_numbers'] = list(set(fields['reference_numbers']))
        fields['names'] = list(set(fields['names']))
        
    except Exception as e:
        print(f"Error detecting fields: {str(e)}")
    
    return fields


def extract_validity_date(text):
    """
    Extract validity/expiration date from OCR text.
    Looks for patterns like "Valid until", "Expires", "Validity period", etc.
    
    Args:
        text (str): OCR extracted text
        
    Returns:
        datetime.date or None: Extracted date or None if not found
    """
    try:
        text_lower = text.lower()
        
        # Patterns to look for validity/expiration dates
        validity_patterns = [
            r'(?:valid\s+until|expires?|expiration|validity\s+(?:period|until)|expires?\s+(?:on|at))[:\s]+([^\n]+?)(?:\n|$)',
            r'(?:valid(?:\s+through)?|until)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
            r'(?:expir(?:es|ed)\s+)?([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})',
        ]
        
        for pattern in validity_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    # Try to parse the date string
                    date_str = match.strip()
                    parsed_date = date_parser.parse(date_str, fuzzy=True)
                    return parsed_date.date()
                except:
                    continue
        
        return None
    except Exception as e:
        print(f"Error extracting validity date: {str(e)}")
        return None


def classify_document(text, document_fields):
    """
    Auto-classify document based on keywords and detected fields.
    Returns category and confidence score.
    
    Args:
        text (str): OCR extracted text
        document_fields (dict): Detected fields from detect_document_fields()
        
    Returns:
        tuple: (category_name, confidence_score)
    """
    try:
        text_lower = text.lower()
        
        # Define classification rules with keywords and confidence weights
        classifications = {
            'Invoices': {
                'keywords': ['invoice', 'bill', 'amount due', 'total', 'payment', 'qty', 'quantity', 'unit price'],
                'doc_type_match': 'Invoice',
                'base_confidence': 0.8
            },
            'Student Records': {
                'keywords': ['student', 'transcript', 'grade', 'academic', 'semester', 'course', 'gpa', 'department'],
                'doc_type_match': 'Student Record',
                'base_confidence': 0.85
            },
            'Contracts': {
                'keywords': ['contract', 'agreement', 'terms', 'conditions', 'parties', 'party', 'signatory', 'dated'],
                'doc_type_match': 'Contract',
                'base_confidence': 0.8
            },
            'Receipts': {
                'keywords': ['receipt', 'received', 'payment', 'cash', 'total', 'date', 'thank you'],
                'doc_type_match': 'Receipt',
                'base_confidence': 0.75
            },
            'Memoranda': {
                'keywords': ['memorandum', 'memo', 'mou', 'to:', 'from:', 'date:', 'subject:', 'understanding'],
                'doc_type_match': 'Memorandum',
                'base_confidence': 0.8
            },
        }
        
        best_category = None
        best_confidence = 0.0
        
        for category, rules in classifications.items():
            confidence = rules['base_confidence']
            
            # Keyword matching
            keyword_matches = sum(1 for keyword in rules['keywords'] if keyword in text_lower)
            keyword_weight = (keyword_matches / len(rules['keywords'])) * 0.4
            
            # Document type matching
            if document_fields.get('document_type') == rules['doc_type_match']:
                keyword_weight = min(keyword_weight + 0.3, 1.0)
            
            # Calculate final confidence
            final_confidence = min(confidence + (keyword_weight * 0.2), 1.0)
            
            if final_confidence > best_confidence:
                best_confidence = final_confidence
                best_category = category
        
        return (best_category, round(best_confidence, 2))
    except Exception as e:
        print(f"Error classifying document: {str(e)}")
        return (None, 0.0)


def detect_duplicates(text, detected_fields, existing_documents):
    """
    Detect potential duplicates by comparing reference numbers and key fields.
    
    Args:
        text (str): OCR extracted text from current document
        detected_fields (dict): Detected fields from detect_document_fields()
        existing_documents (QuerySet): Existing documents to compare against
        
    Returns:
        list: List of potentially duplicate document IDs with confidence scores
    """
    duplicates = []
    
    try:
        current_ref_numbers = set(detected_fields.get('reference_numbers', []))
        
        # Check against existing documents
        for doc in existing_documents:
            if not doc.detected_fields:
                continue
            
            duplicate_score = 0.0
            
            # Check reference number matches
            existing_ref_numbers = set(doc.detected_fields.get('reference_numbers', []))
            ref_match = current_ref_numbers.intersection(existing_ref_numbers)
            if ref_match:
                duplicate_score += 0.5
            
            # Check text similarity (simple word overlap)
            if doc.extracted_text:
                current_words = set(text.lower().split())
                existing_words = set(doc.extracted_text.lower().split())
                overlap = current_words.intersection(existing_words)
                similarity_ratio = len(overlap) / max(len(current_words), len(existing_words)) if max(len(current_words), len(existing_words)) > 0 else 0
                duplicate_score += similarity_ratio * 0.5
            
            # Flag as potential duplicate if score > 0.6
            if duplicate_score > 0.6:
                duplicates.append({
                    'doc_id': doc.doc_id,
                    'confidence': round(duplicate_score, 2)
                })
        
        # Sort by confidence descending
        duplicates.sort(key=lambda x: x['confidence'], reverse=True)
        
    except Exception as e:
        print(f"Error detecting duplicates: {str(e)}")
    
    return duplicates


def process_document_ocr(document_instance, file_path):
    """
    Main OCR processing pipeline for a document.
    Orchestrates all OCR operations and updates the document instance.
    
    Args:
        document_instance: Document model instance to update
        file_path (str): Path to document file
        
    Returns:
        dict: Processing results with status and extracted data
    """
    result = {
        'status': 'success',
        'extracted_text': '',
        'detected_fields': {},
        'validity_date': None,
        'category': None,
        'confidence': 0.0,
        'duplicates': [],
        'error': None
    }
    
    try:
        logger.info(f"Starting OCR pipeline for document: {document_instance.doc_name}")
        
        # Step 1: Extract text based on file type
        file_ext = Path(file_path).suffix.lower()
        logger.info(f"File type: {file_ext}")
        
        if file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']:
            extracted_text = extract_text_from_image(file_path)
        elif file_ext == '.pdf':
            extracted_text = extract_text_from_pdf(file_path)
        else:
            result['status'] = 'error'
            result['error'] = f"Unsupported file type: {file_ext}"
            logger.error(f"Unsupported file type: {file_ext}")
            return result
        
        if not extracted_text:
            result['status'] = 'warning'
            result['error'] = "No text extracted from document"
            logger.warning(f"No text extracted from {document_instance.doc_name}")
            return result
        
        result['extracted_text'] = extracted_text
        logger.info(f"Text extraction complete: {len(extracted_text)} characters extracted")
        
        # Step 2: Detect structured fields
        detected_fields = detect_document_fields(extracted_text)
        result['detected_fields'] = detected_fields
        
        # Step 3: Extract validity date
        validity_date = extract_validity_date(extracted_text)
        result['validity_date'] = validity_date
        
        # Step 4: Auto-classify document
        category_name, confidence = classify_document(extracted_text, detected_fields)
        result['category'] = category_name
        result['confidence'] = confidence
        
        # Step 5: Detect duplicates (compare with existing documents)
        from documents.models import Document
        existing_docs = Document.objects.filter(
            user_index=document_instance.user_index,
            ocr_processed=True
        ).exclude(doc_id=document_instance.doc_id)
        
        duplicates = detect_duplicates(extracted_text, detected_fields, existing_docs)
        result['duplicates'] = duplicates
        
        # Update document instance with extracted data
        document_instance.extracted_text = extracted_text
        document_instance.detected_fields = detected_fields
        document_instance.validity_date = validity_date
        document_instance.auto_category_confidence = confidence
        document_instance.ocr_processed = True
        
        # Mark as duplicate if high confidence match found
        if duplicates and duplicates[0]['confidence'] > 0.75:
            document_instance.is_duplicate = True
            document_instance.duplicate_of_id = duplicates[0]['doc_id']
        
        document_instance.save()
        
        logger.info(f"OCR pipeline completed successfully for: {document_instance.doc_name}")
        
    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)
        logger.error(f"OCR pipeline error for {document_instance.doc_name}: {str(e)}", exc_info=True)
    
    return result
