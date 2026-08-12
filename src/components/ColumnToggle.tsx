import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check, Eye, RotateCcw, X } from 'lucide-react';

export interface ColumnOption {
  key: string;
  label: string;
  visible: boolean;
}

interface ColumnToggleProps {
  columns: ColumnOption[];
  onChange: (key: string, visible: boolean) => void;
  onReset?: () => void;
  className?: string;
  title?: string;
}

export const ColumnToggle: React.FC<ColumnToggleProps> = ({
  columns,
  onChange,
  onReset,
  className = '',
  title = 'Ẩn/Hiện cột',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hiddenCount = columns.filter((c) => !c.visible).length;

  const handleShowAll = () => {
    columns.forEach((c) => {
      if (!c.visible) {
        onChange(c.key, true);
      }
    });
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
        title="Tuỳ chỉnh hiển thị danh sách cột"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
        <span>{title}</span>
        {hiddenCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
            -{hiddenCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-gray-800">Tùy chọn hiển thị cột</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto space-y-1 divide-y divide-gray-100">
            <div className="space-y-0.5 pb-1">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-50/60 cursor-pointer text-xs group"
                >
                  <span className={`font-medium ${col.visible ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                    {col.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={(e) => onChange(col.key, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleShowAll}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Hiện tất cả
            </button>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-gray-500 hover:text-gray-800 flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mặc định</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
