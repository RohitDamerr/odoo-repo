import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const EMPTY = { source: '', destination: '', vehicle: '', driver: '', cargoWeight: '', plannedDistance: '', revenue: '0' };

export default function TripFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [capacityErr, setCapacityErr] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/vehicles', { params: { status: 'Available', limit: 100 } }),
      api.get('/drivers', { params: { status: 'Available', limit: 100 } }),
    ]).then(([vRes, dRes]) => {
      setVehicles(vRes.data.data.vehicles || []);
      setDrivers(dRes.data.data.drivers || []);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));

    if (name === 'cargoWeight' || name === 'vehicle') {
      const vid = name === 'vehicle' ? value : form.vehicle;
      const cw = Number(name === 'cargoWeight' ? value : form.cargoWeight);
      const veh = vehicles.find((v) => v._id === vid);
      if (veh && cw > veh.maxLoadCapacity) {
        setCapacityErr(`Capacity exceeded: Vehicle max ${veh.maxLoadCapacity} kg, cargo ${cw} kg (${cw - veh.maxLoadCapacity} kg over)`);
      } else {
        setCapacityErr(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.source.trim()) errs.source = 'Source is required';
    if (!form.destination.trim()) errs.destination = 'Destination is required';
    if (!form.vehicle) errs.vehicle = 'Vehicle is required';
    if (!form.driver) errs.driver = 'Driver is required';
    if (!form.cargoWeight || Number(form.cargoWeight) <= 0) errs.cargoWeight = 'Cargo weight is required';
    if (!form.plannedDistance || Number(form.plannedDistance) <= 0) errs.plannedDistance = 'Planned distance is required';
    if (capacityErr) errs.cargoWeight = capacityErr;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await api.post('/trips', {
        ...form,
        cargoWeight: Number(form.cargoWeight),
        plannedDistance: Number(form.plannedDistance),
        revenue: Number(form.revenue) || 0,
      });
      navigate('/trips');
    } catch (err) {
      setErrors({ server: err.response?.data?.message || 'Failed to create trip' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Create Trip</h1>
          <p className="text-sm text-muted mt-1">Plan a new trip and assign vehicle &amp; driver.</p>
        </div>
      </div>

      {errors.server && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm">{errors.server}</div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="md:col-span-2 text-lg font-semibold text-primary flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary">route</span>
            Trip Details
          </h2>

          <Input label="Source" name="source" value={form.source} onChange={handleChange} placeholder="e.g. Gandhinagar Depot" required error={errors.source} />
          <Input label="Destination" name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Ahmedabad Hub" required error={errors.destination} />

          <Select
            label="Vehicle (Available only)"
            name="vehicle"
            value={form.vehicle}
            onChange={handleChange}
            options={vehicles.map((v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.name} (${v.maxLoadCapacity} kg)` }))}
            placeholder="Select vehicle"
            error={errors.vehicle}
          />
          <Select
            label="Driver (Available only)"
            name="driver"
            value={form.driver}
            onChange={handleChange}
            options={drivers.map((d) => ({ value: d._id, label: `${d.name} (${d.licenseNumber})` }))}
            placeholder="Select driver"
            error={errors.driver}
          />

          <Input label="Cargo Weight (kg)" name="cargoWeight" type="number" value={form.cargoWeight} onChange={handleChange} placeholder="e.g. 450" required error={errors.cargoWeight} />
          <Input label="Planned Distance (km)" name="plannedDistance" type="number" value={form.plannedDistance} onChange={handleChange} placeholder="e.g. 38" required error={errors.plannedDistance} />
          <Input label="Revenue (₹)" name="revenue" type="number" value={form.revenue} onChange={handleChange} placeholder="e.g. 12000" />
        </div>

        <div className="space-y-5 bg-white p-6 rounded-xl border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">timeline</span>
            Trip Lifecycle
          </h2>
          <Lifecycle />
          {capacityErr && (
            <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500 space-y-2">
              <p className="text-sm font-semibold text-red-800">Capacity Exceeded</p>
              <p className="text-xs text-red-700">{capacityErr}</p>
              <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">block</span>
                Dispatch blocked
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 flex justify-end gap-4 pt-2">
          <Button variant="outline" onClick={() => navigate('/trips')}>Cancel</Button>
          <Button type="submit" loading={saving} disabled={!!capacityErr}>
            <span className="material-symbols-outlined text-lg">send</span>
            Create Trip
          </Button>
        </div>
      </form>
    </div>
  );
}

function Lifecycle() {
  const steps = [
    { label: 'Draft', color: 'bg-green-500', text: 'text-green-600' },
    { label: 'Dispatched', color: 'bg-blue-500', text: 'text-blue-600' },
    { label: 'Completed', color: 'bg-gray-300', text: 'text-gray-400' },
    { label: 'Cancelled', color: 'bg-gray-300', text: 'text-gray-400' },
  ];
  return (
    <div className="relative pt-4 pb-2">
      <div className="absolute top-[22px] left-0 w-full h-0.5 bg-gray-200" />
      <div className="relative flex justify-between">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center relative z-10">
            <div className={`w-5 h-5 rounded-full ${s.color} border-4 border-white shadow-sm`} />
            <span className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
