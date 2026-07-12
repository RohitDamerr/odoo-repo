import Select from './Select';

export default function FilterBar({ filters = [], onClear }) {
  const hasAny = filters.some((f) => f.value);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((f) => (
        <Select
          key={f.key}
          name={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          options={f.options}
          placeholder={f.label}
          className="w-44"
        />
      ))}
      {hasAny && (
        <button onClick={onClear} className="text-sm text-muted hover:text-primary transition-colors">
          Clear Filters
        </button>
      )}
    </div>
  );
}
