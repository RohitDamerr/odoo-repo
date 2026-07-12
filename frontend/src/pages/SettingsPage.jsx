import { useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const RBAC_DATA = [
  { role: 'Admin', fleet: '✅', drivers: '✅', trips: '✅', fuel: '✅', reports: '✅' },
  { role: 'Fleet Manager', fleet: '✅', drivers: '✅', trips: '✅', fuel: '✅', reports: '✅' },
  { role: 'Dispatcher', fleet: '👁', drivers: '—', trips: '✅', fuel: '—', reports: '—' },
  { role: 'Safety Officer', fleet: '—', drivers: '✅', trips: '👁', fuel: '—', reports: '—' },
  { role: 'Financial Analyst', fleet: '👁', drivers: '—', trips: '—', fuel: '✅', reports: '✅' },
  { role: 'Driver', fleet: '—', drivers: '—', trips: '—', fuel: '—', reports: '—' },
];

const CURRENCY_OPTS = ['INR (₹)', 'USD ($)', 'EUR (€)'].map((v) => ({ value: v, label: v }));
const DISTANCE_OPTS = ['Kilometers', 'Miles'].map((v) => ({ value: v, label: v }));

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('depotSettings');
    return saved ? JSON.parse(saved) : { depotName: 'Gandhinagar Depot', currency: 'INR (₹)', distanceUnit: 'Kilometers' };
  });

  const handleChange = (e) => setSettings((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = () => {
    localStorage.setItem('depotSettings', JSON.stringify(settings));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Settings &amp; RBAC</h1>
        <p className="text-sm text-muted mt-1">Manage depot configurations and role permissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 border-l-4 border-l-gray-400 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-primary uppercase tracking-wider text-sm text-muted">General</h2>
          <Input label="Depot Name" name="depotName" value={settings.depotName} onChange={handleChange} />
          <Select label="Currency" name="currency" value={settings.currency} onChange={handleChange} options={CURRENCY_OPTS} />
          <Select label="Distance Unit" name="distanceUnit" value={settings.distanceUnit} onChange={handleChange} options={DISTANCE_OPTS} />
          <Button onClick={handleSave} className="w-full sm:w-auto">Save changes</Button>
        </div>

        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 border-l-4 border-l-primary overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-primary uppercase tracking-wider text-sm text-muted">Role-Based Access (RBAC)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-muted font-medium">Role</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-muted font-medium text-center">Fleet</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-muted font-medium text-center">Drivers</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-muted font-medium text-center">Trips</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-muted font-medium text-center">Fuel/Exp</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-muted font-medium text-center">Analytics</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {RBAC_DATA.map((row, i) => (
                  <tr key={row.role} className={`hover:bg-gray-50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-6 py-4 font-medium">{row.role}</td>
                    <td className="px-6 py-4 text-center">{row.fleet}</td>
                    <td className="px-6 py-4 text-center">{row.drivers}</td>
                    <td className="px-6 py-4 text-center">{row.trips}</td>
                    <td className="px-6 py-4 text-center">{row.fuel}</td>
                    <td className="px-6 py-4 text-center">{row.reports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
