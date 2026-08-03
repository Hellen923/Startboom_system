import React, { useState, useEffect } from 'react';
import { FileText, Search, Calendar, User, Plus, Edit2, Trash2, Tag, Star, ExternalLink, Building, X, Save } from 'lucide-react';
import { clientsAPI } from '../../services/api';
import { noteApi } from '../../services/enterpriseApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [standaloneNotes, setStandaloneNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, client-notes, standalone
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    type: 'note',
    category: '',
    tags: [],
    linkedClient: null,
    visibility: 'private'
  });

  useEffect(() => {
    fetchAllNotes();
    fetchClients();
  }, []);

  const fetchAllNotes = async () => {
    try {
      setLoading(true);
      // Get client interaction notes
      const clientNotesRes = await clientsAPI.getNotes();
      setNotes(clientNotesRes.data || []);
      
      // Get standalone notes from Note model
      const standaloneRes = await noteApi.getMyNotes();
      setStandaloneNotes(standaloneRes.data?.notes || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await clientsAPI.getAll({ limit: 1000 });
      setClients(res.data?.clients || res.data || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (newNote.linkedClient) {
        // Create as client interaction
        await clientsAPI.addInteraction(newNote.linkedClient, {
          type: 'other',
          notes: `${newNote.title}\n\n${newNote.content}`
        });
        toast.success('Client note added successfully');
      } else {
        // Create as standalone note
        await noteApi.create({
          title: newNote.title,
          content: newNote.content,
          type: newNote.type || 'note',
          category: newNote.category,
          tags: newNote.tags,
          visibility: newNote.visibility
        });
        toast.success('Note created successfully');
      }
      
      setShowAddModal(false);
      resetForm();
      fetchAllNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note');
    }
  };

  const handleDeleteStandaloneNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await noteApi.delete(noteId);
      toast.success('Note deleted successfully');
      fetchAllNotes();
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleToggleFavorite = async (noteId) => {
    try {
      await noteApi.toggleFavorite(noteId);
      fetchAllNotes();
    } catch (error) {
      toast.error('Failed to toggle favorite');
    }
  };

  const resetForm = () => {
    setNewNote({
      title: '',
      content: '',
      type: 'note',
      category: '',
      tags: [],
      linkedClient: null,
      visibility: 'private'
    });
  };

  const handleAddTag = (tag) => {
    if (tag && !newNote.tags.includes(tag)) {
      setNewNote({ ...newNote, tags: [...newNote.tags, tag] });
    }
  };

  const handleRemoveTag = (tag) => {
    setNewNote({ ...newNote, tags: newNote.tags.filter(t => t !== tag) });
  };

  const filteredClientNotes = notes.filter(note => {
    const q = search.toLowerCase();
    return !q ||
      note.notes?.toLowerCase().includes(q) ||
      note.client?.name?.toLowerCase().includes(q) ||
      note.client?.company?.toLowerCase().includes(q);
  });

  const filteredStandaloneNotes = standaloneNotes.filter(note => {
    const q = search.toLowerCase();
    return !q ||
      note.title?.toLowerCase().includes(q) ||
      note.content?.toLowerCase().includes(q) ||
      note.tags?.some(tag => tag.toLowerCase().includes(q));
  });

  const allNotes = [
    ...filteredClientNotes.map(n => ({ ...n, noteType: 'client' })),
    ...filteredStandaloneNotes.map(n => ({ ...n, noteType: 'standalone' }))
  ].sort((a, b) => new Date(b.date || b.updatedAt) - new Date(a.date || a.updatedAt));

  const displayNotes = activeTab === 'all' ? allNotes :
                       activeTab === 'client-notes' ? filteredClientNotes.map(n => ({ ...n, noteType: 'client' })) :
                       filteredStandaloneNotes.map(n => ({ ...n, noteType: 'standalone' }));

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-600">Manage your notes and client interactions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-brand flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'all' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Notes ({allNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('client-notes')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'client-notes' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Client Notes ({filteredClientNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('standalone')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'standalone' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Notes ({filteredStandaloneNotes.length})
        </button>
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Notes List */}
      {displayNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {search ? 'No notes match your search' : 'No notes yet'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Create your first note
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayNotes.map((note, index) => (
            <div key={note._id || index} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {note.noteType === 'standalone' && (
                    <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>
                  )}
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {note.noteType === 'client' ? note.notes : note.content}
                  </p>
                  
                  {note.noteType === 'standalone' && note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {note.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {note.noteType === 'standalone' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleFavorite(note._id)}
                      className={`p-2 rounded-lg transition-colors ${
                        note.favoritedBy?.includes(user?.id) 
                          ? 'text-yellow-500 hover:text-yellow-600' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Star className="w-4 h-4" fill={note.favoritedBy?.includes(user?.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleDeleteStandaloneNote(note._id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {note.noteType === 'client' && (
                    <>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{note.client?.name}</span>
                      </div>
                      {note.client?.company && (
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          <span>{note.client.company}</span>
                        </div>
                      )}
                    </>
                  )}
                  {note.noteType === 'standalone' && note.category && (
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span className="capitalize">{note.category}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(note.date || note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {note.noteType === 'client' && (
                  <a
                    href="/agent/clients"
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Client
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Note</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              {/* Note Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter note title..."
                  required
                />
              </div>

              {/* Link to Client (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Client (Optional)</label>
                <select
                  value={newNote.linkedClient || ''}
                  onChange={(e) => setNewNote({ ...newNote, linkedClient: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Standalone Note --</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} {client.company && `(${client.company})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Link this note to a client or leave blank for a standalone note
                </p>
              </div>

              {/* Note Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={6}
                  placeholder="Write your note here..."
                />
              </div>

              {/* Category (only for standalone notes) */}
              {!newNote.linkedClient && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newNote.category}
                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Meeting, Reminder, Idea"
                  />
                </div>
              )}

              {/* Tags (only for standalone notes) */}
              {!newNote.linkedClient && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newNote.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Type a tag and press Enter"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-brand flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
