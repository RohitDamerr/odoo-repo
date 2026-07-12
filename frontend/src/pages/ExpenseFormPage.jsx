import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const TYPES = ['fuel', 'toll', 'maintenance', 'parking', 'repair', 'miscellaneous'].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
const EMPTY = { vehicle: '', trip: '', type: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) };

export default function ExpenseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get('/vehicles', { params: { limit: 200 } }).then(({ data }) => setVehicles(data.data.vehicles || [])).catch(() => {});
    if (id) {
      api.get(`/expenses/${id}`).then(({ data }) => {
        const e = data.data.expense;
        setForm({
          vehicle: e.vehicle?._id || '', trip: e.trip?._id || '', type: e.type || '',
          amount: e.amount ?? '', description: e.description || '', date: e.date ? e.date.slice(0, 10) : '',
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setErrors((p) => ({ ...p, [e.target.name]: '' })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.vehicle) errs.vehicle = 'Vehicle is required';
    if (!form.type) errs.type = 'Type is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Amount is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), trip: form.trip || null };
      if (isEdit) await api.patch(`/expenses/${id}`, payload);
      else await api.post('/expenses', payload);
      navigate('/expenses');
    } catch (err) { setErrors({ server: err.response?.data?.message || 'Failed' }); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-4"><h1 className="text-2xl font-bold text-primary">{isEdit ? 'Edit Expense' : 'Log New Expense'}</h1></div>
      {errors.server && <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm">{errors.server}</div>}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 space-y-5">
        <Select label="Vehicle" name="vehicle" value={form.vehicle} onChange={handleChange} options={vehicles.map((v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.name}` }))} placeholder="Select vehicle" error={errors.vehicle} />
        <Input label="Trip (optional)" name="trip" value={form.trip} onChange={handleChange} placeholder="Trip ID" />
        <Select label="Type" name="type" value={form.type} onChange={handleChange} options={TYPES} placeholder="Select type" error={errors.type} />
        <Input label="Amount (₹)" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="e.g. 350" required error={errors.amount} />
        <Input label="Description" name="description" value={form.description} onChange={handleChange} placeholder="e.g. Highway toll at NH-8" />
        <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" onClick={() => navigate('/expenses')}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Update' : 'Add Expense'}</Button>
        </div>
      </form>
    </div>
  );
}
