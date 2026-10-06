import { Link } from 'react-router-dom';

import Icon from './Icon';

export default function Brand({ light = false }) {
  return <Link className="inline-flex items-center gap-2.5" to="/dashboard"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"><Icon name="sparkles" size={20} strokeWidth={1.9} /></span><span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-slate-950'}`}>Docu<span className={light ? 'text-cyan-300' : 'text-cyan-600'}>Mind</span></span></Link>;
}
