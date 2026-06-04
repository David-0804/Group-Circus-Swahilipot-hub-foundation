import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Users, Plus, Search } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [newUser, setNewUser] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState({ email:'', full_name:'', department:'', role:'student', phone_number:'' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => api.get('/auth/users/', { params: { search, role: roleFilter } }).then(r => r.data.results || r.data),
  });

  const createUser = useMutation({
    mutationFn: (d) => api.post('/auth/users/', d),
    onSuccess: () => { toast.success('User created — welcome email sent'); qc.invalidateQueries(['admin-users']); setNewUser(false); setForm({ email:'', full_name:'', department:'', role:'student', phone_number:'' }); },
    onError: (e) => toast.error(e.response?.data?.email?.[0] || 'Failed to create user'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }) => api.patch(`/auth/users/${id}/`, { is_active: active }),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries(['admin-users']); },
  });

  const users = Array.isArray(data) ? data : [];

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage all system accounts and roles"
        action={<Button onClick={()=>setNewUser(true)}><Plus size={14}/>Create User</Button>}
      />
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"/>
        </div>
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="student">Student</option>
          <option value="it">IT</option>
        </select>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg"/></div>
      : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['User','Email','Department','Role','Status','Joined','Actions'].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u=>(
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.initials}
                      </div>
                      <span className="font-medium text-gray-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.department||'—'}</td>
                  <td className="px-4 py-3"><Badge status={u.role} label={u.role}/></td>
                  <td className="px-4 py-3"><Badge status={u.is_active?'available':'retired'} label={u.is_active?'Active':'Inactive'}/></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDateTime(u.date_joined)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant={u.is_active?'danger':'secondary'} onClick={()=>toggleActive.mutate({ id:u.id, active:!u.is_active })}>
                      {u.is_active?'Deactivate':'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center text-gray-400 py-12">No users found</p>}
        </div>
      )}

      <Modal open={newUser} onClose={()=>setNewUser(false)} title="Create New User">
        <div className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="John Doe"/>
          <Input label="Email Address" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="user@bmi.ac.ke"/>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="e.g. Radio Production"/>
            <Select label="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="it">IT</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <Input label="Phone (optional)" value={form.phone_number} onChange={e=>setForm({...form,phone_number:e.target.value})} placeholder="+254..."/>
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            A temporary password will be auto-generated and emailed to the user.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setNewUser(false)}>Cancel</Button>
            <Button loading={createUser.isPending} onClick={()=>createUser.mutate(form)}>Create User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}