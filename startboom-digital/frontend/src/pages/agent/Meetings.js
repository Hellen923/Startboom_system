import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Plus, Edit, Trash2, CheckCircle, Clock, X, MapPin } from 'lucide-react';
import { meetingsAPI, clientsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm';

const MeetingForm = ({ meeting, clients, onSave, onClose }) => {
  const { user } = useAuth();
  const toLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const [form, setForm] = useState({
    title: meeting?.title || '',
    client: meeting?.client?._id || meeting?.client || '',
    date: toLocal(meeting?.date || meeting?.scheduledTime),
    duration: meeting?.duration || 60,
    mode: meeting?.mode || 'in-person',
    location: meeting?.location || '',
    agenda: meeting?.agenda || '',
    notes: meeting?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.client || !form.date) {
      toast.error('Title, client and date are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        date: new Date(form.date).toISOString(),
        scheduledTime: new Date(form.date).toISOString(),
        agent: user?._id || user?.id,
      };
      if (meeting?._id) {
        await meetingsAPI.update(meeting._id, payload);
        toast.success('Meeting updated');
      } else {
        await meetingsAPI.create(payload);
        toast.success('Meeting created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{meeting ? 'Edit Meeting' : 'New Meeting'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Meeting title" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} className={inputCls} required>
              <option value="">Select client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" min="1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))} className={inputCls}>
                <option value="in-person">In Person</option>
                <option value="google-meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="phone">Phone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location / Link</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} placeholder="Address or meeting link" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
            <textarea rows={2} value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} className={inputCls} placeholder="Topics to discuss" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="Additional notes" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 btn-brand rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving...' : meeting ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Meetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        meetingsAPI.getAll({ limit: 200 }),
        clientsAPI.getAll({ limit: 1000 }),
      ]);
      setMeetings(mRes.data?.meetings || []);
      setClients(cRes.data?.clients || []);
    } catch {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meeting?')) return;
    try {
      await meetingsAPI.delete(id);
      toast.success('Meeting deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleComplete = async (id) => {
    try {
      await meetingsAPI.update(id, { status: 'completed' });
      toast.success('Marked as completed');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const stats = {
    scheduled: meetings.filter(m => m.status === 'scheduled').length,
    completed: meetings.filter(m => m.status === 'completed').length,
    cancelled: meetings.filter(m => m.status === 'cancelled').length,
  };

  const getDate = (m) => m.date || m.scheduledTime;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Scheduled', value: stats.scheduled, icon: Clock, bg: 'bg-blue-100', color: 'text-blue-600' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' },
          { label: 'Cancelled', value: stats.cancelled, icon: X, bg: 'bg-red-100', color: 'text-red-600' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-full ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-primary-600" /> Meetings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Schedule and track client meetings</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 btn-brand rounded-lg text-sm font-semibold">
          <Plus className="w-4 h-4" /> New Meeting
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No meetings yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first meeting to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Date & Time</th>
                  <th className="px-4 py-3 text-left font-medium">Mode</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {meetings.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{m.title}</p>
                      {m.agenda && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{m.agenda}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.client?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{getDate(m) ? new Date(getDate(m)).toLocaleDateString() : '—'}</p>
                      <p className="text-xs text-gray-400">
                        {getDate(m) ? new Date(getDate(m)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}{m.duration ? ` · ${m.duration}min` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{m.mode?.replace('-', ' ') || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{m.location || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[m.status] || 'bg-gray-100 text-gray-600'}`}>
                        {m.status || 'scheduled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {(m.status === 'scheduled' || !m.status) && (
                          <button onClick={() => handleComplete(m._id)} title="Mark complete"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => { setEditing(m); setShowForm(true); }} title="Edit"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(m._id)} title="Delete"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <MeetingForm
          meeting={editing}
          clients={clients}
          onSave={() => { setShowForm(false); setEditing(null); load(); }}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
};

export default Meetings;
