import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ListTodo, Plus, Search, Calendar, Phone, Mail, MessageSquare,
  Clock, CheckSquare, Square, AlertCircle, UserX, MoreHorizontal,
  AlertTriangle, ChevronDown, ChevronRight, X, Users, Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { clientsAPI } from '../../services/api';

const TASK_SUBJECTS = ['Call', 'Support', 'Follow-up', 'Meeting', 'Review', 'Other'];
const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'waiting', 'deferred'];
const TASK_PRIORITIES = ['Low', 'Medium', 'Critical'];

const statusMeta = {
  pending:   { label: 'Pending',     color: 'bg-slate-100 text-slate-700', icon: Clock },
  in_progress:{ label: 'In Progress', color: 'bg-blue-100 text-blue-700',   icon: AlertTriangle },
  completed: { label: 'Completed',  color: 'bg-green-100 text-green-700',  icon: CheckSquare },
  waiting:   { label: 'Waiting',    color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  deferred:  { label: 'Deferred',   color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

const priorityMeta = {
  Low:     { color: 'bg-green-100 text-green-700',  progress: 25 },
  Medium:  { color: 'bg-yellow-100 text-yellow-700', progress: 60 },
  Critical:{ color: 'bg-red-100 text-red-700',      progress: 95 },
};

export default function Tasks() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);

  const [form, setForm] = useState({
    clientId: '', contactPerson: '', subject: 'Call',
    description: '', dueDate: '', priority: 'Medium', status: 'pending',
  });

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { if (clients.length) fetchAgents(); }, [clients]);

  useEffect(() => {
    if (location?.state?.openCreate) {
      setShowModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const res = await clientsAPI.getAll({ limit: 1000 });
      const clientsData = res.data?.clients || [];
      setClients(clientsData);

      const tasks = [];
      clientsData.forEach(c => {
        (c.tasks || []).forEach(t => tasks.push({ ...t, clientName: c.name, clientId: c._id }));
      });
      setAllTasks(tasks);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const fetchAgents = async () => {
    try {
      const res = await clientsAPI.getAll({ limit: 5 });
      const anyClients = res.data?.clients || [];
      if (anyClients.length) {
        const first = anyClients[0];
        if (first.assignedAgents) {
          const agentList = first.assignedAgents.map(a => ({ _id: a._id, name: a.name, email: a.email }));
          if (agentList.length) setAgents(agentList);
        }
      }
    } catch {}
  };

  const filtered = useMemo(() => {
    return allTasks.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.clientName || '').toLowerCase().includes(q) ||
        (t.contactPerson || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    }).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
    });
  }, [allTasks, search, statusFilter, priorityFilter]);

  const stats = useMemo(() => ({
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    overdue: allTasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length,
  }), [allTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const client = clients.find(c => c._id === form.clientId);
    if (!client) return toast.error('Select a client');
    try {
      await clientsAPI.addTask(form.clientId, {
        title: `${form.subject} — ${client.name}`,
        description: form.description,
        dueDate: form.dueDate,
        dueTime: '',
        assignedTo: user?._id,
        type: form.subject.toLowerCase(),
        status: form.status,
        priority: form.priority,
        contactPerson: form.contactPerson,
      });
      toast.success('Task created');
      setShowModal(false);
      setForm({ clientId: '', contactPerson: '', subject: 'Call', description: '', dueDate: '', priority: 'Medium', status: 'pending' });
      fetchAllData();
    } catch { toast.error('Failed to create task'); }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await clientsAPI.update(task.clientId, {
        tasks: task.clientTasks
          ? task.clientTasks.map(t => t._id === task._id ? { ...t, status: newStatus, completed: newStatus === 'completed' } : t)
          : [{ ...task, status: newStatus, completed: newStatus === 'completed' }],
      });
      setAllTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus, completed: newStatus === 'completed' } : t));
      toast.success(newStatus === 'completed' ? 'Task completed!' : 'Task reopened');
    } catch { toast.error('Failed to update task'); }
  };

  const isOverdue = (task) => !task.completed && task.dueDate && new Date(task.dueDate) < new Date();

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Quick Add Button */}
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white px-5 py-3 rounded-xl transition-all">
          <Plus size={18} /> Create Task
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'text-slate-800' },
          { label: 'In Progress', value: stats.pending, color: 'text-blue-600' },
          { label: 'Completed', value: stats.completed, color: 'text-green-600' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-slate-500">{k.label}</p>
            <h2 className={`text-3xl font-bold mt-2 ${k.color}`}>{k.value}</h2>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-3 text-sm">
              <option value="all">All Statuses</option>
              {TASK_STATUSES.map(s => <option key={s} value={s}>{statusMeta[s]?.label || s}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-3 text-sm">
              <option value="all">All Priorities</option>
              {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No tasks match your filters.</div>
        ) : (
          filtered.map(task => {
            const isExpanded = expandedTask === task._id;
            const overdue = isOverdue(task);
            const subjectLabel = task.subject || 'Task';
            const StatusIcon = statusMeta[task.status]?.icon || Clock;
            return (
              <div key={task._id} className="hover:bg-slate-50 transition-colors">
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0">
                  {/* Checkbox + Title */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button onClick={() => handleToggleComplete(task)}
                      className={`mt-1 flex-shrink-0 ${task.completed ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`}>
                      {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-semibold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta[task.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                          <StatusIcon size={11} /> {statusMeta[task.status]?.label || task.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityMeta[task.priority]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {task.priority}
                        </span>
                        {overdue && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse">Overdue</span>}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {task.clientName}{task.contactPerson ? ` · ${task.contactPerson}` : ''}
                        {task.dueDate ? ` · Due ${(() => { const d = new Date(task.dueDate); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); })()}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
                    <button onClick={() => setDetailTask(task)} title="View details" className="p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg">
                      <MoreHorizontal size={18} />
                    </button>
                    <button title="Call" className="p-2 text-slate-500 hover:bg-green-50 hover:text-green-600 rounded-lg">
                      <Phone size={18} />
                    </button>
                    <button title="Email" className="p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                      <Mail size={18} />
                    </button>
                    <button title="WhatsApp" className="p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg">
                      <MessageSquare size={18} />
                    </button>
                    <button title={isExpanded ? 'Collapse' : 'Expand'} onClick={() => setExpandedTask(isExpanded ? null : task._id)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-slate-100 pt-4 ml-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(task.description || '').length > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Description</p>
                          <p className="text-sm text-slate-700">{task.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Type</p>
                        <p className="text-sm text-slate-700">{subjectLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Due Date</p>
                        <p className={`text-sm flex items-center gap-1 ${overdue && !task.completed ? 'text-red-600 font-medium' : 'text-slate-700'}`}>
                          <Calendar size={13} />                         {task.dueDate ? (() => { const d = new Date(task.dueDate); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); })() : 'No date set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Assigned To</p>
                        <p className="text-sm text-slate-700">{task.assignedTo?.name || 'Me'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Client</p>
                        <p className="text-sm text-slate-700">{task.clientName || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      <div className="text-center text-xs text-slate-400 py-2">
        Showing {filtered.length} of {allTasks.length} tasks
        {priorityFilter !== 'all' ? ` · Priority: ${priorityFilter}` : ''}
        {statusFilter !== 'all' ? ` · Status: ${statusMeta[statusFilter]?.label || statusFilter}` : ''}
      </div>

      {/* ── CREATE TASK MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[min(90vh,900px)] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between p-8 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Create New Task</h2>
                <p className="text-slate-500 mt-1">Add a new task linked to a client record.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreateTask} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-8 py-4 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium text-slate-700">Client / Organization *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={form.clientId}
                      onChange={e => setForm({ ...form, clientId: e.target.value })}
                      required
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a client…</option>
                      {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Main point of contact"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Type / Subject</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TASK_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Assigned To</label>
                  <select
                    value={user?._id || ''}
                    disabled
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-400 bg-slate-50 cursor-not-allowed"
                  >
                    <option value={user?._id || ''}>Me ({user?.name || 'Current agent'})</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Auto-assigned to you. Team assignment coming soon.</p>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TASK_STATUSES.map(s => <option key={s} value={s}>{statusMeta[s]?.label || s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the task in detail…"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              {/* Priority preview bar */}
              <div>
                <p className="text-xs text-slate-400 mb-1">Priority preview</p>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      form.priority === 'Critical' ? 'bg-red-500' :
                      form.priority === 'Medium'  ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    style={{ width: `${priorityMeta[form.priority]?.progress || 50}%` }}
                  />
                </div>
              </div>
              </div>
              <div className="flex-shrink-0 flex justify-end gap-4 p-8 pt-4 border-t border-slate-100 bg-gray-50">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-3 rounded-xl bg-orange-400 hover:bg-orange-500 text-white transition">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {detailTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDetailTask(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">{detailTask.title}</h2>
              <button onClick={() => setDetailTask(null)} className="text-slate-500 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium mt-1 ${statusMeta[detailTask.status]?.color}`}>
                    {statusMeta[detailTask.status]?.label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Priority</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium mt-1 ${priorityMeta[detailTask.priority]?.color}`}>
                    {detailTask.priority}
                  </span>
                </div>
              </div>
              {(detailTask.description || '').length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase mb-1">Description</p>
                  <p className="text-slate-700">{detailTask.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Due Date</p>
                  <p className="text-slate-700">{detailTask.dueDate ? (() => { const d = new Date(detailTask.dueDate); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); })() : 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Type</p>
                  <p className="text-slate-700">{detailTask.subject || 'Task'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Client</p>
                  <p className="text-slate-700">{detailTask.clientName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Assigned To</p>
                  <p className="text-slate-700">{detailTask.assignedTo?.name || 'Me'}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setDetailTask(null)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition">Close</button>
              {!detailTask.completed && (
                <button onClick={() => { handleToggleComplete(detailTask); setDetailTask(null); }}
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition">
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
