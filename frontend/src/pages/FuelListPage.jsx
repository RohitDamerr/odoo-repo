import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import FilterBar from '../components/ui/FilterBar';

const COLUMNS = [
  { key: 'vehicle', label: 'Vehicle', render: (v) => v ? `${v.registrationNumber} — ${v.name}` : '—' },
  { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  { key: 'liters', label: 'Liters', render: (v) => v != null ? `${v} L` : '—' },
  { key: 'cost', label: 'Cost', render: (v) => v != null ? `₹${v.toLocaleString()}` : '—' },
  { key: 'odometer', label: 'Odometer', render: (v) => v != null ? v.toLocaleString() : '—' },
  { key: 'trip', label: 'Trip', render: (v) => v ? `${v.source || ''} → ${v.destination || ''}` : '—' },
];

export default function FuelListPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [vehicleId, setVehicleId] = useState('');
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get('/vehicles', { params: { limit: 200 } }).then(({ data }) => setVehicles(data.data.vehicles || []));
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sort: '-date' };
      if (vehicleId) params.vehicle = vehicleId;
      const { data } = await api.get('/fuel', { params });
      setLogs(data.data.fuelLogs);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } finally { setLoading(false); }
  }, [page, vehicleId]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Fuel Logs</h1>
          <p className="text-sm text-muted mt-1">Track fuel consumption across the fleet.</p>
        </div>
        <Button onClick={() => navigate('/fuel/new')}>
          <span className="material-symbols-outlined text-lg">add</span>Log Fuel
        </Button>
      </div>

      <FilterBar
        filters={[{
          key: 'vehicle', label: 'Vehicle', value: vehicleId,
          options: vehicles.map((v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.name}` })),
          onChange: (v) => { setVehicleId(v); setPage(1); },
        }]}
        onClear={() => { setVehicleId(''); setPage(1); }}
      />

      <Table columns={COLUMNS} data={logs} loading={loading} onRowClick={(row) => navigate(`/fuel/${row._id}`)} emptyMessage="No fuel logs found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
