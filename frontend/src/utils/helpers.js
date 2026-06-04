export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day:'2-digit', month:'short', year:'numeric' }) : '—';
export const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-KE') : '—';
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k,i)).toFixed(1)) + ' ' + sizes[i];
};
export const getInitials = (name) => name ? name.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2) : '?';
export const statusColor = (s) => ({
  available:'bg-green-100 text-green-800', on_air:'bg-green-100 text-green-800',
  checked_out:'bg-blue-100 text-blue-800', approved:'bg-blue-100 text-blue-800',
  pending:'bg-amber-100 text-amber-800', under_review:'bg-amber-100 text-amber-800',
  under_repair:'bg-orange-100 text-orange-800', in_progress:'bg-orange-100 text-orange-800',
  overdue:'bg-red-100 text-red-800', off_air:'bg-red-100 text-red-800',
  rejected:'bg-red-100 text-red-800', denied:'bg-red-100 text-red-800',
  returned:'bg-green-100 text-green-800', published:'bg-green-100 text-green-800',
  resolved:'bg-green-100 text-green-800', completed:'bg-green-100 text-green-800',
  draft:'bg-gray-100 text-gray-600', retired:'bg-gray-100 text-gray-600',
  archived:'bg-gray-100 text-gray-600', submitted:'bg-blue-100 text-blue-800',
  changes_requested:'bg-orange-100 text-orange-800',
  critical:'bg-red-100 text-red-800', high:'bg-orange-100 text-orange-800',
  medium:'bg-amber-100 text-amber-800', low:'bg-green-100 text-green-800',
}[s] || 'bg-gray-100 text-gray-600');