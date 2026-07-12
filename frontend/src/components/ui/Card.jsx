export default function Card({ title, value, icon, color = 'blue', onClick }) {
  const borders = { blue: 'border-l-blue-500', green: 'border-l-green-500', orange: 'border-l-orange-500', red: 'border-l-red-500' };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 border-l-4 ${borders[color]} p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="material-symbols-outlined text-2xl text-muted">{icon}</span>}
        <div>
          <div className="text-2xl font-bold text-primary">{value}</div>
          <div className="text-sm text-muted">{title}</div>
        </div>
      </div>
    </div>
  );
}
