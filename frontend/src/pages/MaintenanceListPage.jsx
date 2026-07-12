import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import FilterBar from '../components/ui/FilterBar';

const TYPES = ['Oil Change', 'Tire Replacement', 'Engine Repair', 'Brake Service', 'General Service', 'Inspection', 'Other'].map((v) => ({ value: v, label: v }));
const STATUS_OPTS = ['Active', 'Closed'].map((v) => ({ value: v, label: v }));

const EMPTY = { vehicle: '', type: '', description: '', cost: '', startDate: new Date().toISOString().slice(0, 10), notes: '' };

const COLUMNS = [
  { key: 'vehicle', label: 'Vehicle', render: (v) => v ? `${v.registrationNumber} — ${v.name}` : '—' },
  { key: 'type', label: 'Service' },
  { key: 'description', label: 'Description', render: (v) => v?.length > 30 ? v.slice(0, 30) + '...' : v },
  { key: 'cost', label: 'Cost', render: (v) => v != null ? `₹${v.toLocaleString()}` : '—' },
  { key: 'startDate', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  { key: 'status', label: 'Status', render: (v) => <Badge label={v} /> },
  {
    key: 'actions',
    label: '',
    render: (_, row) => (
      <button onClick={(e) => { e.stopPropagation(); }}>
        <span className="material-symbols-outlined text-muted hover:text-primary">more_vert</span>
      </button>
    ),
  },
];

export default function MaintenanceListPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [form, setForm] = useState(EMPTY);
  const [vehicles, setVehicles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/vehicles', { params: { limit: 200 } }).then(({ data }) => {
      setVehicles(data.data.vehicles || []);
    });
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: '-createdAt' };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get('/maintenance', { params });
      setLogs(data.data.logs);
      setTotalPages(data.data.totalPages || 1);
    } finally { setLoading(false); }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFormChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.vehicle) errs.vehicle = 'Vehicle is required';
    if (!form.type) errs.type = 'Type is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await api.post('/maintenance', {
        ...form,
        cost: Number(form.cost) || 0,
        startDate: form.startDate || new Date().toISOString(),
      });
      setForm(EMPTY);
      fetchLogs();
    } catch (err) {
      setErrors({ server: err.response?.data?.message || 'Failed' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Maintenance Management</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-secondary p-6">
          <h2 className="text-lg font-semibold text-primary mb-5 uppercase tracking-wider text-sm border-b pb-2">Log Service Record</h2>

          {errors.server && <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm mb-4">{errors.server}</div>}

          <form onSubmit={handleCreate} className="space-y-4">
            <Select label="Vehicle" name="vehicle" value={form.vehicle} onChange={handleFormChange} options={vehicles.map((v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.name}` }))} placeholder="Select vehicle" error={errors.vehicle} />
            <Select label="Service Type" name="type" value={form.type} onChange={handleFormChange} options={TYPES} placeholder="Select type" error={errors.type} />
            <Input label="Description" name="description" value={form.description} onChange={handleFormChange} placeholder="e.g. Oil Change" required error={errors.description} />
            <Input label="Cost (₹)" name="cost" type="number" value={form.cost} onChange={handleFormChange} placeholder="e.g. 2500" />
            <Input label="Date" name="startDate" type="date" value={form.startDate} onChange={handleFormChange} />
            <Input label="Notes" name="notes" value={form.notes} onChange={handleFormChange} placeholder="Additional notes..." />
            <Button type="submit" loading={saving} className="w-full">
              <span className="material-symbols-outlined text-lg">save</span>Save Record
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-3 border border-gray-200 text-sm">
              <span className="material-symbols-outlined text-amber-600 mt-0.5">info</span>
              <div>
                <p className="text-xs font-bold text-muted mb-1">DISPATCH RULE</p>
                <p className="text-sm">Vehicles marked as <span className="text-amber-600 font-semibold">In Shop</span> are automatically removed from the active dispatch pool.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 border-l-4 border-l-primary overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-primary">Service Logs</h2>
            <FilterBar
              filters={[
                { key: 'status', label: 'Status', options: STATUS_OPTS, value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1); } },
                { key: 'type', label: 'Type', options: TYPES, value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(1); } },
              ]}
              onClear={() => { setStatusFilter(''); setTypeFilter(''); setPage(1); }}
            />
          </div>

          <Table
            columns={COLUMNS}
            data={logs}
            loading={loading}
            onRowClick={(row) => navigate(`/maintenance/${row._id}`)}
            emptyMessage="No maintenance records found."
          />

          <div className="p-4 border-t border-gray-200">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
}
