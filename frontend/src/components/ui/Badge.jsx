const colorMap = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
};

const STATUS_COLORS = {
  Available: 'green',
  'On Trip': 'blue',
  'In Shop': 'orange',
  Retired: 'gray',
  Suspended: 'red',
  'Off Duty': 'yellow',
  Draft: 'gray',
  Dispatched: 'blue',
  Completed: 'green',
  Cancelled: 'red',
  Active: 'orange',
  Closed: 'green',
};

export default function Badge({ label, color }) {
  const c = color || STATUS_COLORS[label] || 'gray';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[c]}`}>
      {label}
    </span>
  );
}
