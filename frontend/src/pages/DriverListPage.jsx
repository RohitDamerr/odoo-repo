import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import SearchInput from '../components/ui/SearchInput';
import Button from '../components/ui/Button';

const STATUS_OPTS = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const COLUMNS = [
  {
    key: 'name',
    label: 'Driver',
    render: (v) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {v?.split(' ').map((n) => n[0]).join('').toUpperCase()}
        </div>
        <span className="font-medium">{v}</span>
      </div>
    ),
  },
  { key: 'licenseNumber', label: 'License No.' },
  { key: 'licenseCategory', label: 'Category' },
  {
    key: 'licenseExpiryDate',
    label: 'License Expiry',
    render: (v) => {
      if (!v) return '—';
      const d = new Date(v);
      const expired = d < new Date();
      return (
        <span className={expired ? 'text-error font-semibold' : ''}>
          {d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          {expired && (
            <span className="ml-1.5 inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold bg-error text-white uppercase tracking-wider">
              Expired
            </span>
          )}
        </span>
      );
    },
  },
  { key: 'contactNumber', label: 'Contact' },
  {
    key: 'safetyScore',
    label: 'Safety Score',
    render: (v) => (
      <span className={v < 80 ? 'text-error font-semibold' : ''}>{v != null ? `${v}%` : '—'}</span>
    ),
  },
  { key: 'status', label: 'Status', render: (v) => <Badge label={v} /> },
];

export default function DriverListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDriver = user?.role === 'driver';
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sort: '-createdAt' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/drivers', { params });
      setDrivers(data.data.drivers);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const pillColors = {
    Available: { active: 'bg-green-600 text-white', inactive: 'bg-green-100 text-green-800 border border-green-200', dot: 'bg-green-600' },
    'On Trip': { active: 'bg-blue-600 text-white', inactive: 'bg-blue-100 text-blue-800 border border-blue-200', dot: 'bg-blue-600' },
    'Off Duty': { active: 'bg-gray-700 text-white', inactive: 'bg-gray-100 text-gray-800 border border-gray-300', dot: 'bg-gray-500' },
    Suspended: { active: 'bg-orange-600 text-white', inactive: 'bg-orange-100 text-orange-800 border border-orange-200', dot: 'bg-orange-600' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Driver &amp; Safety Profiles</h1>
          <p className="text-sm text-muted mt-1">Manage active fleet personnel and monitor real-time compliance status.</p>
        </div>
        {!isDriver && (
          <Button onClick={() => navigate('/drivers/new')}>
            <span className="material-symbols-outlined text-lg">add</span>
            Add New Driver
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search drivers, licenses..." />
      </div>

      <div className="flex gap-3">
        {STATUS_OPTS.map((s) => {
          const active = statusFilter === s;
          const c = pillColors[s];
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(active ? '' : s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors ${active ? c.active : c.inactive}`}
            >
              <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : c.dot}`} />
              {s}
            </button>
          );
        })}
      </div>

      <Table
        columns={COLUMNS}
        data={drivers}
        loading={loading}
        onRowClick={(row) => navigate(`/drivers/${row._id}`)}
        emptyMessage="No drivers found. Add your first driver."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <div className="flex items-start gap-2 text-sm text-muted bg-amber-50 border border-amber-200 rounded-lg p-4">
        <span className="material-symbols-outlined text-amber-600 mt-0.5">info</span>
        <p><strong className="text-amber-700">Rule:</strong> Expired license or Suspended status results in automatic blocking from trip assignments in the dispatch queue.</p>
      </div>
    </div>
  );
}
