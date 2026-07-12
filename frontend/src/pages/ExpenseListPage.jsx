import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import SearchInput from '../components/ui/SearchInput';
import Button from '../components/ui/Button';

const TYPE_OPTS = ['fuel', 'toll', 'maintenance', 'parking', 'repair', 'miscellaneous'];

const TYPE_BADGES = {
  fuel: 'bg-green-100 text-green-800 border border-green-200',
  toll: 'bg-orange-100 text-orange-800 border border-orange-200',
  maintenance: 'bg-gray-100 text-gray-800 border border-gray-300',
  parking: 'bg-blue-100 text-blue-800 border border-blue-200',
  repair: 'bg-red-100 text-red-800 border border-red-200',
  miscellaneous: 'bg-purple-100 text-purple-800 border border-purple-200',
};

const COLUMNS = [
  {
    key: 'vehicle',
    label: 'Vehicle',
    render: (v) =>
      v ? `${v.registrationNumber} — ${v.name}` : '—',
  },
  {
    key: 'trip',
    label: 'Trip',
    render: (v) =>
      v ? `${v.source} → ${v.destination}` : '—',
  },
  {
    key: 'type',
    label: 'Type',
    render: (v) => (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          TYPE_BADGES[v] || 'bg-gray-100 text-gray-800 border border-gray-300'
        }`}
      >
        {v}
      </span>
    ),
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (v) => (v != null ? `₹${v.toLocaleString()}` : '—'),
  },
  {
    key: 'date',
    label: 'Date',
    render: (v) =>
      v
        ? new Date(v).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '—',
  },
  {
    key: 'description',
    label: 'Description',
    render: (v) =>
      v ? (
        <span className="truncate max-w-[200px] inline-block" title={v}>
          {v}
        </span>
      ) : (
        '—'
      ),
  },
];

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sort: '-date' };
      if (typeFilter) params.type = typeFilter;
      if (vehicleFilter) params.vehicle = vehicleFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get('/expenses', { params });
      setExpenses(data.data.expenses);
      setTotalPages(data.data.pagination?.totalPages || 1);

      let totalAmount = 0;
      (data.data.expenses || []).forEach((e) => {
        totalAmount += e.amount || 0;
      });
      setSummary({ totalAmount: +totalAmount.toFixed(2) });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, vehicleFilter, startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Expenses</h1>
          <p className="text-sm text-muted mt-1">
            Track tolls, parking, repairs &amp; misc costs.
          </p>
        </div>
        <Button onClick={() => navigate('/expenses/new')}>
          <span className="material-symbols-outlined text-lg">add</span>
          Add Expense
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => { setTypeFilter(''); setPage(1); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            !typeFilter
              ? 'bg-gray-700 text-white'
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}
        >
          All
        </button>
        {TYPE_OPTS.map((t) => {
          const active = typeFilter === t;
          const colorMap = {
            fuel: active ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border border-green-200',
            toll: active ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 border border-orange-200',
            maintenance: active ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-300',
            parking: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200',
            repair: active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200',
            miscellaneous: active ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200',
          };
          return (
            <button
              key={t}
              onClick={() => { setTypeFilter(active ? '' : t); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize flex items-center gap-2 transition-colors ${colorMap[t]}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  active ? 'bg-white' : t === 'fuel'
                    ? 'bg-green-500'
                    : t === 'toll'
                    ? 'bg-orange-500'
                    : t === 'maintenance'
                    ? 'bg-gray-500'
                    : t === 'parking'
                    ? 'bg-blue-500'
                    : t === 'repair'
                    ? 'bg-red-500'
                    : 'bg-purple-500'
                }`}
              />
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={vehicleFilter}
          onChange={(v) => { setVehicleFilter(v); setPage(1); }}
          placeholder="Filter by vehicle ID..."
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
          />
          <span className="text-muted text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        {(typeFilter || vehicleFilter || startDate || endDate) && (
          <button
            onClick={() => {
              setTypeFilter('');
              setVehicleFilter('');
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
            className="text-sm text-secondary hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Clear Filters
          </button>
        )}
      </div>

      <Table
        columns={COLUMNS}
        data={expenses}
        loading={loading}
        onRowClick={(row) => navigate(`/expenses/${row._id}`)}
        emptyMessage="No expenses found. Add your first expense."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-4">
          <span className="material-symbols-outlined text-blue-600">receipt_long</span>
          <div>
            <span className="text-sm text-muted">Total Expenses (this page): </span>
            <span className="font-semibold text-on-surface">
              ₹{summary.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-sm text-muted bg-amber-50 border border-amber-200 rounded-lg p-4">
        <span className="material-symbols-outlined text-amber-600 mt-0.5">info</span>
        <p>
          <strong className="text-amber-700">Auto-categorization:</strong> Fuel logs and closed
          maintenance jobs automatically create expense records with the appropriate type.
        </p>
      </div>
    </div>
  );
}
