import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from './AuthLayout';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await login(form); navigate(location.state?.from?.pathname || '/dashboard', { replace: true }); }
    catch (submitError) { setError(submitError.message); }
    finally { setSubmitting(false); }
  };
  return <AuthLayout eyebrow="Welcome back" subtitle="Sign in to keep your document operations moving." title="Sign in to DocuMind"><form className="space-y-5" onSubmit={handleSubmit}>{error && <div className="form-error"><Icon name="alert" size={16} />{error}</div>}<div><label className="field-label" htmlFor="email">Work email</label><input autoComplete="email" className="field-input" id="email" name="email" onChange={updateField} placeholder="you@company.com" required type="email" value={form.email} /></div><div><div className="mb-2 flex items-center justify-between"><label className="field-label mb-0" htmlFor="password">Password</label><span className="text-xs font-medium text-slate-400">8+ characters</span></div><input autoComplete="current-password" className="field-input" id="password" name="password" onChange={updateField} placeholder="Enter your password" required type="password" value={form.password} /></div><button className="button-primary w-full py-3" disabled={submitting} type="submit">{submitting ? <span className="spinner h-4 w-4 border-white/30 border-t-white" /> : <Icon name="arrow" size={17} />}{submitting ? 'Signing in…' : 'Continue to workspace'}</button></form><p className="mt-7 text-center text-sm text-slate-500">New to DocuMind? <Link className="font-bold text-cyan-700 hover:text-cyan-600" to="/register">Create an account</Link></p></AuthLayout>;
}
