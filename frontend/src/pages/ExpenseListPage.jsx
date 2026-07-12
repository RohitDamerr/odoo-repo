import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import FilterBar from '../components/ui/FilterBar';

const TYPES = ['fuel', 'toll', 'maintenance', 'parking', 'repair', 'miscellaneous'].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

const COLUMNS = [
  { key: 'vehicle', label: 'Vehicle', render: (v) => v ? `${v.registrationNumber}` : '—' },
  { key: 'trip', label: 'Trip', render: (v) => v ? `${v.source || ''} → ${v.destination || ''}` : '—' },
  { key: 'type', label: 'Type', render: (v) => <Badge label={v} /> },
  { key: 'amount', label: 'Amount', render: (v) => v != null ? `₹${v.toLocaleString()}` : '—' },
  { key: 'description', label: 'Description', render: (v) => v?.length > 25 ? v.slice(0, 25) + '...' : v || '—' },
  { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
];

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get('/vehicles', { params: { limit: 200 } }).then(({ data }) => setVehicles(data.data.vehicles || [])).catch(() => {});
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sort: '-date' };
      if (typeFilter) params.type = typeFilter;
      if (vehicleId) params.vehicle = vehicleId;
      const { data } = await api.get('/expenses', { params });
      setExpenses(data.data.expenses);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } finally { setLoading(false); }
  }, [page, typeFilter, vehicleId]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Expenses</h1>
          <p className="text-sm text-muted mt-1">Track tolls, parking, repairs &amp; misc costs.</p>
        </div>
        <Button onClick={() => navigate('/expenses/new')}>
          <span className="material-symbols-outlined text-lg">add</span>Add Expense
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {TYPES.map((t) => {
          const active = typeFilter === t.value;
          return (
            <button key={t.value} onClick={() => { setTypeFilter(active ? '' : t.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
              {t.label}
            </button>
          );
        })}
      </div>

      <FilterBar
        filters={[{
          key: 'vehicle', label: 'Vehicle', value: vehicleId,
          options: vehicles.map((v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.name}` })),
          onChange: (v) => { setVehicleId(v); setPage(1); },
        }]}
        onClear={() => { setVehicleId(''); setPage(1); }}
      />

      <Table columns={COLUMNS} data={expenses} loading={loading} onRowClick={(row) => navigate(`/expenses/${row._id}`)} emptyMessage="No expenses found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
