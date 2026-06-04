import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  LayoutDashboard, Package, FolderOpen, Radio, Newspaper,
  Wifi, Video, Users, LogOut, Activity, ChevronRight
} from 'lucide-react';

const links = [
  { to:'/dashboard', icon:LayoutDashboard, label:'Dashboard', roles:['admin','staff','student','it'] },
  { to:'/equipment', icon:Package, label:'Equipment', roles:['admin','staff','student'] },
  { to:'/projects', icon:FolderOpen, label:'Projects', roles:['admin','staff','student'] },
  { to:'/fm', icon:Radio, label:'FM & Radio', roles:['admin','staff'] },
  { to:'/news', icon:Newspaper, label:'News', roles:['admin','staff','student'] },
  { to:'/infrastructure', icon:Wifi, label:'Infrastructure', roles:['admin','staff','student','it'] },
  { to:'/videography', icon:Video, label:'Videography', roles:['admin','staff','student'] },
  { to:'/admin/users', icon:Users, label:'Users', roles:['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const visible = links.filter(l => l.roles.includes(user?.role));
  return (
    <div className="w-64 bg-slate-900 flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <Activity size={16} className="text-white"/>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">BMI Portal</p>
            <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }>
            <Icon size={18}/>
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.initials || user?.full_name?.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-sm transition-all">
          <LogOut size={16}/> Sign out
        </button>
      </div>
    </div>
  );
}