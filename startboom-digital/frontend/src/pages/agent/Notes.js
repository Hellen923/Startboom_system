import React, { useState, useEffect } from 'react';
import { FileText, Search, Calendar, User, ExternalLink } from 'lucide-react';
import { clientsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await clientsAPI.getNotes();
      setNotes(res.data || []);
    } catch (error) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const q = search.toLowerCase();
    return !q || 
      note.notes?.toLowerCase().includes(q) ||
      note.client?.name?.toLowerCase().includes(q) ||
      note.client?.company?.toLowerCase().includes(q);
  });

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
          <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
          <p className="text-gray-600 mt-1">All notes you've added to clients</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {search ? 'No notes match your search' : 'No notes yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map(note => (
            <div key={note._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-gray-800 whitespace-pre-wrap">{note.notes}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{note.client?.name}</span>
                    {note.client?.company && (
                      <span className="text-gray-400">· {note.client.company}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(note.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <a
                  href={`/agent/clients`}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Client
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notes;