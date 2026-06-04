import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuthStore } from '../../store/auth';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Package, Plus, Search, Wrench } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export default function EquipmentList() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [requestModal, setRequestModal] = useState(null);
  const [form, setForm] = useState({ start_date:'', end_date:'', purpose:'' });

  const { data, isLoading } = useQuery({
    queryKey: ['equipment', search, statusFilter],
    queryFn: () => api.get('/equipment/items/', { params: { search, status: statusFilter } }).then(r => r.data.results || r.data),
  });

  const createRequest = useMutation({
    mutationFn: (d) => api.post('/equipment/requests/', d),
    onSuccess: () => { toast.success('Request submitted!'); setRequestModal(null); setForm({ start_date:'', end_date:'', purpose:'' }); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to submit'),
  });

  const flagMaintenance = useMutation({
    mutationFn: ({ id, desc }) => api.post('/equipment/maintenance/', { item: id, description: desc }),
    onSuccess: () => { toast.success('Maintenance reported'); qc.invalidateQueries(['equipment']); },
  });

  const items = Array.isArray(data) ? data : [];

  return (
    <div>
      <PageHeader title="Equipment" subtitle="Manage and request institutional equipment"
        action={user?.role !== 'student' && <Button onClick={()=>{}} size="sm"><Plus size={14}/>Add Item</Button>}
      />
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search equipment..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="checked_out">Checked Out</option>
          <option value="under_repair">Under Repair</option>
        </select>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg"/></div>
      : items.length === 0 ? <EmptyState icon={Package} title="No equipment found" message="No items match your filters"/>
      : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Name','Category','Condition','Status','Actions'].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.category_name}</td>
                  <td className="px-4 py-3"><span className="capitalize text-gray-600">{item.condition}</span></td>
                  <td className="px-4 py-3"><Badge status={item.status}/></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {item.status === 'available' && (
                        <Button size="sm" onClick={()=>setRequestModal(item)}>Request</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={()=>flagMaintenance.mutate({ id:item.id, desc:'Reported by '+user.full_name })}>
                        <Wrench size={12}/>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!requestModal} onClose={()=>setRequestModal(null)} title={`Request: ${requestModal?.name}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/>
            <Input label="End Date" type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})}/>
          </div>
          <Textarea label="Purpose" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} placeholder="Describe how you will use this equipment..."/>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setRequestModal(null)}>Cancel</Button>
            <Button loading={createRequest.isPending} onClick={()=>createRequest.mutate({ item_ids:[requestModal.id], ...form })}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}