import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/vehicles': 'Vehicles',
  '/drivers': 'Drivers',
  '/trips': 'Trips',
  '/maintenance': 'Maintenance',
  '/fuel': 'Fuel Logs',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
};

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();

  const base = '/' + location.pathname.split('/')[1];
  const title = PAGE_TITLES[base] || 'TransitOps';

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-primary">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-on-surface">{user?.name}</div>
          <div className="text-xs text-muted capitalize">{user?.role?.replace(/_/g, ' ')}</div>
        </div>
      </div>
    </header>
  );
}
