import { MoreVertical, Share2, Edit, Trash2, Lock, Tag, Folder, Eye } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ContextMenu({
  item,
  itemType = 'document', // 'document' or 'folder'
  onShare,
  hideShareOption = false,
  onRename,
  onDelete,
  onPermissions,
  onAddCategories,
  onDownload,
  onOpen,
  onMoveToFolder,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [positionAbove, setPositionAbove] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (!showMenu) return;

    const calculatePosition = () => {
      if (!buttonRef.current || !menuRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuElement = menuRef.current.querySelector('[data-menu-dropdown]');
      
      if (!menuElement) return;

      const menuHeight = menuElement.offsetHeight;
      const viewportHeight = window.innerHeight;
      const padding = 16; // Distance from top/bottom edge
      
      // Calculate space available
      const spaceBelow = viewportHeight - buttonRect.bottom - padding;
      const spaceAbove = buttonRect.top - padding;
      
      // Position above if not enough space below AND there's enough space above
      if (spaceBelow < menuHeight && spaceAbove >= menuHeight) {
        setPositionAbove(true);
      } else {
        setPositionAbove(false);
      }
    };

    // Wait for DOM to render completely before calculating
    const timeoutId = setTimeout(calculatePosition, 150);
    
    const handleResize = () => {
      requestAnimationFrame(calculatePosition);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [showMenu]);

  const handleMenuClick = (callback) => {
    callback?.(item);
    setShowMenu(false);
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
        title="More options"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {showMenu && (
        <div 
          data-menu-dropdown
          className={`absolute right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48 max-h-[60vh] overflow-y-auto ${
            positionAbove ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {/* Preview Option */}
          {itemType === 'document' && onOpen && (
            <button
              onClick={() => handleMenuClick(onOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 first:rounded-t-lg text-sm"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
          )}

          {/* Download */}
          {onDownload && (
            <button
              onClick={() => handleMenuClick(onDownload)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 text-sm"
            >
              <span>{itemType === 'folder' ? 'Download Folder (.zip)' : 'Download'}</span>
            </button>
          )}

          {/* Rename */}
          {onRename && (
            <button
              onClick={() => handleMenuClick(onRename)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 text-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Rename</span>
            </button>
          )}

          {/* Share To */}
          {onShare && !hideShareOption && (
            <button
              onClick={() => handleMenuClick(onShare)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Share To</span>
            </button>
          )}



          {/* Move to Folder */}
          {itemType === 'document' && onMoveToFolder && (
            <button
              onClick={() => handleMenuClick(onMoveToFolder)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 text-sm"
            >
              <Folder className="w-4 h-4" />
              <span>Move to Folder</span>
            </button>
          )}

          {/* Add Categories */}
          {onAddCategories && (
            <button
              onClick={() => handleMenuClick(onAddCategories)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 text-sm"
            >
              <Tag className="w-4 h-4" />
              <span>{itemType === 'folder' ? 'Set Category' : 'Add Categories'}</span>
            </button>
          )}

          {/* Permissions */}
          {onPermissions && (
            <button
              onClick={() => handleMenuClick(onPermissions)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 text-sm"
            >
              <Lock className="w-4 h-4" />
              <span>Permissions</span>
            </button>
          )}

          {/* Delete - Danger Zone */}
          {onDelete && (
            <button
              onClick={() => handleMenuClick(onDelete)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors rounded-b-lg last:rounded-b-lg text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
