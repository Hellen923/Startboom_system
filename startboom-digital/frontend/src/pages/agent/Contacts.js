import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Phone, Mail, MessageCircle,
  Building2, User, X, Send, ChevronDown, ChevronUp,
  Cake, GitBranch
} from 'lucide-react';
import { clientsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const avatar = (name = '') => name.charAt(0).toUpperCase() || '?';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Contacts() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location && location.state && location.state.openCreate) {
      setShowCreate(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // all contacts flattened from all clients
  const [contacts, setContacts]     = useState([]);
  const [clients, setClients]       = useState([]);   // for org dropdown
  const [loading, setLoading]       = useState(true);

  // filters
  const [search, setSearch]         = useState('');
  const [orgFilter, setOrgFilter]   = useState('');
  const [sortKey, setSortKey]       = useState('name');
  const [sortDir, setSortDir]       = useState('asc');
  const [contactPage, setContactPage] = useState(1);
  const [contactPageSize, setContactPageSize] = useState(20);

  // create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({
    name: '', organisation: '', telephone: '', email: '',
    position: '', birthday: '', reportingLine: '',
  });
  const [saving, setSaving]         = useState(false);

  // email modal
  const [showEmail, setShowEmail]   = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailForm, setEmailForm]   = useState({ subject: '', message: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

// ┌─ Load all contacts from all clients ──────────────────────────────────────
   const loadContacts = async () => {
     setLoading(true);
     try {
       const res = await clientsAPI.getAll({ limit: 1000 });
       const allClients = res.data?.clients || res.data || [];
       const contactClients = allClients.filter(client => client.status !== 'prospect' || client.leadStatus === 'Converted');
       setClients(contactClients);

       // Flatten every client's contacts array, tagging each with org info
       const flat = [];
       contactClients.forEach(client => {
         // Add the client themselves as a contact
         if (client.email || client.phone) {
           flat.push({
             _key: `client_${client._id}`,
             name: client.name,
             email: client.email,
             phone: client.phone,
             position: client.position,
             organisation: client.company || client.name || '—',
             organisationId: client._id,
             isPrimary: true,
             clientId: client._id,
             isClient: true
           });
         }
         // Add each contact person
         (client.contacts || []).forEach(c => {
           flat.push({
             ...c,
             _key: `${client._id}_${c._id || c.name}`,
             clientId: client._id,
             organisation: client.company || client.name || '—',
             organisationId: client._id,
           });
         });
       });
       setContacts(flat);
     } catch (err) {
       toast.error('Failed to load contacts');
     } finally {
       setLoading(false);
     }
   };

  useEffect(() => { loadContacts(); }, [user]);

  // ── Filtered + sorted contacts ───────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = contacts.filter(c => {
      const q = search.toLowerCase();
      const matchSearch =
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.position || '').toLowerCase().includes(q) ||
        (c.organisation || '').toLowerCase().includes(q);
      const matchOrg = !orgFilter || c.organisationId === orgFilter;
      return matchSearch && matchOrg;
    });

    list.sort((a, b) => {
      const av = (a[sortKey] || '').toLowerCase();
      const bv = (b[sortKey] || '').toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return list;
  }, [contacts, search, orgFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => sortKey !== col
    ? <ChevronDown className="w-3 h-3 opacity-30 inline ml-1" />
    : sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;

  // ── Create contact — adds to the selected client's contacts array ────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim())         return toast.error('Contact name is required');
    if (!form.organisation)        return toast.error('Organisation is required');
    if (!form.telephone.trim() && !form.email.trim())
      return toast.error('At least a telephone or email is required');

    setSaving(true);
    try {
      // fetch current client, append new contact, save
      const clientRes = await clientsAPI.getById(form.organisation);
      const existing  = clientRes.data?.contacts || [];
      const newContact = {
        name:         form.name,
        position:     form.position,
        email:        form.email,
        phone:        form.telephone,
        birthday:     form.birthday || undefined,
        reportingLine: form.reportingLine,
        isPrimary:    false,
      };
      await clientsAPI.update(form.organisation, {
        contacts: [...existing, newContact],
      });
      toast.success(`${form.name} added to ${clients.find(c => c._id === form.organisation)?.company || 'organisation'}`);
      setShowCreate(false);
      setForm({ name: '', organisation: '', telephone: '', email: '', position: '', birthday: '', reportingLine: '' });
      loadContacts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  // ── Email ────────────────────────────────────────────────────────────────────
  const handleOpenEmail = (contact) => {
    if (!contact.email) return toast.error('No email address for this contact');
    setEmailTarget(contact);
    setEmailForm({ subject: '', message: '' });
    setShowEmail(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject.trim() || !emailForm.message.trim())
      return toast.error('Subject and message are required');
    setSendingEmail(true);
    try {
      await clientsAPI.sendEmail(emailTarget.clientId, {
        subject: emailForm.subject,
        message: emailForm.message,
      });
      toast.success(`Email sent to ${emailTarget.name}`);
      setShowEmail(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Phone / WhatsApp ─────────────────────────────────────────────────────────
  const handleCall = (contact) => {
    const num = contact.phone || contact.telephone;
    if (!num) return toast.error('No phone number for this contact');
    window.open(`tel:${num}`);
  };

  const handleWhatsApp = (contact) => {
    let number = (contact.phone || contact.telephone || '').trim();
    if (!number) return toast.error('No phone number for this contact');
    
    // Remove all non-digit characters except leading +
    number = number.replace(/[^\d+]/g, '');
    
    // Ensure number starts with + or country code
    if (!number.startsWith('+')) {
      if (number.startsWith('256')) {
        number = '+' + number;
      } else if (number.startsWith('0')) {
        number = '+256' + number.substring(1);
      } else if (/^[7-9]\d{8}$/.test(number)) {
        number = '+256' + number;
      } else {
        return toast.error('Invalid phone number format. Use +256XXXXXXXXX or 0XXXXXXXXX');
      }
    }
    
    // Remove + for WhatsApp URL (wa.me expects number without +)
    const cleanNumber = number.replace('+', '');
    window.open(`https://wa.me/${cleanNumber}?text=Hello ${contact.name},`, '_blank');
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const primaryCount  = contacts.filter(c => c.isPrimary).length;
  const orgCount      = new Set(contacts.map(c => c.organisationId)).size;
  const birthdayCount = contacts.filter(c => {
    if (!c.birthday) return false;
    const today = new Date();
    const bd    = new Date(c.birthday);
    return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
  }).length;

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} /> New Contact
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Total Contacts</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Organisations</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{orgCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Birthdays Today 🎂</p>
          <p className="text-3xl font-bold text-primary-500 mt-1">{birthdayCount}</p>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, position, organisation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={orgFilter}
            onChange={e => setOrgFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Organisations</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>
                {c.company || c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Contacts Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium">{search || orgFilter ? 'No contacts match your search' : 'No contacts yet'}</p>
            <p className="text-sm mt-1">
              {!search && !orgFilter && 'Add contacts to your client organisations to see them here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wider cursor-pointer" onClick={() => toggleSort('name')}>
                    Contact <SortIcon col="name" />
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wider cursor-pointer" onClick={() => toggleSort('organisation')}>
                    Organisation <SortIcon col="organisation" />
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wider cursor-pointer" onClick={() => toggleSort('position')}>
                    Position <SortIcon col="position" />
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Additional
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.slice((contactPage - 1) * contactPageSize, contactPage * contactPageSize).map(contact => (
                  <tr key={contact._key} className="hover:bg-gray-50 transition-colors">

                    {/* Contact name + primary badge */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 font-semibold text-sm">{avatar(contact.name)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          {contact.isPrimary && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Primary</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Organisation */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {contact.organisation}
                      </div>
                    </td>

                    {/* Position */}
                    <td className="px-5 py-3 text-gray-600">{contact.position || '—'}</td>

                    {/* Contact info */}
                    <td className="px-5 py-3">
                      {contact.email && <p className="text-gray-700">{contact.email}</p>}
                      {(contact.phone || contact.telephone) && (
                        <p className="text-gray-500 text-xs">{contact.phone || contact.telephone}</p>
                      )}
                    </td>

                    {/* Birthday + Reporting line */}
                    <td className="px-5 py-3">
                      {contact.birthday && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Cake className="w-3 h-3" />
                          {new Date(contact.birthday).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                      {contact.reportingLine && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <GitBranch className="w-3 h-3" />
                          Reports to: {contact.reportingLine}
                        </div>
                      )}
                      {!contact.birthday && !contact.reportingLine && <span className="text-gray-400">—</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCall(contact)}
                          title="Call"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Phone size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEmail(contact)}
                          title="Email"
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Mail size={15} />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(contact)}
                          title="WhatsApp"
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <MessageCircle size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
              Showing {Math.min(contactPage * contactPageSize, displayed.length)} of {displayed.length} contacts
            </div>
            <Pagination
              currentPage={contactPage}
              totalPages={Math.ceil(displayed.length / contactPageSize)}
              totalItems={displayed.length}
              pageSize={contactPageSize}
              onPageChange={setContactPage}
              onPageSizeChange={(s) => { setContactPageSize(s); setContactPage(1); }}
            />
          </div>
        )}
      </div>

      {/* ── CREATE CONTACT MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Contact</h2>
                <p className="text-sm text-gray-500 mt-0.5">Must be assigned to an organisation</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. Jane Doe"
                  />
                </div>

                {/* Organisation — must be assigned */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organisation *</label>
                  <select
                    value={form.organisation}
                    onChange={e => setForm(p => ({ ...p, organisation: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">-- Select organisation --</option>
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.company || c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Telephone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+256 700 000 000"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="jane@company.com"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. Finance Manager"
                  />
                </div>

                {/* Birthday */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1"><Cake size={14} /> Birthday</span>
                  </label>
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Reporting Line */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1"><GitBranch size={14} /> Reporting Line (reports to)</span>
                  </label>
                  <input
                    type="text"
                    value={form.reportingLine}
                    onChange={e => setForm(p => ({ ...p, reportingLine: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. John Smith (CEO)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EMAIL MODAL ── */}
      {showEmail && emailTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Send Email</h2>
                <p className="text-sm text-gray-500">To: {emailTarget.name} ({emailTarget.email})</p>
              </div>
              <button onClick={() => setShowEmail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. Follow-up on our meeting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  rows={5}
                  value={emailForm.message}
                  onChange={e => setEmailForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder={`Dear ${emailTarget.name},\n\n`}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEmail(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={sendingEmail}
                  className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
                  <Send size={15} />
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
