import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuthStore } from '../../store/auth';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { ClipboardList } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export default function Requests() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['equipment-requests'],
    queryFn: () => api.get('/equipment/requests/').then(r => r.data.results || r.data),
  });

  const approve = useMutation({
    mutationFn: (id) => api.post(`/equipment/requests/${id}/approve/`),
    onSuccess: () => { toast.success('Approved!'); qc.invalidateQueries(['equipment-requests']); },
  });
  const reject = useMutation({
    mutationFn: (id) => api.post(`/equipment/requests/${id}/reject/`, { reason:'Declined by admin' }),
    onSuccess: () => { toast.success('Rejected'); qc.invalidateQueries(['equipment-requests']); },
  });
  const confirmReturn = useMutation({
    mutationFn: (id) => api.post(`/equipment/requests/${id}/return/`),
    onSuccess: () => { toast.success('Return confirmed'); qc.invalidateQueries(['equipment-requests']); },
  });

  const requests = Array.isArray(data) ? data : [];
  const isAdminOrStaff = ['admin','staff'].includes(user?.role);

  return (
    <div>
      <PageHeader title="Equipment Requests" subtitle={isAdminOrStaff ? "Review and manage all requests" : "Your equipment requests"}/>
      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg"/></div>
      : requests.length === 0 ? <EmptyState icon={ClipboardList} title="No requests" message="No equipment requests found"/>
      : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Requester','Items','Period','Purpose','Status','Actions'].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{req.requester_name}</td>
                  <td className="px-4 py-3 text-gray-600">{req.items_detail?.map(i=>i.name).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(req.start_date)} – {formatDate(req.end_date)}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{req.purpose}</td>
                  <td className="px-4 py-3"><Badge status={req.status}/></td>
                  <td className="px-4 py-3">
                    {isAdminOrStaff && req.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={()=>approve.mutate(req.id)} loading={approve.isPending}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={()=>reject.mutate(req.id)}>Reject</Button>
                      </div>
                    )}
                    {isAdminOrStaff && req.status === 'approved' && (
                      <Button size="sm" variant="secondary" onClick={()=>confirmReturn.mutate(req.id)}>Confirm Return</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}