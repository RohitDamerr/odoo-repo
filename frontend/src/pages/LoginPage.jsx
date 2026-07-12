import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    login(email, password);
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
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBgPk4GpxmjE5HJjRTK8yV-5QLrPypbET0uSraoPEtmzOlIuOS1TRpDo_7xoTFocXeRcHbkQXmRVggWD5zLR5Mbd8yGl-OQAi7KW8J9b2Q7fdEypz6eOip0MBodM_X8WAXLXIUqQ4EP0c-3NxTw441QKHVZPu6VjpkMTQpBXGyCVR_i1HK9zjERM4AAcU9QlOJWduwTf9lxt4Y2h3j6uhNkQj6ScU7psrnWSga8fcsxMf7pAv5yLNEq34VVhMLvlBpQI9mNBZyR10p_')" }}>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-md relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-accent"></div>

          <div className="p-8 md:p-10 pl-10 md:pl-12">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-primary mb-2">Sign In</h1>
              <p className="text-base text-muted">Access your command center.</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 text-error text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted mb-1 font-medium" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary focus:border-2 transition-colors text-sm text-on-surface"
                    placeholder="coordinator@transitops.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-muted mb-1 font-medium" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary focus:border-2 transition-colors text-sm text-on-surface"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="remember" className="text-sm text-muted">Remember me</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded bg-primary text-white font-semibold text-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-secondary font-semibold hover:text-primary transition-colors">
                Create an account
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
