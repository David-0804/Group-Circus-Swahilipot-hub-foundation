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
import toast from 'react-hot-toast';
import { Wifi, Monitor, Upload, MessageSquare, Plus, Send } from 'lucide-react';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/helpers';

const TABS = ['Wi-Fi', 'Software', 'File Transfer', 'Feedback'];

export default function Infrastructure() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('Wi-Fi');
  const [wifiModal, setWifiModal] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [wifiForm, setWifiForm] = useState({ device_name:'', device_type:'laptop', mac_address:'', purpose:'', duration_days:7 });
  const [ticketForm, setTicketForm] = useState({ subject:'', description:'', urgency:'medium', category:'' });
  const [transferFile, setTransferFile] = useState(null);
  const [transferResult, setTransferResult] = useState(null);
  const [replyText, setReplyText] = useState({});
  const isAdminOrIT = ['admin','it'].includes(user?.role);
  const isAdminOrStaff = ['admin','staff'].includes(user?.role);

  const { data: wifiRequests } = useQuery({ queryKey:['wifi'], queryFn:()=>api.get('/infrastructure/wifi/').then(r=>r.data.results||r.data) });
  const { data: software } = useQuery({ queryKey:['software'], queryFn:()=>api.get('/infrastructure/software/').then(r=>r.data.results||r.data) });
  const { data: licences } = useQuery({ queryKey:['licences'], queryFn:()=>api.get('/infrastructure/licences/').then(r=>r.data.results||r.data), enabled: isAdminOrIT });
  const { data: accessReqs } = useQuery({ queryKey:['access-reqs'], queryFn:()=>api.get('/infrastructure/access-requests/').then(r=>r.data.results||r.data) });
  const { data: myTransfers } = useQuery({ queryKey:['transfers'], queryFn:()=>api.get('/infrastructure/transfer/my-uploads/').then(r=>r.data.results||r.data) });
  const { data: feedbackCats } = useQuery({ queryKey:['fb-cats'], queryFn:()=>api.get('/infrastructure/feedback/categories/').then(r=>r.data.results||r.data) });
  const { data: tickets } = useQuery({ queryKey:['tickets'], queryFn:()=>api.get('/infrastructure/feedback/tickets/').then(r=>r.data.results||r.data) });

  const submitWifi = useMutation({ mutationFn:(d)=>api.post('/infrastructure/wifi/',d), onSuccess:()=>{ toast.success('Wi-Fi request submitted'); qc.invalidateQueries(['wifi']); setWifiModal(false); } });
  const approveWifi = useMutation({ mutationFn:(id)=>api.post(`/infrastructure/wifi/${id}/approve/`,{ duration_days:7 }), onSuccess:()=>{ toast.success('Approved'); qc.invalidateQueries(['wifi']); } });
  const denyWifi = useMutation({ mutationFn:(id)=>api.post(`/infrastructure/wifi/${id}/deny/`,{ denial_reason:'Not approved' }), onSuccess:()=>{ toast.success('Denied'); qc.invalidateQueries(['wifi']); } });

  const requestAccess = useMutation({ mutationFn:(d)=>api.post('/infrastructure/access-requests/',d), onSuccess:()=>{ toast.success('Access requested'); qc.invalidateQueries(['access-reqs']); } });
  const approveAccess = useMutation({ mutationFn:(id)=>api.post(`/infrastructure/access-requests/${id}/approve/`,{ access_note:'Approved. Check email for credentials.' }), onSuccess:()=>{ toast.success('Access approved'); qc.invalidateQueries(['access-reqs']); } });

  const uploadTransfer = useMutation({
    mutationFn:(file)=>{ const fd=new FormData(); fd.append('file',file); return api.post('/infrastructure/transfer/upload/',fd,{ headers:{'Content-Type':'multipart/form-data'} }); },
    onSuccess:(res)=>{ setTransferResult(res.data); toast.success('File uploaded!'); qc.invalidateQueries(['transfers']); setTransferFile(null); setTransferModal(false); },
  });

  const submitTicket = useMutation({ mutationFn:(d)=>api.post('/infrastructure/feedback/tickets/',d), onSuccess:()=>{ toast.success('Ticket submitted'); qc.invalidateQueries(['tickets']); setTicketModal(false); setTicketForm({ subject:'',description:'',urgency:'medium',category:'' }); } });
  const replyTicket = useMutation({ mutationFn:({ id,msg })=>api.post(`/infrastructure/feedback/tickets/${id}/respond/`,{ message:msg }), onSuccess:(_,vars)=>{ toast.success('Reply sent'); qc.invalidateQueries(['tickets']); setReplyText({...replyText,[vars.id]:''}); } });

  const wifiList = Array.isArray(wifiRequests) ? wifiRequests : [];
  const softwareList = Array.isArray(software) ? software : [];
  const licenceList = Array.isArray(licences) ? licences : [];
  const accessList = Array.isArray(accessReqs) ? accessReqs : [];
  const transferList = Array.isArray(myTransfers) ? myTransfers : [];
  const ticketList = Array.isArray(tickets) ? tickets : [];
  const catList = Array.isArray(feedbackCats) ? feedbackCats : [];

  return (
    <div>
      <PageHeader title="Infrastructure & Connectivity" subtitle="Wi-Fi, software, file transfer, and feedback"/>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-600 hover:text-gray-900'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* WI-FI TAB */}
      {tab==='Wi-Fi' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={()=>setWifiModal(true)}><Plus size={14}/>Request Wi-Fi Access</Button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>{['Device','Type','Purpose','Requested','Status','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {wifiList.map(r=>(
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.device_name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{r.device_type}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.purpose}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(r.requested_at)}</td>
                    <td className="px-4 py-3"><Badge status={r.status}/></td>
                    <td className="px-4 py-3">
                      {isAdminOrIT && r.status==='pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={()=>approveWifi.mutate(r.id)}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={()=>denyWifi.mutate(r.id)}>Deny</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {wifiList.length===0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No Wi-Fi requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SOFTWARE TAB */}
      {tab==='Software' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {softwareList.map(sw=>{
              const myReq = accessList.find(a=>a.licence===sw.id);
              return (
                <div key={sw.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">{sw.name}</h3>
                  <p className="text-xs text-gray-500 mb-1">{sw.vendor} · <span className="capitalize">{sw.category}</span></p>
                  <p className="text-sm text-gray-600 mb-4">{sw.description}</p>
                  {myReq ? <Badge status={myReq.status}/> : (
                    <Button size="sm" onClick={()=>requestAccess.mutate({ licence: licenceList.find(l=>l.software===sw.id)?.id, purpose:'Academic use' })}>Request Access</Button>
                  )}
                </div>
              );
            })}
          </div>
          {isAdminOrIT && licenceList.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Licence Management</h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr>{['Software','Seats Used','Total','Expiry','Status'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y">
                    {licenceList.map(l=>{
                      const expiring = new Date(l.expiry_date) < new Date(Date.now()+30*24*60*60*1000);
                      return (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{l.software_name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 w-24">
                                <div className="bg-teal-500 h-2 rounded-full" style={{ width:`${(l.used_seats/l.total_seats)*100}%` }}/>
                              </div>
                              <span className="text-xs text-gray-600">{l.used_seats}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{l.total_seats}</td>
                          <td className="px-4 py-3"><span className={expiring?'text-red-600 font-medium':'text-gray-600'}>{formatDate(l.expiry_date)}</span></td>
                          <td className="px-4 py-3"><Badge status={expiring?'overdue':'available'} label={expiring?'Expiring':'Active'}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FILE TRANSFER TAB */}
      {tab==='File Transfer' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={()=>setTransferModal(true)}><Upload size={14}/>Upload File to Transfer</Button>
          </div>
          {transferResult && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-6">
              <p className="font-semibold text-teal-800 mb-2">File ready to share!</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-white border border-teal-300 px-3 py-2 rounded-lg text-sm text-teal-800 truncate">
                  {window.location.origin}/transfer/{transferResult.token}
                </code>
                <Button size="sm" onClick={()=>{ navigator.clipboard.writeText(`${window.location.origin}/transfer/${transferResult.token}`); toast.success('Copied!'); }}>Copy Link</Button>
              </div>
              <p className="text-xs text-teal-600 mt-2">Link expires in 24 hours · {transferResult.max_downloads} download(s) allowed</p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>{['Filename','Size','Uploaded','Downloads','Expires','Status'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {transferList.map(t=>(
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{t.original_filename}</td>
                    <td className="px-4 py-3 text-gray-500">{formatFileSize(t.file_size)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(t.created_at)}</td>
                    <td className="px-4 py-3 text-gray-600">{t.download_count}/{t.max_downloads}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(t.expires_at)}</td>
                    <td className="px-4 py-3"><Badge status={t.is_expired?'retired':'available'} label={t.is_expired?'Expired':'Active'}/></td>
                  </tr>
                ))}
                {transferList.length===0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No transfers yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FEEDBACK TAB */}
      {tab==='Feedback' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={()=>setTicketModal(true)}><Plus size={14}/>Submit Ticket</Button>
          </div>
          <div className="space-y-4">
            {ticketList.map(t=>(
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{t.subject}</h4>
                    <p className="text-xs text-gray-500">{t.submitter_name} · {t.category_name} · {formatDateTime(t.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2"><Badge status={t.urgency}/><Badge status={t.status}/></div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{t.description}</p>
                {t.responses?.map(r=>(
                  <div key={r.id} className={`text-sm p-3 rounded-lg mb-2 ${r.responder===user?.id?'bg-teal-50 border border-teal-200':'bg-gray-50 border border-gray-200'}`}>
                    <p className="text-xs font-medium text-gray-500 mb-1">{r.responder_name} · {formatDateTime(r.responded_at)}</p>
                    <p className="text-gray-700">{r.message}</p>
                  </div>
                ))}
                {t.status !== 'closed' && t.status !== 'resolved' && (
                  <div className="flex gap-2 mt-3">
                    <input value={replyText[t.id]||''} onChange={e=>setReplyText({...replyText,[t.id]:e.target.value})}
                      placeholder="Write a reply..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                    <Button size="sm" onClick={()=>replyTicket.mutate({ id:t.id, msg:replyText[t.id]||'' })} disabled={!replyText[t.id]}><Send size={12}/></Button>
                  </div>
                )}
              </div>
            ))}
            {ticketList.length===0 && <p className="text-center text-gray-400 py-12">No support tickets</p>}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal open={wifiModal} onClose={()=>setWifiModal(false)} title="Request Wi-Fi Access">
        <div className="space-y-4">
          <Input label="Device Name" value={wifiForm.device_name} onChange={e=>setWifiForm({...wifiForm,device_name:e.target.value})} placeholder="e.g. MacBook Pro"/>
          <Select label="Device Type" value={wifiForm.device_type} onChange={e=>setWifiForm({...wifiForm,device_type:e.target.value})}>
            <option value="laptop">Laptop</option><option value="phone">Phone</option><option value="tablet">Tablet</option><option value="other">Other</option>
          </Select>
          <Input label="MAC Address (optional)" value={wifiForm.mac_address} onChange={e=>setWifiForm({...wifiForm,mac_address:e.target.value})} placeholder="XX:XX:XX:XX:XX:XX"/>
          <Select label="Duration" value={wifiForm.duration_days} onChange={e=>setWifiForm({...wifiForm,duration_days:parseInt(e.target.value)})}>
            <option value={1}>1 Day</option><option value={7}>1 Week</option><option value={30}>1 Month</option><option value={120}>1 Semester</option>
          </Select>
          <Textarea label="Purpose" value={wifiForm.purpose} onChange={e=>setWifiForm({...wifiForm,purpose:e.target.value})} placeholder="Why do you need Wi-Fi access?"/>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={()=>setWifiModal(false)}>Cancel</Button>
            <Button loading={submitWifi.isPending} onClick={()=>submitWifi.mutate(wifiForm)}>Submit Request</Button>
          </div>
        </div>
      </Modal>

      <Modal open={ticketModal} onClose={()=>setTicketModal(false)} title="Submit Support Ticket">
        <div className="space-y-4">
          <Input label="Subject" value={ticketForm.subject} onChange={e=>setTicketForm({...ticketForm,subject:e.target.value})} placeholder="Brief subject..."/>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={ticketForm.category} onChange={e=>setTicketForm({...ticketForm,category:e.target.value})}>
              <option value="">Select...</option>
              {catList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Urgency" value={ticketForm.urgency} onChange={e=>setTicketForm({...ticketForm,urgency:e.target.value})}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </Select>
          </div>
          <Textarea label="Description" value={ticketForm.description} onChange={e=>setTicketForm({...ticketForm,description:e.target.value})} placeholder="Describe your issue in detail..."/>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={()=>setTicketModal(false)}>Cancel</Button>
            <Button loading={submitTicket.isPending} onClick={()=>submitTicket.mutate(ticketForm)}>Submit Ticket</Button>
          </div>
        </div>
      </Modal>

      <Modal open={transferModal} onClose={()=>{setTransferModal(false);setTransferFile(null);}} title="Upload File to Transfer">
        <div className="space-y-4">
          <div className={`border-2 border-dashed rounded-xl p-8 text-center ${transferFile?'border-teal-400 bg-teal-50':'border-gray-300'}`}>
            <Upload size={28} className="mx-auto text-gray-400 mb-2"/>
            {transferFile ? <p className="text-sm font-medium text-teal-700">{transferFile.name} ({formatFileSize(transferFile.size)})</p>
              : <p className="text-sm text-gray-500">Select a file to share on the local network</p>}
            <input type="file" className="hidden" id="transfer-upload" onChange={e=>setTransferFile(e.target.files[0])}/>
            <label htmlFor="transfer-upload" className="mt-3 inline-block cursor-pointer bg-white border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">Browse</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={()=>{setTransferModal(false);setTransferFile(null);}}>Cancel</Button>
            <Button loading={uploadTransfer.isPending} disabled={!transferFile} onClick={()=>uploadTransfer.mutate(transferFile)}>Upload & Get Link</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}