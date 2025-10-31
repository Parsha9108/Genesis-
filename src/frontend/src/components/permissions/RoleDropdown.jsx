import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const RoleDropdown = ({ roleOptions, selectedRole, setSelectedRole, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleSelect = (value) => {
    setSelectedRole(value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-40" ref={dropdownRef}>
      {/* Dropdown button */}
      <button
        onClick={handleToggle}
        className={`flex items-center justify-between w-full px-3 py-1.5 text-sm border rounded-lg cursor-pointer transition-all duration-200
          ${isDarkMode
            ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }
          ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        `}
      >
        <span>{roleOptions.find(r => r.value === selectedRole)?.label || 'Select Role'}</span>
        <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {/* Dropdown menu */}
      <div
        className={`absolute top-full mt-1 w-full rounded-lg shadow-lg border z-50 transition-all duration-200 origin-top
          ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
          }
        `}
      >
        <div className="py-1 max-h-48 overflow-y-auto">
          <button
            className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
              ${selectedRole === 'all'
                ? 'bg-blue-500 text-white'
                : isDarkMode
                  ? 'text-gray-200 hover:bg-gray-600'
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
            onClick={() => handleSelect('all')}
          >
            All Roles
          </button>
          {roleOptions.map((role) => (
            <button
              key={role.value}
              className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
                ${selectedRole === role.value
                  ? 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'text-gray-200 hover:bg-gray-600'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              onClick={() => handleSelect(role.value)}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
