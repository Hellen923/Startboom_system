/* eslint-disable jsx-a11y/anchor-is-valid */
// frontend/src/pages/agent/Leads.js

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Mail, Phone, MessageCircle,
  LayoutGrid, Table as TableIcon, ArrowRightLeft,
  Calendar, StickyNote, X, Send, Users,
} from "lucide-react";
import { clientsAPI, usersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import Pagination from '../../components/Pagination';

const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Unqualified",
  "Qualified",
  "Converted",
];

const LEAD_RATINGS = ["Cold", "Warm", "Hot"];
const POSITION_OPTIONS = [
  "Owner",
  "CEO / Managing Director",
  "Director",
  "Manager",
  "Procurement Officer",
  "Finance Officer",
  "Operations Officer",
  "Sales / Marketing",
  "Administrator",
  "Other",
];

const statusColors = {
  New: "bg-primary-100 text-primary-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Unqualified: "bg-red-100 text-red-700",
  Qualified: "bg-green-100 text-green-700",
  Converted: "bg-emerald-100 text-emerald-700",
};

const ratingColors = {
  Cold: "bg-slate-100 text-slate-700",
  Warm: "bg-primary-100 text-primary-700",
  Hot: "bg-red-100 text-red-700",
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [leadPage, setLeadPage] = useState(1);
  const [leadPageSize, setLeadPageSize] = useState(20);

  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    contactName: "",
    telephone: "+256",
    email: "",
    position: "Manager",
    companyName: "",
    companyEmail: "",
    rating: "Cold",
    leadStatus: "New",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location?.state?.openCreate) {
      setShowModal(true);
      // clear the navigation state to avoid reopening
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const [prospectsResponse, assignedResponse] = await Promise.all([
        clientsAPI.getAll({ status: 'prospect', limit: 500 }),
        clientsAPI.getAll({ limit: 1000 }),
      ]);
      const prospects = prospectsResponse?.data?.clients || prospectsResponse?.data || [];
      const assignedClients = assignedResponse?.data?.clients || assignedResponse?.data || [];
      const byId = new Map();
      [...prospects, ...assignedClients].forEach((client) => {
        if (client.status === 'prospect' || client.leadStatus === 'Converted') {
          byId.set(client._id, client);
        }
      });
      setLeads(Array.from(byId.values()));
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // support both contactName (lead-specific) and name (existing client field)
      const displayName = lead.contactName || lead.name || '';
      const displayCompany = lead.companyName || lead.company || '';

      const matchesSearch =
        displayName.toLowerCase().includes(search.toLowerCase()) ||
        displayCompany.toLowerCase().includes(search.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        lead.leadStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const normalizePhoneNumber = (value) => {
    const compact = String(value || "").trim().replace(/[\s().-]/g, "");
    if (!compact) return { valid: false, message: "Telephone number is required" };

    if (compact.startsWith("00")) {
      const international = `+${compact.slice(2)}`;
      return /^\+[1-9]\d{7,14}$/.test(international)
        ? { valid: true, value: international }
        : { valid: false, message: "Enter a valid international number" };
    }

    if (compact.startsWith("+")) {
      if (!/^\+[1-9]\d{7,14}$/.test(compact)) {
        return { valid: false, message: "Enter a valid international number, for example +256XXXXXXXXX" };
      }
      if (compact.startsWith("+256") && !/^\+256\d{9}$/.test(compact)) {
        return { valid: false, message: "Uganda numbers should use +256 followed by 9 digits" };
      }
      return { valid: true, value: compact };
    }

    if (/^0\d{9}$/.test(compact)) {
      return { valid: true, value: `+256${compact.slice(1)}` };
    }

    if (/^[237]\d{8}$/.test(compact)) {
      return { valid: true, value: `+256${compact}` };
    }

    if (/^256\d{9}$/.test(compact)) {
      return { valid: true, value: `+${compact}` };
    }

    return { valid: false, message: "Use +256XXXXXXXXX, 07XXXXXXXX, or a valid international number" };
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    const phone = normalizePhoneNumber(formData.telephone);
    if (!phone.valid) {
      toast.error(phone.message);
      return;
    }

    try {
      const payload = {
        // map lead fields to existing Client model fields
        name: formData.contactName,
        phone: phone.value,
        email: formData.email,
        position: formData.position,
        company: formData.companyName,
        // lead-specific fields stored in Client model
        contactName: formData.contactName,
        telephone: phone.value,
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        rating: formData.rating,
        leadStatus: formData.leadStatus,
        status: 'prospect',
        agent: user?._id || user?.id,
      };
      const response = await clientsAPI.create(payload);
      setLeads((prev) => [response.data, ...prev]);
      toast.success('Lead created successfully!');
      setShowModal(false);
      setFormData({
        contactName: '', telephone: '+256', email: '',
        position: 'Manager', companyName: '', companyEmail: '',
        rating: 'Cold', leadStatus: 'New',
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error(error.response?.data?.message || 'Failed to create lead');
    }
  };

  // ── Action handlers ────────────────────────────────────────────────────────

  // Phone — opens dialler
  const handleCall = (lead) => {
    const number = lead.telephone || lead.phone;
    if (!number) return toast.error('No phone number on this lead');
    window.open(`tel:${number}`);
  };

  // Email — opens compose modal pre-filled
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailLead, setEmailLead] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleOpenEmail = (lead) => {
    if (!lead.email) return toast.error('No email address on this lead');
    setEmailLead(lead);
    setEmailForm({ subject: '', message: '' });
    setShowEmailModal(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject.trim() || !emailForm.message.trim())
      return toast.error('Subject and message are required');
    setSendingEmail(true);
    try {
      await clientsAPI.sendEmail(emailLead._id, emailForm);
      toast.success(`Email sent to ${emailLead.contactName || emailLead.name}`);
      setShowEmailModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // WhatsApp — opens wa.me link
  const handleWhatsApp = (lead) => {
    let number = (lead.telephone || lead.phone || '').trim();
    if (!number) return toast.error('No phone number on this lead');
    
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
    const name = lead.contactName || lead.name || '';
    window.open(`https://wa.me/${cleanNumber}?text=Hello ${name}, I wanted to follow up with you.`, '_blank');
  };

  // Notes — inline note modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteLead, setNoteLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const handleOpenNote = (lead) => {
    setNoteLead(lead);
    setNoteText('');
    setShowNoteModal(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return toast.error('Note cannot be empty');
    setSavingNote(true);
    try {
      await clientsAPI.addInteraction(noteLead._id, { type: 'other', notes: noteText });
      toast.success('Note saved');
      setShowNoteModal(false);
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  // Event/Calendar — opens schedule page with lead pre-selected via URL param
  const handleEvent = (lead) => {
    window.location.href = `/agent/schedules?leadId=${lead._id}&leadName=${encodeURIComponent(lead.contactName || lead.name || '')}`;
  };

  // Forward — reassign lead to another agent
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardLead, setForwardLead] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [forwarding, setForwarding] = useState(false);

  const handleOpenForward = async (lead) => {
    setForwardLead(lead);
    setSelectedAgent('');
    setShowForwardModal(true);
    try {
      const res = await usersAPI.getAll();
      const all = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      setAgents(all.filter(u => u.role === 'agent' && u._id !== (user?._id || user?.id)));
    } catch {
      toast.error('Failed to load agents');
    }
  };

  const handleForward = async (e) => {
    e.preventDefault();
    if (!selectedAgent) return toast.error('Please select an agent');
    setForwarding(true);
    try {
      await clientsAPI.update(forwardLead._id, { agent: selectedAgent });
      toast.success(`Lead forwarded successfully`);
      setShowForwardModal(false);
      // remove from current agent's list
      setLeads(prev => prev.filter(l => l._id !== forwardLead._id));
    } catch (err) {
      toast.error('Failed to forward lead');
    } finally {
      setForwarding(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    // optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead._id === leadId
          ? { ...lead, leadStatus: newStatus, status: newStatus === 'Converted' ? 'active' : 'prospect' }
          : lead
      )
    );
    try {
      await clientsAPI.update(leadId, {
        leadStatus: newStatus,
        status: newStatus === 'Converted' ? 'active' : 'prospect',
      });
      if (newStatus === 'Converted') {
        toast.success('Lead converted to active client!');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error(error.response?.data?.message || 'Failed to update lead status');
      fetchLeads(); // revert on error
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const draggedLead = leads.find((lead) => lead._id === draggableId);
    if (!draggedLead || (draggedLead.leadStatus || 'New') === newStatus) return;

    await handleStatusChange(draggableId, newStatus);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Quick Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl transition-all"
        >
          <Plus size={18} />
          Create Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-slate-500">Total Leads</p>
          <h2 className="text-3xl font-bold mt-2">
            {leads.length}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-slate-500">Hot Leads</p>
          <h2 className="text-3xl font-bold mt-2 text-red-600">
            {
              leads.filter((lead) => lead.rating === "Hot")
                .length
            }
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-slate-500">
            Qualified Leads
          </p>
          <h2 className="text-3xl font-bold mt-2 text-green-600">
            {
              leads.filter(
                (lead) => lead.leadStatus === "Qualified"
              ).length
            }
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-slate-500">
            Converted Leads
          </p>
          <h2 className="text-3xl font-bold mt-2 text-emerald-600">
            {
              leads.filter(
                (lead) => lead.leadStatus === "Converted"
              ).length
            }
          </h2>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-96">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="border border-slate-200 rounded-xl px-4 py-3"
            >
              <option value="All">All Statuses</option>

              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === "table"
                    ? "bg-white shadow-sm"
                    : ""
                }`}
              >
                <TableIcon size={16} />
                Table
              </button>

              <button
                onClick={() => setViewMode("kanban")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === "kanban"
                    ? "bg-white shadow-sm"
                    : ""
                }`}
              >
                <LayoutGrid size={16} />
                Kanban
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left px-6 py-4">
                    Contact
                  </th>
                  <th className="text-left px-6 py-4">
                    Company
                  </th>
                  <th className="text-left px-6 py-4">
                    Rating
                  </th>
                  <th className="text-left px-6 py-4">
                    Status
                  </th>
                  <th className="text-left px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.slice((leadPage - 1) * leadPageSize, leadPage * leadPageSize).map((lead) => (
                  <tr
                    key={lead._id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {lead.contactName || lead.name}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {lead.email}
                        </p>

                        <p className="text-sm text-slate-500">
                          {lead.telephone || lead.phone}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div>
                        <h3 className="font-medium">
                          {lead.companyName || lead.company}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {lead.position}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ratingColors[
                            lead.rating || "Cold"
                          ]
                        }`}
                      >
                        {lead.rating || "Cold"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <select
                        value={lead.leadStatus || "New"}
                        onChange={(e) =>
                          handleStatusChange(
                            lead._id,
                            e.target.value
                          )
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium border-0 ${
                          statusColors[
                            lead.leadStatus || "New"
                          ]
                        }`}
                      >
                        {LEAD_STATUSES.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCall(lead)}
                          title="Call"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Phone size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEmail(lead)}
                          title="Email"
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(lead)}
                          title="WhatsApp"
                          className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenNote(lead)}
                          title="Add Note"
                          className="p-1.5 text-slate-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        >
                          <StickyNote size={16} />
                        </button>
                        <button
                          onClick={() => handleEvent(lead)}
                          title="Schedule Event"
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Calendar size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenForward(lead)}
                          title="Forward to Agent"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <ArrowRightLeft size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filteredLeads.length === 0 && (
              <div className="text-center py-16 text-slate-500">No leads found.</div>
            )}
            <Pagination
              currentPage={leadPage}
              totalPages={Math.ceil(filteredLeads.length / leadPageSize)}
              totalItems={filteredLeads.length}
              pageSize={leadPageSize}
              onPageChange={setLeadPage}
              onPageSizeChange={(s) => { setLeadPageSize(s); setLeadPage(1); }}
            />
          </div>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === "kanban" && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {LEAD_STATUSES.map((status) => {
              const statusLeads = filteredLeads.filter(
                (lead) =>
                  (lead.leadStatus || "New") === status
              );
              
              return (
                <div
                  key={status}
                  className="bg-slate-100 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-slate-700">
                      {status}
                    </h2>

                    <span className="bg-white px-3 py-1 rounded-full text-sm">
                      {statusLeads.length}
                    </span>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-4 min-h-[120px]"
                      >
                        {statusLeads.map((lead, index) => (
                          <Draggable key={lead._id} draggableId={String(lead._id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${snapshot.isDragging ? 'ring-2 ring-primary-300 shadow-lg' : ''}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold">
                                      {lead.contactName || lead.name}
                                    </h3>

                                    <p className="text-sm text-slate-500">
                                      {lead.companyName || lead.company}
                                    </p>
                                  </div>

                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      ratingColors[
                                        lead.rating || "Cold"
                                      ]
                                    }`}
                                  >
                                    {lead.rating || "Cold"}
                                  </span>
                                </div>

                                <div className="mt-4 flex gap-2">
                                  <button
                                    onClick={() => handleCall(lead)}
                                    title="Call"
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Phone size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEmail(lead)}
                                    title="Email"
                                    className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  >
                                    <Mail size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleWhatsApp(lead)}
                                    title="WhatsApp"
                                    className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  >
                                    <MessageCircle size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenForward(lead)}
                                    title="Forward"
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  >
                                    <ArrowRightLeft size={15} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* ── EMAIL MODAL ── */}
      {showEmailModal && emailLead && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Send Email</h2>
                <p className="text-sm text-slate-500">To: {emailLead.contactName || emailLead.name} ({emailLead.email})</p>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Follow-up on our conversation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message *</label>
                <textarea
                  rows={5}
                  value={emailForm.message}
                  onChange={e => setEmailForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder={`Dear ${emailLead.contactName || emailLead.name},\n\n`}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEmailModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={sendingEmail}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
                  <Send size={15} />
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NOTE MODAL ── */}
      {showNoteModal && noteLead && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Add Note</h2>
                <p className="text-sm text-slate-500">{noteLead.contactName || noteLead.name}</p>
              </div>
              <button onClick={() => setShowNoteModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <textarea
                rows={5}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Write your note here..."
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowNoteModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={savingNote}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm disabled:opacity-50">
                  {savingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FORWARD MODAL ── */}
      {showForwardModal && forwardLead && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Forward Lead</h2>
                <p className="text-sm text-slate-500">Reassign {forwardLead.contactName || forwardLead.name} to another agent</p>
              </div>
              <button onClick={() => setShowForwardModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleForward} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Agent *</label>
                <select
                  value={selectedAgent}
                  onChange={e => setSelectedAgent(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Choose an agent --</option>
                  {agents.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.email})</option>
                  ))}
                </select>
                {agents.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">No other agents found in your organisation.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForwardModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={forwarding || !selectedAgent}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
                  <Users size={15} />
                  {forwarding ? 'Forwarding...' : 'Forward Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LEAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">
                  Create New Lead
                </h2>

                <p className="text-slate-500 mt-1">
                  Add a new prospect into the sales funnel.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 text-2xl"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateLead}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-medium">
                    Contact Name
                  </label>

                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Telephone
                  </label>

                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    onBlur={() => {
                      const phone = normalizePhoneNumber(formData.telephone);
                      if (phone.valid) {
                        setFormData((prev) => ({ ...prev, telephone: phone.value }));
                      }
                    }}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                    placeholder="+256XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Position
                  </label>

                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  >
                    {POSITION_OPTIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Company Name
                  </label>

                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Company Email
                  </label>

                  <input
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Lead Rating
                  </label>

                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  >
                    {LEAD_RATINGS.map((rating) => (
                      <option
                        key={rating}
                        value={rating}
                      >
                        {rating}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Lead Status
                  </label>

                  <select
                    name="leadStatus"
                    value={formData.leadStatus}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  >
                    {LEAD_STATUSES.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl border border-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
