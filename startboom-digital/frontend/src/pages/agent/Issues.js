import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Plus, Search, Filter, FileText, FileSpreadsheet,
  Clock, CheckCircle, AlertCircle, X, Users, Bug, MessageSquare,
  HelpCircle, CreditCard, Wrench, MoreHorizontal, Eye, Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { issuesAPI, clientsAPI } from '../../services/api';

const ISSUE_TYPES = ['Bug', 'Complaint', 'Feature Request', 'Billing', 'Technical', 'General'];
const ISSUE_STATUSES = ['New', 'In Progress', 'Done'];
const ISSUE_PRIORITIES = ['Low', 'Medium', 'Critical'];

const typeMeta = {
  Bug:             { icon: Bug,         color: 'bg-red-100 text-red-700' },
  Complaint:       { icon: MessageSquare, color: 'bg-orange-100 text-orange-700' },
  'Feature Request':{ icon: HelpCircle,   color: 'bg-blue-100 text-blue-700' },
  Billing:         { icon: CreditCard,   color: 'bg-amber-100 text-amber-700' },
  Technical:       { icon: Wrench,       color: 'bg-purple-100 text-purple-700' },
  General:         { icon: AlertCircle,  color: 'bg-slate-100 text-slate-700' },
};

const statusMeta = {
  New:         { color: 'bg-red-100 text-red-700' },
  'In Progress': { color: 'bg-blue-100 text-blue-700' },
  Done:        { color: 'bg-green-100 text-green-700' },
};

const priorityMeta = {
  Low:     { color: 'bg-green-100 text-green-700',  badge: 'bg-green-50 border-green-200' },
  Medium:  { color: 'bg-yellow-100 text-yellow-700', badge: 'bg-yellow-50 border-yellow-200' },
  Critical:{ color: 'bg-red-100 text-red-700',      badge: 'bg-red-50 border-red-200' },
};

