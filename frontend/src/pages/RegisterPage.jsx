import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loading, error, setError } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'driver',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, role } = form;

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    register({ name, email, password, role });
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-white w-full">
        <div className="flex justify-between items-center px-8 py-6 max-w-[1440px] mx-auto">
          <span className="text-3xl font-bold text-primary tracking-tight">TransitOps</span>
          <span className="text-muted text-sm">Contact Support</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center relative px-4 py-12">
        <div className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxPwGe8l5Y67WVpOC_LSGynYGs1jMNuxlLF6dqNAUUpAAmyjmS8hZuFbkgFfUR4xWMaFrhIMDP9gsSsaNxofkjtGcZcxB2ZvEjH32nnz07KxOBmZhmuRmKnvngVwb-h9swJr6BhbiBzQ1M93wIeHxPQELiQkKLQHioOlADGy_9-FfL2RQ4ux0ywqecAG-sVau7EZ4NuJjjj6dhtQvM1rgmlmRajJM10BWbtiuR_y2kOPINi8-z7-IL1_He5wpn6dRwn5CeB_E6dfrV')" }}>
        </div>

        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden">
          <div className="h-1 bg-primary w-full"></div>

          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">TransitOps</h1>
              <p className="text-base text-muted">Create your logistics management account.</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 text-error text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted mb-1 font-medium" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-3 bg-white text-on-surface focus:outline-none focus:border-primary focus:border-2 transition-colors text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted mb-1 font-medium" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-3 bg-white text-on-surface focus:outline-none focus:border-primary focus:border-2 transition-colors text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted mb-1 font-medium" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-3 bg-white text-on-surface focus:outline-none focus:border-primary focus:border-2 transition-colors text-sm"
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted mb-1 font-medium" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-3 bg-white text-on-surface focus:outline-none focus:border-primary focus:border-2 transition-colors text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-muted mb-1 font-medium" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded p-3 bg-white text-on-surface focus:outline-none focus:border-primary focus:border-2 transition-colors text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="fleet_manager">Fleet Manager</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="safety_officer">Safety Officer</option>
                  <option value="financial_analyst">Financial Analyst</option>
                  <option value="driver">Driver</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-semibold text-sm py-4 rounded hover:bg-primary-light transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Register Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:text-secondary transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 max-w-[1440px] mx-auto gap-4">
          <span className="text-lg font-bold text-primary">TransitOps</span>
          <div className="flex gap-6 text-sm text-muted">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
            <span>Help Center</span>
          </div>
          <span className="text-sm text-gray-400">&copy; 2024 TransitOps Logistics. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
