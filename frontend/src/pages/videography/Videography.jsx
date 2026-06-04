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
import { Video, Plus, Upload, Check, X } from 'lucide-react';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/helpers';

export default function Videography() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [bookingModal, setBookingModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title:'', location:'', shoot_date:'', start_time:'', end_time:'', purpose:'', production_brief:'' });

  const { data: locations } = useQuery({ queryKey:['locations'], queryFn:()=>api.get('/videography/locations/').then(r=>r.data.results||r.data) });
  const { data, isLoading } = useQuery({ queryKey:['bookings'], queryFn:()=>api.get('/videography/bookings/').then(r=>r.data.results||r.data) });
  const { data: footage } = useQuery({ queryKey:['footage'], queryFn:()=>api.get('/videography/footage/').then(r=>r.data.results||r.data), enabled: ['admin','staff'].includes(user?.role) });

  const createBooking = useMutation({
    mutationFn:(d)=>api.post('/videography/bookings/',d),
    onSuccess:()=>{ toast.success('Booking submitted'); qc.invalidateQueries(['bookings']); setBookingModal(false); setForm({ title:'', location:'', shoot_date:'', start_time:'', end_time:'', purpose:'', production_brief:'' }); },
  });

  const approveBooking = useMutation({ mutationFn:(id)=>api.post(`/videography/bookings/${id}/approve/`), onSuccess:()=>{ toast.success('Approved'); qc.invalidateQueries(['bookings']); } });
  const declineBooking = useMutation({ mutationFn:(id)=>api.post(`/videography/bookings/${id}/decline/`,{ reason:'Declined by coordinator' }), onSuccess:()=>{ toast.success('Declined'); qc.invalidateQueries(['bookings']); } });

  const uploadFootage = useMutation({
    mutationFn:({ id, file })=>{ const fd=new FormData(); fd.append('file',file); return api.post(`/videography/bookings/${id}/upload-footage/`,fd,{ headers:{'Content-Type':'multipart/form-data'} }); },
    onSuccess:()=>{ toast.success('Footage uploaded'); qc.invalidateQueries(['bookings']); qc.invalidateQueries(['footage']); setUploadModal(null); setFile(null); },
  });

  const bookings = Array.isArray(data) ? data : [];
  const locationList = Array.isArray(locations) ? locations : [];
  const footageList = Array.isArray(footage) ? footage : [];
  const isAdminOrStaff = ['admin','staff'].includes(user?.role);

  return (
    <div>
      <PageHeader title="Videography" subtitle="Book shoots and manage production footage"
        action={<Button onClick={()=>setBookingModal(true)}><Plus size={14}/>Book a Shoot</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Shoot Bookings</h3>
          {isLoading ? <Spinner/> : bookings.length === 0 ? <EmptyState icon={Video} title="No bookings" message="Book your first shoot"/>
          : (
            <div className="space-y-3">
              {bookings.map(b=>(
                <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{b.title}</h4>
                      <p className="text-xs text-gray-500">{b.requester_name} · {b.location_name}</p>
                    </div>
                    <Badge status={b.status}/>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span>📅 {formatDate(b.shoot_date)}</span>
                    <span>⏰ {b.start_time} – {b.end_time}</span>
                  </div>
                  {b.purpose && <p className="text-sm text-gray-600 mb-3">{b.purpose}</p>}
                  <div className="flex gap-2">
                    {isAdminOrStaff && b.status==='pending' && (
                      <>
                        <Button size="sm" onClick={()=>approveBooking.mutate(b.id)}><Check size={12}/>Approve</Button>
                        <Button size="sm" variant="danger" onClick={()=>declineBooking.mutate(b.id)}><X size={12}/>Decline</Button>
                      </>
                    )}
                    {b.status==='approved' && (
                      <Button size="sm" variant="secondary" onClick={()=>setUploadModal(b)}><Upload size={12}/>Upload Footage</Button>
                    )}
                  </div>
                  {b.footage?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">{b.footage.length} footage file(s) uploaded</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdminOrStaff && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Footage Archive</h3>
            <div className="space-y-2">
              {footageList.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No footage uploaded yet</p>
              : footageList.map(f=>(
                <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                    f.file_type==='video'?'bg-red-50':f.file_type==='audio'?'bg-purple-50':'bg-gray-50'}`}>
                    {f.file_type==='video'?'🎥':f.file_type==='audio'?'🎙':'📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.original_filename}</p>
                    <p className="text-xs text-gray-500">{f.uploader_name} · {formatFileSize(f.file_size)} · {formatDateTime(f.uploaded_at)}</p>
                    {f.description && <p className="text-xs text-gray-500 truncate">{f.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Booking Modal */}
      <Modal open={bookingModal} onClose={()=>setBookingModal(false)} title="Book a Shoot" size="lg">
        <div className="space-y-4">
          <Input label="Shoot Title / Project Name" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Documentary on Campus Life"/>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}>
              <option value="">Select location...</option>
              {locationList.map(l=><option key={l.id} value={l.id}>{l.name} — {l.building}</option>)}
            </Select>
            <Input label="Shoot Date" type="date" value={form.shoot_date} onChange={e=>setForm({...form,shoot_date:e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time" type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/>
            <Input label="End Time" type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/>
          </div>
          <Textarea label="Purpose / Project Brief" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} placeholder="What is this shoot for? What is the expected output?"/>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setBookingModal(false)}>Cancel</Button>
            <Button loading={createBooking.isPending} onClick={()=>createBooking.mutate(form)}>Submit Booking</Button>
          </div>
        </div>
      </Modal>

      {/* Upload Footage Modal */}
      <Modal open={!!uploadModal} onClose={()=>{setUploadModal(null);setFile(null);}} title={`Upload Footage: ${uploadModal?.title}`}>
        <div className="space-y-4">
          <div className={`border-2 border-dashed rounded-xl p-8 text-center ${file?'border-teal-400 bg-teal-50':'border-gray-300'}`}>
            <Upload size={28} className="mx-auto text-gray-400 mb-2"/>
            {file ? <p className="text-sm font-medium text-teal-700">{file.name}</p>
              : <p className="text-sm text-gray-500">Select footage file</p>}
            <input type="file" className="hidden" id="footage-upload" accept="video/*,audio/*,image/*" onChange={e=>setFile(e.target.files[0])}/>
            <label htmlFor="footage-upload" className="mt-3 inline-block cursor-pointer bg-white border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">Browse</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={()=>{setUploadModal(null);setFile(null);}}>Cancel</Button>
            <Button loading={uploadFootage.isPending} disabled={!file} onClick={()=>uploadFootage.mutate({ id:uploadModal.id, file })}>Upload</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}