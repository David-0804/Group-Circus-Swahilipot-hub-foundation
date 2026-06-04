import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuthStore } from '../../store/auth';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Radio, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

export default function FM() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [downModal, setDownModal] = useState(false);
  const [desc, setDesc] = useState('');

  const { data: statuses, isLoading } = useQuery({
    queryKey: ['fm-status'],
    queryFn: () => api.get('/fm/status/').then(r => r.data.results || r.data),
    refetchInterval: 30000,
  });

  const { data: outages } = useQuery({
    queryKey: ['fm-outages'],
    queryFn: () => api.get('/fm/outages/').then(r => r.data.results || r.data),
  });

  const { data: schedule } = useQuery({
    queryKey: ['radio-schedule'],
    queryFn: () => api.get('/fm/schedule/').then(r => r.data.results || r.data),
  });

  const reportDown = useMutation({
    mutationFn: (d) => api.post('/fm/report-down/', d),
    onSuccess: () => { toast.success('Outage reported'); qc.invalidateQueries(['fm-status']); qc.invalidateQueries(['fm-outages']); setDownModal(false); setDesc(''); },
    onError: () => toast.error('Failed to report'),
  });

  const reportUp = useMutation({
    mutationFn: (d) => api.post('/fm/report-up/', d),
    onSuccess: () => { toast.success('Station restored ✓'); qc.invalidateQueries(['fm-status']); qc.invalidateQueries(['fm-outages']); },
  });

  const statusList = Array.isArray(statuses) ? statuses : [];
  const outageList = Array.isArray(outages) ? outages : [];
  const scheduleList = Array.isArray(schedule) ? schedule : [];
  const isOffAir = statusList.some(s => s.status === 'off_air');
  const primaryFreqId = statusList[0]?.frequency;

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>;

  return (
    <div>
      <PageHeader title="FM & Radio" subtitle="Station status, outage reporting, and broadcast scheduling"/>

      {/* Status Banner */}
      <div className={`rounded-2xl p-6 mb-6 flex items-center justify-between ${isOffAir ? 'bg-red-600' : 'bg-green-600'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full bg-white ${isOffAir ? 'opacity-100' : 'animate-pulse'}`}/>
          <div>
            <p className="text-white text-2xl font-bold">{isOffAir ? 'OFF AIR' : 'ON AIR'}</p>
            <p className="text-white/80 text-sm">{statusList.map(s=>`${s.frequency_name}`).join(' · ')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {!isOffAir ? (
            <Button variant="danger" onClick={()=>setDownModal(true)} className="!bg-white !text-red-600 hover:!bg-red-50">
              <AlertTriangle size={16}/> Report FM Down
            </Button>
          ) : (
            <Button onClick={()=>reportUp.mutate({ frequency_id: primaryFreqId })} className="!bg-white !text-green-700 hover:!bg-green-50" loading={reportUp.isPending}>
              <CheckCircle size={16}/> Report FM Restored
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outage Log */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock size={16} className="text-gray-500"/>
            <h3 className="font-semibold text-gray-900">Recent Outages</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {outageList.length === 0 ? <p className="px-5 py-8 text-center text-gray-400 text-sm">No outages recorded</p>
            : outageList.slice(0,10).map(o => (
              <div key={o.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{o.frequency_name}</span>
                  <div className="flex items-center gap-2">
                    {o.auto_detected && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Auto</span>}
                    {o.ended_at ? <span className="text-xs text-gray-400">{o.duration_minutes} min</span>
                      : <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Down: {formatDateTime(o.started_at)}</span>
                  {o.ended_at && <span>Up: {formatDateTime(o.ended_at)}</span>}
                </div>
                {o.description && <p className="text-xs text-gray-500 mt-1 truncate">{o.description}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Radio Schedule */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Calendar size={16} className="text-gray-500"/>
            <h3 className="font-semibold text-gray-900">Upcoming Schedule</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {scheduleList.length === 0 ? <p className="px-5 py-8 text-center text-gray-400 text-sm">No scheduled shows</p>
            : scheduleList.slice(0,8).map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-2 h-10 rounded-full flex-shrink-0 ${
                  s.show_type==='news'?'bg-navy-600 bg-blue-800':s.show_type==='music'?'bg-teal-500':
                  s.show_type==='sport'?'bg-red-500':'bg-amber-500'}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.show_name}</p>
                  <p className="text-xs text-gray-500">{s.presenter_name} · {s.frequency_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">{new Date(s.start_datetime).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}</p>
                  <Badge status={s.status} className="text-xs"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={downModal} onClose={()=>setDownModal(false)} title="Report FM Station Down">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0"/>
            <span>This will immediately log an outage with the current timestamp. The admin team will be notified.</span>
          </div>
          <Textarea label="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Describe the issue — e.g. transmitter fault, power outage..."/>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setDownModal(false)}>Cancel</Button>
            <Button variant="danger" loading={reportDown.isPending} onClick={()=>reportDown.mutate({ frequency_id: primaryFreqId, description: desc })}>
              Confirm — Report Down
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}