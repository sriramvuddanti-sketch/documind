import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from './AuthLayout';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await register(form); navigate('/dashboard', { replace: true }); }
    catch (submitError) { setError(submitError.message); }
    finally { setSubmitting(false); }
  };
  return <AuthLayout eyebrow="Start organizing" subtitle="Create a workspace and bring clarity to every invoice." title="Create your account"><form className="space-y-5" onSubmit={handleSubmit}>{error && <div className="form-error"><Icon name="alert" size={16} />{error}</div>}<div><label className="field-label" htmlFor="name">Full name</label><input autoComplete="name" className="field-input" id="name" maxLength={100} minLength={2} name="name" onChange={updateField} placeholder="Alex Morgan" required value={form.name} /></div><div><label className="field-label" htmlFor="email">Work email</label><input autoComplete="email" className="field-input" id="email" name="email" onChange={updateField} placeholder="you@company.com" required type="email" value={form.email} /></div><div><label className="field-label" htmlFor="password">Password</label><input autoComplete="new-password" className="field-input" id="password" minLength={8} name="password" onChange={updateField} placeholder="At least 8 characters" required type="password" value={form.password} /></div><button className="button-primary w-full py-3" disabled={submitting} type="submit">{submitting ? <span className="spinner h-4 w-4 border-white/30 border-t-white" /> : <Icon name="arrow" size={17} />}{submitting ? 'Creating workspace…' : 'Create workspace'}</button></form><p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link className="font-bold text-cyan-700 hover:text-cyan-600" to="/login">Sign in</Link></p></AuthLayout>;
}
