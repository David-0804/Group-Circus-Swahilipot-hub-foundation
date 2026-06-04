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
import { FolderOpen, Plus, Upload, MessageSquare } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

export default function Projects() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [newProject, setNewProject] = useState(false);
  const [submitModal, setSubmitModal] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [form, setForm] = useState({ title:'', course:'', description:'', submission_type:'individual' });
  const [file, setFile] = useState(null);
  const [reviewForm, setReviewForm] = useState({ feedback_text:'', grade:'', status:'graded' });

  const { data: courses } = useQuery({ queryKey:['courses'], queryFn:()=>api.get('/projects/courses/').then(r=>r.data.results||r.data) });
  const { data, isLoading } = useQuery({ queryKey:['projects'], queryFn:()=>api.get('/projects/').then(r=>r.data.results||r.data) });

  const createProject = useMutation({
    mutationFn: (d) => api.post('/projects/', d),
    onSuccess: () => { toast.success('Project created'); qc.invalidateQueries(['projects']); setNewProject(false); setForm({ title:'', course:'', description:'', submission_type:'individual' }); },
  });

  const submitFile = useMutation({
    mutationFn: ({ id, file }) => { const fd = new FormData(); fd.append('file', file); return api.post(`/projects/${id}/submit/`, fd, { headers:{ 'Content-Type':'multipart/form-data' } }); },
    onSuccess: () => { toast.success('Submitted!'); qc.invalidateQueries(['projects']); setSubmitModal(null); setFile(null); },
  });

  const submitReview = useMutation({
    mutationFn: ({ subId, data }) => api.post(`/projects/submissions/${subId}/review/`, data),
    onSuccess: () => { toast.success('Review saved'); qc.invalidateQueries(['projects']); setReviewModal(null); },
  });

  const projects = Array.isArray(data) ? data : [];
  const courseList = Array.isArray(courses) ? courses : [];
  const isAdminOrStaff = ['admin','staff'].includes(user?.role);

  return (
    <div>
      <PageHeader title="Projects" subtitle="Submit and track academic projects"
        action={user?.role === 'student' && <Button onClick={()=>setNewProject(true)}><Plus size={14}/>New Project</Button>}
      />

      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg"/></div>
      : projects.length === 0 ? <EmptyState icon={FolderOpen} title="No projects yet"
          message={user?.role==='student' ? "Create your first project" : "No submissions to review"}
          action={user?.role==='student' && <Button onClick={()=>setNewProject(true)}><Plus size={14}/>New Project</Button>}/>
      : (
        <div className="grid grid-cols-1 gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{project.title}</h3>
                  <p className="text-sm text-gray-500">{project.course_name} · {project.student_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {project.latest_status && <Badge status={project.latest_status}/>}
                  <span className="text-xs text-gray-400">{project.submissions?.length || 0} version{project.submissions?.length !== 1 ? 's':''}</span>
                </div>
              </div>
              {project.description && <p className="text-sm text-gray-600 mb-4">{project.description}</p>}
              {project.submissions?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Latest Submission</p>
                  {project.submissions.slice(0,1).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">v{sub.version_number} — {sub.file_name}</span>
                        <span className="text-xs text-gray-400 ml-2">{formatDateTime(sub.submitted_at)}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge status={sub.status}/>
                        {isAdminOrStaff && sub.status === 'submitted' && (
                          <Button size="sm" onClick={()=>setReviewModal(sub)}><MessageSquare size={12}/>Review</Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {project.submissions[0]?.reviews?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-1">Feedback</p>
                      <p className="text-sm text-gray-700">{project.submissions[0].reviews[0].feedback_text}</p>
                      {project.submissions[0].reviews[0].grade && (
                        <span className="inline-block mt-1 bg-teal-100 text-teal-800 text-sm font-bold px-3 py-1 rounded-lg">Grade: {project.submissions[0].reviews[0].grade}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                {user?.role === 'student' && (
                  <Button size="sm" variant="secondary" onClick={()=>setSubmitModal(project)}>
                    <Upload size={12}/>{project.submissions?.length > 0 ? 'Resubmit' : 'Submit File'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={newProject} onClose={()=>setNewProject(false)} title="Create New Project">
        <div className="space-y-4">
          <Input label="Project Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Enter project title"/>
          <Select label="Course" value={form.course} onChange={e=>setForm({...form,course:e.target.value})}>
            <option value="">Select course...</option>
            {courseList.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </Select>
          <Select label="Submission Type" value={form.submission_type} onChange={e=>setForm({...form,submission_type:e.target.value})}>
            <option value="individual">Individual</option>
            <option value="group">Group</option>
          </Select>
          <Textarea label="Description (optional)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setNewProject(false)}>Cancel</Button>
            <Button loading={createProject.isPending} onClick={()=>createProject.mutate(form)}>Create Project</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!submitModal} onClose={()=>{setSubmitModal(null);setFile(null);}} title={`Submit: ${submitModal?.title}`}>
        <div className="space-y-4">
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file?'border-teal-400 bg-teal-50':'border-gray-300 hover:border-gray-400'}`}>
            <Upload size={28} className="mx-auto text-gray-400 mb-2"/>
            {file ? <p className="text-sm font-medium text-teal-700">{file.name}<br/><span className="text-gray-400 text-xs">{(file.size/1024/1024).toFixed(1)} MB</span></p>
              : <p className="text-sm text-gray-500">Click or drag file here</p>}
            <input type="file" className="hidden" id="file-upload" onChange={e=>setFile(e.target.files[0])}/>
            <label htmlFor="file-upload" className="mt-3 inline-block cursor-pointer bg-white border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">Browse</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={()=>{setSubmitModal(null);setFile(null);}}>Cancel</Button>
            <Button loading={submitFile.isPending} disabled={!file} onClick={()=>submitFile.mutate({ id:submitModal.id, file })}>Submit</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!reviewModal} onClose={()=>setReviewModal(null)} title="Review Submission">
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
            <strong>File:</strong> {reviewModal?.file_name} · v{reviewModal?.version_number}
          </div>
          <Textarea label="Feedback" value={reviewForm.feedback_text} onChange={e=>setReviewForm({...reviewForm,feedback_text:e.target.value})} placeholder="Provide detailed feedback..."/>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Grade (optional)" value={reviewForm.grade} onChange={e=>setReviewForm({...reviewForm,grade:e.target.value})} placeholder="e.g. A, 85%, Pass"/>
            <Select label="Set Status" value={reviewForm.status} onChange={e=>setReviewForm({...reviewForm,status:e.target.value})}>
              <option value="graded">Graded</option>
              <option value="feedback_given">Feedback Given</option>
              <option value="resubmit_requested">Request Resubmit</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setReviewModal(null)}>Cancel</Button>
            <Button loading={submitReview.isPending} onClick={()=>submitReview.mutate({ subId:reviewModal.id, data:reviewForm })}>Save Review</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}