export default function Issues() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [detailIssue, setDetailIssue] = useState(null);
  const [form, setForm] = useState({
    clientId: '', contactPerson: '', type: 'General',
    description: '', priority: 'Medium',
  });

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (location?.state?.openCreate) {
      setShowModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, clientsRes] = await Promise.all([
        issuesAPI.getAll({ limit: 1000 }),
        clientsAPI.getAll({ limit: 1000 }),
      ]);
      setIssues(issuesRes.data?.issues || issuesRes.data || []);
      setClients(clientsRes.data?.clients || clientsRes.data || []);
    } catch { toast.error('Failed to load issues'); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    return issues.filter(issue => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (issue.description || '').toLowerCase().includes(q) ||
        (issue.contactPerson || '').toLowerCase().includes(q) ||
        (issue.client?.name || '').toLowerCase().includes(q) ||
        (issue.type || '').toLowerCase().includes(q);
      const matchStatus    = statusFilter    === 'all' || issue.status    === statusFilter;
      const matchType      = typeFilter      === 'all' || issue.type      === typeFilter;
      const matchPriority  = priorityFilter  === 'all' || issue.priority  === priorityFilter;
      return matchSearch && matchStatus && matchType && matchPriority;
    }).sort((a, b) => {
      if (a.priority === 'Critical' && b.priority !== 'Critical') return -1;
      if (b.priority === 'Critical' && a.priority !== 'Critical') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [issues, search, statusFilter, typeFilter, priorityFilter]);

  const stats = useMemo(() => ({
    total:    issues.length,
    newCount: issues.filter(i => i.status === 'New').length,
    progress: issues.filter(i => i.status === 'In Progress').length,
    done:     issues.filter(i => i.status === 'Done').length,
    critical: issues.filter(i => i.priority === 'Critical' && i.status !== 'Done').length,
  }), [issues]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const client = clients.find(c => c._id === form.clientId);
    if (!client) return toast.error('Select a client');
    try {
      await issuesAPI.create({
        client:            form.clientId,
        contactPerson:     form.contactPerson,
        type:              form.type,
        description:       form.description,
        priority:          form.priority,
      });
      toast.success('Issue raised successfully');
      setShowModal(false);
      setForm({ clientId: '', contactPerson: '', type: 'General', description: '', priority: 'Medium' });
      fetchData();
    } catch { toast.error('Failed to create issue'); }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await issuesAPI.updateStatus(issueId, { status: newStatus });
      setIssues(prev => prev.map(i => i._id === issueId ? { ...i, status: newStatus } : i));
      toast.success(`Status updated to ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
  };

  // ─── Export helpers ───
  const exportToCSV = () => {
    if (!filtered.length) return;
    const headers = ['ID', 'Client', 'Contact', 'Type', 'Priority', 'Status', 'Description', 'Created'];
    const rows = filtered.map(issue => [
      issue._id,
      issue.client?.name || '',
      issue.contactPerson || '',
      issue.type,
      issue.priority,
      issue.status,
      (issue.description || '').replace(/\n/g, ' ').replace(/"/g, '"'),
      new Date(issue.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `issues-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportToPDF = () => {
    document.title = 'Issues Report';
    setTimeout(() => window.print(), 300);
    setTimeout(() => { document.title = 'Issues'; }, 5000);
  };

  if (loading) return <div className="flex items-center justify-center min-h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition font-medium text-sm">
          <FileSpreadsheet size={16} /> Export Excel
        </button>
        <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition font-medium text-sm">
          <Printer size={16} /> Export PDF
        </button>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl transition">
          <Plus size={18} /> New Issue
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {[
          { label: 'Total Issues',  value: stats.total,    color: 'text-slate-800' },
          { label: 'New',          value: stats.newCount, color: 'text-red-600' },
          { label: 'In Progress',  value: stats.progress, color: 'text-blue-600' },
          { label: 'Resolved',     value: stats.done,     color: 'text-green-600' },
          { label: 'Critical',     value: stats.critical, color: 'text-orange-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-slate-500">{k.label}</p>
            <h2 className={`text-3xl font-bold mt-2 ${k.color}`}>{k.value}</h2>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search issues by client, type, or description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-3 text-sm">
              <option value="all">All Statuses</option>
              {ISSUE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-3 text-sm">
              <option value="all">All Types</option>
              {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-3 text-sm">
              <option value="all">All Priorities</option>
              {ISSUE_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Issues Table ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Client</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                    {search || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
                      ? 'No issues match your filters.'
                      : 'No issues raised yet. Click New Issue to get started.'}
                  </td>
                </tr>
              ) : (
                filtered.map(issue => {
                  const TypeIcon = typeMeta[issue.type]?.icon || AlertCircle;
                  return (
                    <tr key={issue._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold text-slate-800">{issue.client?.name || 'Unknown Client'}</p>
                          {issue.contactPerson && <p className="text-sm text-slate-500">{issue.contactPerson}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${typeMeta[issue.type]?.color || 'bg-slate-100 text-slate-700'}`}>
                          <TypeIcon size={13} /> {issue.type}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-slate-700 line-clamp-2 max-w-xs" title={issue.description}>
                          {issue.description}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityMeta[issue.priority]?.color}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {issue.status === 'Done' ? (
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${statusMeta.Done.color}`}>
                            <CheckCircle size={12} /> Done
                          </span>
                        ) : (
                          <select
                            value={issue.status}
                            onChange={e => handleStatusChange(issue._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer ${
                              issue.status === 'New'
                                ? 'bg-red-100 text-red-700'
                                : issue.status === 'In Progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ISSUE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setDetailIssue(issue)} title="View"
                            className="p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg">
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
          Showing {filtered.length} of {issues.length} issues
          {priorityFilter !== 'all' ? ` · Priority: ${priorityFilter}` : ''}
          {typeFilter !== 'all'          ? ` · Type: ${typeFilter}`           : ''}
          {statusFilter !== 'all'        ? ` · Status: ${statusFilter}`        : ''}
        </div>
      </div>

      {/* ── CREATE ISSUE MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Raise New Issue</h2>
                <p className="text-slate-500 mt-1">Log a client issue for the support team to resolve.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Client / Organization *</label>
                  <select
                    value={form.clientId}
                    onChange={e => setForm({ ...form, clientId: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a client…</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Name of the contact on this issue"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Type / Reason *</label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Priority *</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className={`w-full rounded-xl px-4 py-3 border-2 font-medium focus:outline-none focus:ring-2 transition ${
                      form.priority === 'Critical'
                        ? 'border-red-300 text-red-700 focus:ring-red-300'
                        : form.priority === 'Medium'
                          ? 'border-yellow-300 text-yellow-700 focus:ring-yellow-300'
                          : 'border-green-300 text-green-700 focus:ring-green-300'
                    }`}
                  >
                    {ISSUE_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium text-slate-700">Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Describe the issue in detail so the support team can understand and act…"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition font-medium">
                  Raise Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ISSUE DETAIL MODAL ── */}
      {detailIssue && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDetailIssue(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-xl ${priorityMeta[detailIssue.priority]?.badge}`}>
                  <AlertTriangle size={20} className={priorityMeta[detailIssue.priority]?.color.split(' ')[1]} />
                </span>
                <h2 className="text-xl font-bold text-slate-800">{detailIssue.type}</h2>
              </div>
              <button onClick={() => setDetailIssue(null)} className="text-slate-500 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Client</p>
                <p className="text-slate-700 font-medium">{detailIssue.client?.name || 'Unknown'}</p>
                {detailIssue.contactPerson && <p className="text-sm text-slate-500">{detailIssue.contactPerson}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase mb-1">Priority</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityMeta[detailIssue.priority]?.color}`}>
                    {detailIssue.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMeta[detailIssue.status]?.color}`}>
                    {detailIssue.status}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Description</p>
                <p className="text-slate-700 whitespace-pre-wrap">{detailIssue.description}</p>
              </div>
              {detailIssue.resolution && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase mb-1">Resolution</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{detailIssue.resolution}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Created</p>
                  <p className="text-sm text-slate-700">{new Date(detailIssue.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Assigned To</p>
                  <p className="text-sm text-slate-700">{detailIssue.assignedTo?.name || 'Unassigned'}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              {detailIssue.status !== 'Done' && (
                <button onClick={() => { handleStatusChange(detailIssue._id, 'Done'); setDetailIssue(null); }}
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition">
                  Mark Done
                </button>
              )}
              <button onClick={() => setDetailIssue(null)} className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
