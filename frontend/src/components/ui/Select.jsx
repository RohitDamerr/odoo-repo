export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  placeholder = 'Select...',
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-xs uppercase tracking-wider text-muted mb-1 font-medium">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full border rounded p-2.5 bg-white text-on-surface text-sm focus:outline-none focus:border-primary focus:border-2 transition-colors ${error ? 'border-red-300' : 'border-gray-300'}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
