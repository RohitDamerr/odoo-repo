import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const TYPE_OPTS = [
  { value: 'toll', label: 'Toll' },
  { value: 'parking', label: 'Parking' },
  { value: 'repair', label: 'Repair' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const EMPTY = {
  vehicle: '',
  trip: '',
  type: '',
  amount: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
};

export default function ExpenseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/vehicles', { params: { limit: 100 } }),
      api.get('/trips', { params: { limit: 100 } }),
    ]).then(([vRes, tRes]) => {
      setVehicles(vRes.data.data.vehicles || []);
      setTrips(tRes.data.data.trips || []);
    });

    if (!id) return;
    api
      .get(`/expenses/${id}`)
      .then(({ data }) => {
        const e = data.data.expense;
        setForm({
          vehicle: e.vehicle?._id || e.vehicle || '',
          trip: e.trip?._id || e.trip || '',
          type: e.type || '',
          amount: e.amount ?? '',
          description: e.description || '',
          date: e.date ? new Date(e.date).toISOString().slice(0, 10) : '',
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.vehicle) errs.vehicle = 'Vehicle is required';
    if (!form.type) errs.type = 'Expense type is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Amount must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        vehicle: form.vehicle,
        trip: form.trip || null,
        type: form.type,
        amount: Number(form.amount),
        description: form.description || undefined,
        date: form.date ? new Date(form.date).toISOString() : undefined,
      };

      if (isEdit) {
        await api.patch(`/expenses/${id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      navigate('/expenses');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save expense';
      setErrors({ server: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {isEdit ? 'Edit Expense' : 'Log New Expense'}
          </h1>
          <p className="text-sm text-muted mt-1">Record toll, parking, repair, or other costs.</p>
        </div>
      </div>

      {errors.server && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm">
          {errors.server}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border border-gray-200 space-y-5"
      >
        <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">receipt_long</span>
          Expense Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select
            label="Vehicle"
            name="vehicle"
            value={form.vehicle}
            onChange={handleChange}
            options={vehicles.map((v) => ({
              value: v._id,
              label: `${v.registrationNumber} — ${v.name}`,
            }))}
            placeholder="Select vehicle"
            error={errors.vehicle}
          />

          <Select
            label="Trip (optional)"
            name="trip"
            value={form.trip}
            onChange={handleChange}
            options={[
              { value: '', label: 'No trip linked' },
              ...trips.map((t) => ({
                value: t._id,
                label: `${t.source} → ${t.destination} (${t.status})`,
              })),
            ]}
            placeholder="Select trip"
          />

          <Select
            label="Expense Type"
            name="type"
            value={form.type}
            onChange={handleChange}
            options={TYPE_OPTS}
            placeholder="Select type"
            error={errors.type}
          />

          <Input
            label="Amount (₹)"
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            placeholder="e.g. 350"
            required
            error={errors.amount}
          />

          <div className="md:col-span-2">
            <Input
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="e.g. Highway toll at NH-8"
            />
          </div>

          <Input
            label="Date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded flex items-start gap-3 text-sm text-muted">
          <span className="material-symbols-outlined text-secondary">info</span>
          <p>
            Auto-generated expenses (from fuel logs &amp; closed maintenance) will appear
            with the <strong>[Auto]</strong> prefix in the description.
          </p>
        </div>

        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" onClick={() => navigate('/expenses')}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            <span className="material-symbols-outlined text-lg">save</span>
            {isEdit ? 'Update Expense' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
}
