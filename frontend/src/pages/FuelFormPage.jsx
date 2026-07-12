import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const EMPTY = {
  vehicle: '',
  trip: '',
  liters: '',
  cost: '',
  odometer: '',
  date: new Date().toISOString().slice(0, 10),
};

export default function FuelFormPage() {
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
      .get(`/fuel/${id}`)
      .then(({ data }) => {
        const f = data.data.fuelLog;
        setForm({
          vehicle: f.vehicle?._id || f.vehicle || '',
          trip: f.trip?._id || f.trip || '',
          liters: f.liters ?? '',
          cost: f.cost ?? '',
          odometer: f.odometer ?? '',
          date: f.date ? new Date(f.date).toISOString().slice(0, 10) : '',
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
    if (!form.liters || Number(form.liters) <= 0) errs.liters = 'Liters must be greater than 0';
    if (!form.cost || Number(form.cost) < 0) errs.cost = 'Enter a valid cost';
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
        liters: Number(form.liters),
        cost: Number(form.cost),
        odometer: form.odometer ? Number(form.odometer) : null,
        date: form.date ? new Date(form.date).toISOString() : undefined,
      };

      if (isEdit) {
        await api.patch(`/fuel/${id}`, payload);
      } else {
        await api.post('/fuel', payload);
      }

      navigate('/fuel');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save fuel log';
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
            {isEdit ? 'Edit Fuel Log' : 'Log Fuel Transaction'}
          </h1>
          <p className="text-sm text-muted mt-1">Record a fuel purchase for a vehicle.</p>
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
          <span className="material-symbols-outlined text-secondary">local_gas_station</span>
          Fuel Details
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

          <Input
            label="Liters"
            name="liters"
            type="number"
            value={form.liters}
            onChange={handleChange}
            placeholder="e.g. 45.5"
            required
            error={errors.liters}
          />

          <Input
            label="Cost (₹)"
            name="cost"
            type="number"
            value={form.cost}
            onChange={handleChange}
            placeholder="e.g. 4550"
            required
            error={errors.cost}
          />

          <Input
            label="Odometer Reading (optional)"
            name="odometer"
            type="number"
            value={form.odometer}
            onChange={handleChange}
            placeholder="e.g. 125000"
          />

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
            The odometer reading will sync forward to the vehicle if higher than its
            current reading. A fuel expense record is auto-created for this log.
          </p>
        </div>

        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" onClick={() => navigate('/fuel')}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            <span className="material-symbols-outlined text-lg">save</span>
            {isEdit ? 'Update Fuel Log' : 'Log Fuel'}
          </Button>
        </div>
      </form>
    </div>
  );
}
