import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuthStore } from '../../store/auth';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import { Package, FolderOpen, Radio, Newspaper, Wifi, MessageSquare, Video, Users, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/auth/dashboard/').then(r => r.data),
    refetchInterval: 60000,
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">{user?.department} · {user?.role}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickLink to="/equipment" icon={Package} label="Equipment" desc="Request or return gear" color="teal"/>
          <QuickLink to="/projects" icon={FolderOpen} label="Projects" desc="Submit and track work" color="blue"/>
          <QuickLink to="/news" icon={Newspaper} label="News" desc="Write and read stories" color="amber"/>
          <QuickLink to="/infrastructure" icon={Wifi} label="Wi-Fi & Support" desc="Access & complaints" color="purple"/>
          <QuickLink to="/videography" icon={Video} label="Videography" desc="Book a shoot" color="green"/>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>;
  const d = data || {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Last updated: {formatDateTime(new Date())}</p>
      </div>

      {/* FM Status Banner */}
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-4 ${d.fm?.on_air ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-300'}`}>
        <div className={`w-3 h-3 rounded-full ${d.fm?.on_air ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-ping'}`}/>
        <span className={`font-bold text-lg ${d.fm?.on_air ? 'text-green-700' : 'text-red-700'}`}>
          {d.fm?.on_air ? '● ON AIR' : '● OFF AIR'}
        </span>
        <span className="text-sm text-gray-500">FM Station Status</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Equipment On Loan" value={d.equipment?.on_loan} icon={Package} color="teal"/>
        <StatCard title="Overdue Returns" value={d.equipment?.overdue} icon={AlertTriangle} color="coral"/>
        <StatCard title="Pending Reviews" value={d.projects?.pending_review} icon={FolderOpen} color="navy"/>
        <StatCard title="News Pending" value={d.news?.pending_review} icon={Newspaper} color="amber"/>
        <StatCard title="Open Tickets" value={d.feedback?.open_tickets} icon={MessageSquare} color="purple"/>
        <StatCard title="Wi-Fi Requests" value={d.wifi?.pending_requests} icon={Wifi} color="teal"/>
        <StatCard title="This Week Shoots" value={d.videography?.shoots_this_week} icon={Video} color="green"/>
        <StatCard title="Total Users" value={d.users?.total} icon={Users} color="navy"/>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">System Overview</h3>
          <div className="space-y-3">
            {[
              { label:'Students', value: d.users?.students, max: d.users?.total },
              { label:'Staff', value: d.users?.staff, max: d.users?.total },
              { label:'Equipment Available', value: (d.equipment?.total||0)-(d.equipment?.on_loan||0)-(d.equipment?.under_repair||0), max: d.equipment?.total },
            ].map(({ label, value, max }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium">{value}/{max}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: max ? `${(value/max)*100}%` : '0%' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Alerts</h3>
          <div className="space-y-3">
            {d.equipment?.overdue > 0 && <Alert color="red" text={`${d.equipment.overdue} overdue returns`}/>}
            {d.feedback?.critical > 0 && <Alert color="red" text={`${d.feedback.critical} critical tickets`}/>}
            {d.subscriptions?.expiring_soon > 0 && <Alert color="amber" text={`${d.subscriptions.expiring_soon} licences expiring`}/>}
            {d.projects?.pending_review > 0 && <Alert color="blue" text={`${d.projects.pending_review} projects to review`}/>}
            {!d.equipment?.overdue && !d.feedback?.critical && !d.subscriptions?.expiring_soon && !d.projects?.pending_review && (
              <p className="text-green-600 text-sm font-medium">✓ All clear</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Alert({ color, text }) {
  const c = { red:'bg-red-50 text-red-700 border-red-200', amber:'bg-amber-50 text-amber-700 border-amber-200', blue:'bg-blue-50 text-blue-700 border-blue-200' };
  return <div className={`text-xs px-3 py-2 rounded-lg border ${c[color]}`}>{text}</div>;
}

function QuickLink({ to, icon: Icon, label, desc, color }) {
  const colors = { teal:'bg-teal-50 text-teal-600', blue:'bg-blue-50 text-blue-600', amber:'bg-amber-50 text-amber-600', purple:'bg-purple-50 text-purple-600', green:'bg-green-50 text-green-600' };
  return (
    <a href={to} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:border-teal-300 hover:shadow-md transition-all group">
      <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={22}/></div>
      <div>
        <p className="font-semibold text-gray-900 group-hover:text-teal-700">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </a>
  );
}