import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const STATUS_OPTS = ['Available', 'Off Duty', 'Suspended'].map((v) => ({ value: v, label: v }));

const EMPTY = {
  name: '', licenseNumber: '', licenseCategory: '',
  licenseExpiryDate: '', contactNumber: '', safetyScore: '100', status: 'Available',
};

export default function DriverFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/drivers/${id}`).then(({ data }) => {
      const d = data.data.driver;
      setForm({
        name: d.name || '', licenseNumber: d.licenseNumber || '', licenseCategory: d.licenseCategory || '',
        licenseExpiryDate: d.licenseExpiryDate ? d.licenseExpiryDate.slice(0, 10) : '',
        contactNumber: d.contactNumber || '', safetyScore: d.safetyScore != null ? String(d.safetyScore) : '100',
        status: d.status || 'Available',
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
    if (!form.licenseCategory.trim()) errs.licenseCategory = 'License category is required';
    if (!form.licenseExpiryDate) errs.licenseExpiryDate = 'License expiry date is required';
    if (!form.contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, safetyScore: Number(form.safetyScore) };
      if (isEdit) { delete payload.status; await api.patch(`/api/drivers/${id}`, payload); }
      else { delete payload.status; await api.post('/api/drivers', payload); }
      navigate('/drivers');
    } catch (err) {
      setErrors({ server: err.response?.data?.message || 'Failed to save driver' });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isEdit ? 'Edit Driver' : 'Register New Driver'}</h1>
          <p className="text-sm text-muted mt-1">Enter driver details and license information.</p>
        </div>
      </div>

      {errors.server && <div className="p-3 rounded bg-red-50 border border-red-200 text-error text-sm">{errors.server}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-primary mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">person</span>Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Alex Johnson" required error={errors.name} />
            <Input label="Contact Number" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="e.g. 9876543210" required error={errors.contactNumber} />
            <Input label="Safety Score (0-100)" name="safetyScore" type="number" value={form.safetyScore} onChange={handleChange} />
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-primary mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">badge</span>License Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input label="License Number" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="e.g. DL-2024-00891" required error={errors.licenseNumber} />
            <Input label="License Category" name="licenseCategory" value={form.licenseCategory} onChange={handleChange} placeholder="e.g. Heavy Vehicle" required error={errors.licenseCategory} />
            <Input label="License Expiry Date" name="licenseExpiryDate" type="date" value={form.licenseExpiryDate} onChange={handleChange} required error={errors.licenseExpiryDate} />
          </div>
        </div>

        {isEdit && (
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">settings</span>Status
            </h2>
            <Select label="Driver Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTS} />
            <p className="text-xs text-muted mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              &quot;On Trip&quot; is set automatically during dispatch. Suspended drivers cannot be dispatched.
            </p>
          </div>
        )}

        <div className="md:col-span-2 flex justify-end gap-4 pt-2">
          <Button variant="outline" onClick={() => navigate('/drivers')}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Update Driver' : 'Register Driver'}</Button>
        </div>
      </form>
    </div>
  );
}
