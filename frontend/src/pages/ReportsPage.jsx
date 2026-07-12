import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [roi, setRoi] = useState(null);
  const [efficiency, setEfficiency] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [costByVeh, setCostByVeh] = useState([]);
  const [expenses, setExpenses] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/reports/vehicles/roi'),
      api.get('/reports/fuel/efficiency'),
      api.get('/reports/vehicles/utilization'),
      api.get('/reports/trips/revenue'),
      api.get('/reports/maintenance/cost-by-vehicle'),
      api.get('/reports/expenses/summary'),
    ]).then(([rRoi, rEff, rUtil, rRev, rCost, rExp]) => {
      setRoi(rRoi.data.data);
      setEfficiency(rEff.data.data || []);
      setUtilization(rUtil.data.data);
      setRevenue(rRev.data.data || []);
      setCostByVeh(rCost.data.data || []);
      setExpenses(rExp.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const revenueTrips = Array.isArray(revenue) ? revenue : (revenue?.trips || []);
  const revenueMonths = groupByMonth(revenueTrips);

  const avgRoi = roi?.vehicles?.length ? +(roi.vehicles.reduce((s, v) => s + (v.roi || 0), 0) / roi.vehicles.length).toFixed(1) : 0;
  const avgEfficiency = efficiency.length ? +(efficiency.reduce((s, e) => s + (e.efficiency || 0), 0) / efficiency.length).toFixed(1) : 0;
  const fleetUtil = utilization?.utilizationRate != null ? utilization.utilizationRate : utilization?.rate || 0;
  const totalOpCost = (expenses?.totalAmount || 0) + (roi?.vehicles?.reduce((s, v) => s + v.totalOperationalCost, 0) || 0);
  const maxRevenue = Math.max(...revenueMonths.map((r) => r.total || 0), 1);
  const maxCost = Math.max(...(Array.isArray(costByVeh) ? costByVeh : []).map((c) => c.totalCost || 0), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Reports &amp; Analytics</h1>
          <p className="text-sm text-muted mt-1">{roi?.formula || 'ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Fuel Efficiency" value={`${avgEfficiency}`} unit="km/l" trend="+2.1%" up />
        <KpiCard title="Fleet Utilization" value={`${fleetUtil}`} unit="%" trend="—" />
        <KpiCard title="Operational Cost" value={`₹${totalOpCost.toLocaleString()}`} unit="" trend="—" />
        <KpiCard title="Avg Vehicle ROI" value={`${avgRoi}`} unit="%" trend={avgRoi > 0 ? 'Positive' : '—'} up={avgRoi > 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary mb-6">Monthly Revenue</h2>
          <div className="h-[280px] flex items-end gap-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map((i) => <div key={i} className="border-b border-gray-100 w-full" />)}
            </div>
            {revenueMonths.slice(-12).map((r, i) => (
              <div key={i} className="flex-1 bg-secondary/70 hover:bg-secondary transition-colors rounded-t-sm relative z-10 group" style={{ height: r.total > 0 ? `${(r.total / maxRevenue) * 100}%` : '4px' }}>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">₹{r.total?.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 px-1 text-[10px] text-muted">
            {revenueMonths.slice(-12).map((r, i) => <span key={i}>{r.label}</span>)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary mb-6">Top Costliest Vehicles</h2>
          <div className="space-y-5">
            {(Array.isArray(costByVeh) ? costByVeh : []).slice(0, 4).map((v) => (
              <div key={v.vehicleId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{v.registrationNumber}</span>
                  <span className="text-muted">₹{v.totalCost?.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-sm overflow-hidden">
                  <div className="bg-red-400 h-full rounded-sm" style={{ width: `${(v.totalCost / maxCost) * 100}%` }} />
                </div>
              </div>
            ))}
            {(!Array.isArray(costByVeh) || costByVeh.length === 0) && <p className="text-sm text-muted">No data</p>}
          </div>
        </div>
      </div>

      {efficiency.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-semibold text-primary">Fuel Efficiency by Vehicle</h2></div>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-xs uppercase tracking-wider text-muted"><th className="px-6 py-3">Vehicle</th><th className="px-6 py-3">Total Liters</th><th className="px-6 py-3">Distance (km)</th><th className="px-6 py-3">Efficiency</th></tr></thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {efficiency.map((e) => (
                <tr key={e.vehicleId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{e.registrationNumber} — {e.vehicleName}</td>
                  <td className="px-6 py-4">{e.totalLiters} L</td>
                  <td className="px-6 py-4">{e.totalDistance} km</td>
                  <td className="px-6 py-4 font-semibold">{e.efficiency != null ? `${e.efficiency} km/L` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expenses?.byType?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-semibold text-primary">Expense Breakdown</h2></div>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-xs uppercase tracking-wider text-muted"><th className="px-6 py-3">Type</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Count</th></tr></thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {expenses.byType.map((e) => (
                <tr key={e.type} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium capitalize">{e.type}</td>
                  <td className="px-6 py-4">₹{e.totalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-4">{e.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function groupByMonth(trips) {
  const months = {};
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (const t of trips) {
    const d = new Date(t.completedAt || t.date || t.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!months[key]) months[key] = { label: names[d.getMonth()], total: 0 };
    months[key].total += t.revenue || 0;
  }
  return Object.values(months);
}

function KpiCard({ title, value, unit, trend, up }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-secondary p-6">
      <p className="text-xs uppercase tracking-wider text-muted mb-2">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-primary">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${up ? 'text-green-600' : 'text-muted'}`}>
          <span className="material-symbols-outlined text-sm">{up ? 'trending_up' : 'horizontal_rule'}</span>
          {trend}
        </div>
      )}
    </div>
  );
}
