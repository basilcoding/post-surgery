// PatientLoginPage.jsx
import { useState } from 'react'
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuthStore } from '../../store/useAuthStore';

const PatientLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    password: '',
  });

  // destructure login from the store (also using isLoggingIng for button state)
  const { login, isLoggingIng } = useAuthStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      patientId: formData.patientId.trim(),
      password: formData.password,
    };

    login(payload);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="w-full max-w-md">
        <div className="card shadow-xl bg-base-100">
          <div className="card-body p-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Login</h2>
                <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="input-group input-group-vertical">
                <span className="text-sm">Patient ID</span>
                <div className="relative">
                  <input
                    name="patientId"
                    type="text"
                    value={formData.patientId}
                    onChange={handleChange}
                    placeholder="PAT-2025/2500"
                    required
                    className="input input-bordered w-full pl-10 mt-1 mb-5"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </label>

              <label className="input-group input-group-vertical">
                <span className="text-sm">Password</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </span>

                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    required
                    className="input input-bordered w-full pl-10 pr-10 mt-1 mb-5"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="absolute top-3 right-0 pr-3 flex items-center z-50"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-base-content/40" />
                    ) : (
                      <Eye className="h-5 w-5 text-base-content/40" />
                    )}
                  </button>
                </div>
              </label>

              <div>
                <button
                  type="submit"
                  className={`btn btn-primary btn-block ${isLoggingIng ? 'loading' : ''}`}
                  disabled={isLoggingIng}
                >
                  {isLoggingIng ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* small footer */}
        <div className="text-center mt-4 text-xs text-muted-foreground">
          <p>By signing in you agree to our <Link to="/terms" className="link">Terms</Link>.</p>
        </div>
      </div>
    </div>
  );
};

export default PatientLoginPage;
