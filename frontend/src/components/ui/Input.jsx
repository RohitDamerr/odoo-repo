export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-xs uppercase tracking-wider text-muted mb-1 font-medium">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border rounded p-2.5 bg-white text-on-surface text-sm focus:outline-none focus:border-primary focus:border-2 transition-colors disabled:bg-gray-100 ${error ? 'border-red-300' : 'border-gray-300'}`}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
