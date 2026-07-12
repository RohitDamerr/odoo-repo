import { useState, useEffect, useRef } from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  const [local, setLocal] = useState(value || '');
  const timer = useRef(null);

  useEffect(() => {
    setLocal(value || '');
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange?.(v), 300);
  };

  const handleClear = () => {
    setLocal('');
    clearTimeout(timer.current);
    onChange?.('');
  };

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        <span className="material-symbols-outlined text-lg">search</span>
      </span>
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary focus:border-2 transition-colors"
      />
      {local && (
        <button onClick={handleClear} className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600">
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      )}
    </div>
  );
}
