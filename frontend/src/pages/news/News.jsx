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
import { Newspaper, Plus, CheckCircle, XCircle, RotateCcw, Send } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

export default function News() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [newStory, setNewStory] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [form, setForm] = useState({ title:'', category:'', body:'', summary:'', is_breaking:false });
  const [reviewForm, setReviewForm] = useState({ action:'approved', comment:'' });

  const { data: categories } = useQuery({ queryKey:['news-cats'], queryFn:()=>api.get('/news/categories/').then(r=>r.data.results||r.data) });
  const { data, isLoading } = useQuery({ queryKey:['news-stories'], queryFn:()=>api.get('/news/stories/').then(r=>r.data.results||r.data) });
  const { data: feed } = useQuery({ queryKey:['news-feed'], queryFn:()=>api.get('/news/feed/').then(r=>r.data.results||r.data) });

  const createStory = useMutation({
    mutationFn: (d) => api.post('/news/stories/', d),
    onSuccess: () => { toast.success('Story saved'); qc.invalidateQueries(['news-stories']); setNewStory(false); setForm({ title:'', category:'', body:'', summary:'', is_breaking:false }); },
  });

  const submitStory = useMutation({
    mutationFn: (id) => api.post(`/news/stories/${id}/submit/`),
    onSuccess: () => { toast.success('Submitted for review'); qc.invalidateQueries(['news-stories']); },
  });

  const reviewStory = useMutation({
    mutationFn: ({ id, data }) => api.post(`/news/stories/${id}/review/`, data),
    onSuccess: () => { toast.success('Review saved'); qc.invalidateQueries(['news-stories']); setReviewModal(null); },
  });

  const stories = Array.isArray(data) ? data : [];
  const feedItems = Array.isArray(feed) ? feed : [];
  const cats = Array.isArray(categories) ? categories : [];
  const isAdminOrStaff = ['admin','staff'].includes(user?.role);

  return (
    <div>
      <PageHeader title="News" subtitle="Write, review, and publish institutional news"
        action={<Button onClick={()=>setNewStory(true)}><Plus size={14}/>Write Story</Button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Stories / All Stories */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">{isAdminOrStaff ? 'All Stories' : 'My Stories'}</h3>
          {isLoading ? <Spinner/>
          : stories.length === 0 ? <EmptyState icon={Newspaper} title="No stories" message="Write your first story"/>
          : (
            <div className="space-y-3">
              {stories.map(s => (
                <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {s.is_breaking && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">BREAKING</span>}
                        {s.category_name && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: s.category_color+'20', color: s.category_color }}>{s.category_name}</span>}
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm truncate">{s.title}</h4>
                      <p className="text-xs text-gray-500">{s.journalist_name} · {s.word_count} words · {formatDateTime(s.updated_at)}</p>
                    </div>
                    <Badge status={s.status}/>
                  </div>
                  {s.status === 'changes_requested' && s.reviews?.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2">
                      <p className="text-xs text-orange-700 font-medium">Editor feedback:</p>
                      <p className="text-xs text-orange-800">{s.reviews[0].comment}</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={()=>setViewModal(s)}>View</Button>
                    {s.status === 'draft' && <Button size="sm" variant="secondary" onClick={()=>submitStory.mutate(s.id)}><Send size={11}/>Submit</Button>}
                    {isAdminOrStaff && s.status === 'submitted' && <Button size="sm" onClick={()=>setReviewModal(s)}>Review</Button>}
                    {isAdminOrStaff && s.status === 'approved' && (
                      <Button size="sm" onClick={()=>reviewStory.mutate({ id:s.id, data:{ action:'published', comment:'' } })}>Publish</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Published Feed */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Published Feed</h3>
          <div className="space-y-3">
            {feedItems.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No published stories yet</p>
            : feedItems.map(s => (
              <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm cursor-pointer" onClick={()=>setViewModal(s)}>
                <div className="flex items-center gap-2 mb-1">
                  {s.is_breaking && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">BREAKING</span>}
                  <span className="text-xs text-gray-500">{s.category_name}</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{s.summary}</p>
                <p className="text-xs text-gray-400 mt-2">{s.journalist_name} · {formatDateTime(s.published_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write Story Modal */}
      <Modal open={newStory} onClose={()=>setNewStory(false)} title="Write Story" size="lg">
        <div className="space-y-4">
          <Input label="Headline" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Story headline..."/>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              <option value="">Select category...</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_breaking} onChange={e=>setForm({...form,is_breaking:e.target.checked})} className="w-4 h-4 accent-red-600"/>
                <span className="text-sm font-medium text-gray-700">Breaking News</span>
              </label>
            </div>
          </div>
          <Textarea label="Summary (max 300 chars)" value={form.summary} onChange={e=>setForm({...form,summary:e.target.value.slice(0,300)})} rows={2} placeholder="Brief summary for the feed..."/>
          <Textarea label="Story Body" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} rows={10} placeholder="Write your story here..."/>
          <p className="text-xs text-gray-400">{form.body.split(/\s+/).filter(Boolean).length} words</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setNewStory(false)}>Cancel</Button>
            <Button loading={createStory.isPending} onClick={()=>createStory.mutate(form)}>Save Draft</Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={!!reviewModal} onClose={()=>setReviewModal(null)} title="Editorial Review" size="lg">
        <div className="space-y-4">
          {reviewModal && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <h4 className="font-semibold text-gray-900 mb-2">{reviewModal.title}</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reviewModal.body?.replace(/<[^>]+>/g,' ')}</p>
            </div>
          )}
          <div className="flex gap-2">
            {['approved','changes_requested','rejected'].map(a => (
              <button key={a} onClick={()=>setReviewForm({...reviewForm,action:a})}
                className={`flex-1 py-2 text-sm rounded-lg font-medium border transition-all ${reviewForm.action===a
                  ? a==='approved'?'bg-green-600 text-white border-green-600'
                    :a==='rejected'?'bg-red-600 text-white border-red-600'
                    :'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                {a==='approved'?'Approve':a==='changes_requested'?'Request Changes':'Reject'}
              </button>
            ))}
          </div>
          <Textarea label="Comment" value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} placeholder="Add reviewer comment..."/>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setReviewModal(null)}>Cancel</Button>
            <Button loading={reviewStory.isPending} onClick={()=>reviewStory.mutate({ id:reviewModal.id, data:reviewForm })}>Submit Review</Button>
          </div>
        </div>
      </Modal>

      {/* View Story Modal */}
      <Modal open={!!viewModal} onClose={()=>setViewModal(null)} title={viewModal?.title || ''} size="lg">
        {viewModal && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              {viewModal.is_breaking && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">BREAKING</span>}
              <span className="text-sm text-gray-500">{viewModal.journalist_name} · {viewModal.category_name}</span>
            </div>
            {viewModal.summary && <p className="text-sm text-gray-600 italic border-l-4 border-teal-400 pl-3 mb-4">{viewModal.summary}</p>}
            <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: viewModal.body || viewModal.body }}/>
          </div>
        )}
      </Modal>
    </div>
  );
}