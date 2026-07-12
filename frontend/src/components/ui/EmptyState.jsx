export default function EmptyState({ title = 'No data found', description, action }) {
  return (
    <div className="text-center py-12">
      <span className="material-symbols-outlined text-5xl text-gray-300 mb-3 block">inventory_2</span>
      <h3 className="text-base font-semibold text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-muted mb-4">{description}</p>}
      {action}
    </div>
  );
}
