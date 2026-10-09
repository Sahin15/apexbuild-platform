import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  searchable = false, 
  required = false,
  className = "",
  containerClassName = "",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && search
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className={`relative ${containerClassName}`} ref={dropdownRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 flex flex-col overflow-hidden">
          {searchable && (
            <div className="p-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto flex-1 p-2">
            {!required && (
              <div 
                onClick={() => {
                  onChange({ target: { value: '' } });
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${!value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 font-medium'}`}
              >
                {placeholder}
              </div>
            )}
            {filteredOptions.map(opt => (
              <div 
                key={opt.value} 
                onClick={() => {
                  onChange({ target: { value: opt.value } });
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${value === opt.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 font-medium'}`}
              >
                {opt.label}
                {opt.subtext && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{opt.subtext}</div>}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-sm">No options found</div>
            )}
          </div>
        </div>
      )}
      
      {required && <input type="hidden" required value={value} />}
    </div>
  );
}
