import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const EMPTY = { vehicle: '', trip: '', liters: '', cost: '', odometer: '', date: new Date().toISOString().slice(0, 10) };

export default function FuelFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get('/vehicles', { params: { limit: 200 } }).then(({ data }) => setVehicles(data.data.vehicles || []));
    if (id) {
      api.get(`/fuel/${id}`).then(({ data }) => {
        const f = data.data.fuelLog;
        setForm({
          vehicle: f.vehicle?._id || '', trip: f.trip?._id || '', liters: f.liters ?? '',
          cost: f.cost ?? '', odometer: f.odometer ?? '', date: f.date ? f.date.slice(0, 10) : '',
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setErrors((p) => ({ ...p, [e.target.name]: '' })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.vehicle) errs.vehicle = 'Vehicle is required';
    if (!form.liters || Number(form.liters) <= 0) errs.liters = 'Liters is required';
    if (!form.cost || Number(form.cost) <= 0) errs.cost = 'Cost is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const payload = { ...form, liters: Number(form.liters), cost: Number(form.cost), odometer: form.odometer ? Number(form.odometer) : null, trip: form.trip || null };
      if (isEdit) await api.patch(`/fuel/${id}`, payload);
      else await api.post('/fuel', payload);
      navigate('/fuel');
    } catch (err) { setErrors({ server: err.response?.data?.message || 'Failed' }); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-4"><h1 className="text-2xl font-bold text-primary">{isEdit ? 'Edit Fuel Log' : 'Log Fuel Transaction'}</h1></div>
      {errors.server && <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm">{errors.server}</div>}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 space-y-5">
        <Select label="Vehicle" name="vehicle" value={form.vehicle} onChange={handleChange} options={vehicles.map((v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.name}` }))} placeholder="Select vehicle" error={errors.vehicle} />
        <Input label="Trip (optional)" name="trip" value={form.trip} onChange={handleChange} placeholder="Trip ID" />
        <div className="grid grid-cols-2 gap-5">
          <Input label="Liters" name="liters" type="number" value={form.liters} onChange={handleChange} placeholder="e.g. 42" required error={errors.liters} />
          <Input label="Cost (₹)" name="cost" type="number" value={form.cost} onChange={handleChange} placeholder="e.g. 3150" required error={errors.cost} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Input label="Odometer Reading" name="odometer" type="number" value={form.odometer} onChange={handleChange} placeholder="e.g. 125000" />
          <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" onClick={() => navigate('/fuel')}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Update' : 'Log Fuel'}</Button>
        </div>
      </form>
    </div>
  );
}
