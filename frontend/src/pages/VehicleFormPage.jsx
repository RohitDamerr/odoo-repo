import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const TYPE_OPTS = ['Truck', 'Van', 'Pickup', 'Trailer', 'Bus', 'Car', 'Other'].map((v) => ({ value: v, label: v }));
const STATUS_OPTS = ['Available', 'On Trip', 'In Shop', 'Retired'].map((v) => ({ value: v, label: v }));

const EMPTY = {
  registrationNumber: '',
  name: '',
  type: '',
  maxLoadCapacity: '',
  odometer: '',
  acquisitionCost: '',
  fuelType: '',
  registrationExpiryDate: '',
  status: 'Available',
};

export default function VehicleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    api.get(`/vehicles/${id}`).then(({ data }) => {
      const v = data.data.vehicle;
      setForm({
        registrationNumber: v.registrationNumber || '',
        name: v.name || '',
        type: v.type || '',
        maxLoadCapacity: v.maxLoadCapacity ?? '',
        odometer: v.odometer ?? '',
        acquisitionCost: v.acquisitionCost ?? '',
        fuelType: v.fuelType || '',
        registrationExpiryDate: v.registrationExpiryDate ? v.registrationExpiryDate.slice(0, 10) : '',
        status: v.status || 'Available',
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.registrationNumber.trim()) errs.registrationNumber = 'Registration number is required';
    if (!form.name.trim()) errs.name = 'Vehicle name is required';
    if (!form.type) errs.type = 'Type is required';
    if (!form.maxLoadCapacity || Number(form.maxLoadCapacity) < 0) errs.maxLoadCapacity = 'Enter a valid capacity';
    if (!form.acquisitionCost || Number(form.acquisitionCost) < 0) errs.acquisitionCost = 'Enter a valid cost';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        maxLoadCapacity: Number(form.maxLoadCapacity),
        odometer: Number(form.odometer) || 0,
        acquisitionCost: Number(form.acquisitionCost),
        fuelType: form.fuelType || null,
        registrationExpiryDate: form.registrationExpiryDate || null,
      };

      if (isEdit) {
        await api.put(`/vehicles/${id}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }

      navigate('/vehicles');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save vehicle';
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isEdit ? 'Edit Vehicle' : 'Register New Vehicle'}</h1>
          <p className="text-sm text-muted mt-1">Enter asset details to add to the fleet registry.</p>
        </div>
      </div>

      {errors.server && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm">{errors.server}</div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 space-y-5">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">badge</span>
            Vehicle Identification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Registration Number" name="registrationNumber" value={form.registrationNumber} onChange={handleChange} placeholder="e.g. ABC-1234" required error={errors.registrationNumber} />
            <Input label="Vehicle Name / Model" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Freightliner Cascadia" required error={errors.name} />
            <Select label="Vehicle Type" name="type" value={form.type} onChange={handleChange} options={TYPE_OPTS} placeholder="Select type" error={errors.type} />
            <Input label="Max Load Capacity (kg)" name="maxLoadCapacity" type="number" value={form.maxLoadCapacity} onChange={handleChange} placeholder="e.g. 24000" required error={errors.maxLoadCapacity} />
            <Input label="Current Odometer" name="odometer" type="number" value={form.odometer} onChange={handleChange} placeholder="e.g. 152000" />
            <Input label="Acquisition Cost (₹)" name="acquisitionCost" type="number" value={form.acquisitionCost} onChange={handleChange} placeholder="e.g. 85000" required error={errors.acquisitionCost} />
            <Select label="Fuel Type" name="fuelType" value={form.fuelType} onChange={handleChange} options={[
              { value: '', label: 'Select fuel type' },
              { value: 'Diesel', label: 'Diesel' },
              { value: 'Electric', label: 'Electric (EV)' },
              { value: 'Hybrid', label: 'Hybrid' },
              { value: 'Gasoline', label: 'Gasoline' },
            ]} />
            <Input label="Registration Expiry Date" name="registrationExpiryDate" type="date" value={form.registrationExpiryDate} onChange={handleChange} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-5 h-fit">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">settings</span>
            Status
          </h2>

          <Select label="Vehicle Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTS} />

          <div className="bg-gray-50 p-4 rounded flex items-start gap-3 text-sm text-muted">
            <span className="material-symbols-outlined text-secondary">info</span>
            <p>Retired or In Shop vehicles are hidden from the Trip Dispatcher view.</p>
          </div>
        </div>

        <div className="lg:col-span-3 flex justify-end gap-4 pt-2">
          <Button variant="outline" onClick={() => navigate('/vehicles')}>Cancel</Button>
          <Button type="submit" loading={saving}>
            <span className="material-symbols-outlined text-lg">how_to_reg</span>
            {isEdit ? 'Update Vehicle' : 'Register Vehicle'}
          </Button>
        </div>
      </form>
    </div>
  );
}
