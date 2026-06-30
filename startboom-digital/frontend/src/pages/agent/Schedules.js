import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Video, 
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { schedulesAPI, clientsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Schedule Filters Component
const ScheduleFilters = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search schedules..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64"
        />
      </div>

      <select
        value={filters.type}
        onChange={(e) => handleFilterChange('type', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        <option value="">All Types</option>
        <option value="meeting">Meetings</option>
        <option value="call">Calls</option>
        <option value="follow-up">Follow-ups</option>
        <option value="task">Tasks</option>
      </select>

      <select
        value={filters.status}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        <option value="">All Status</option>
        <option value="scheduled">Scheduled</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );
};

// Schedule Calendar Component
const ScheduleCalendar = ({ schedules, onScheduleClick, onDateClick, focusDate = null }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  useEffect(() => {
    if (!focusDate) return;
    try {
      const d = new Date(focusDate);
      // set to first day of that month
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    } catch (e) {
      // ignore invalid
    }
  }, [focusDate]);
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    onDateClick(date);
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`prev-${i}`} className="p-2 text-gray-400"></div>);
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const daySchedules = getSchedulesForDate(date);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <div 
          key={i}
          onClick={() => handleDateClick(date)}
          className={`p-2 border min-h-24 cursor-pointer transition-colors ${
            isSelected
              ? 'bg-orange-500 text-white border-orange-500'
              : isToday
              ? 'bg-blue-50 border-blue-300'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${
              date.toDateString() === new Date().toDateString() 
                ? 'bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                : 'text-gray-900'
            }`}>
              {i}
            </span>
          </div>
          <div className="space-y-1">
            {daySchedules.slice(0, 3).map(schedule => (
              <div
                key={schedule._id}
                className={`text-xs p-1 rounded truncate cursor-pointer ${
                  schedule.type === 'meeting' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  schedule.type === 'call' ? 'bg-green-100 text-green-800 border border-green-200' :
                  'bg-purple-100 text-purple-800 border border-purple-200'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onScheduleClick(schedule);
                }}
              >
                {schedule.title}
              </div>
            ))}
            {daySchedules.length > 3 && (
              <div className="text-xs text-gray-500">
                +{daySchedules.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              Today
            </button>
            <button 
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden bg-white">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-3 text-center font-medium text-gray-700 border-b border-gray-200">
            {day}
          </div>
        ))}
        {renderMonthView()}
      </div>
    </motion.div>
  );
};

// Schedule List Component
const ScheduleList = ({ schedules, onEdit, onDelete, onComplete, loading }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'cancelled':
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default:
        return <Clock size={16} className="text-orange-500" />;
    }
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'in-person':
        return <MapPin size={16} className="text-gray-600" />;
      case 'zoom':
      case 'teams':
      case 'google-meet':
        return <Video size={16} className="text-blue-600" />;
      default:
        return <MapPin size={16} />;
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading schedules...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title & Agenda
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client & Attendees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type & Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority & Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr key={schedule._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <span>{schedule.title}</span>
                      {getPriorityBadge(schedule.priority)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {schedule.agenda?.substring(0, 60)}...
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {schedule.client?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {schedule.attendees.internal.length + schedule.attendees.external.length} attendees
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(schedule.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(schedule.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getModeIcon(schedule.mode)}
                    <span className="text-sm text-gray-900 capitalize">
                      {schedule.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {schedule.mode.replace('-', ' ')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(schedule.status)}
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {schedule.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {schedule.status === 'scheduled' && (
                      <button
                        onClick={() => onComplete(schedule._id)}
                        className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                        title="Mark as completed"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(schedule)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(schedule._id)}
                      className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {schedules.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
          <p className="text-gray-500">Get started by creating your first schedule.</p>
        </div>
      )}
    </motion.div>
  );
};

// Schedule Form Component
const ScheduleForm = ({ onClose, onSubmit, schedule, isEdit = false, clients = [], initialDate = null, onDateSelect }) => {
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    date: initialDate || '',
    duration: 60,
    type: 'meeting',
    mode: 'in-person',
    location: '',
    agenda: '',
    notes: '',
    priority: 'medium',
    reminders: [],
    attendees: {
      internal: [],
      external: []
    }
  });

  useEffect(() => {
    if (schedule) {
      const scheduleDate = new Date(schedule.date);
      const localDate = new Date(scheduleDate.getTime() - scheduleDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      setFormData({
        title: schedule.title || '',
        client: schedule.client?._id || '',
        date: localDate,
        duration: schedule.duration || 60,
        type: schedule.type || 'meeting',
        mode: schedule.mode || 'in-person',
        location: schedule.location || '',
        agenda: schedule.agenda || '',
        notes: schedule.notes || '',
        priority: schedule.priority || 'medium',
        reminders: schedule.reminders || [],
        attendees: schedule.attendees || { internal: [], external: [] }
      });
    } else if (initialDate) {
      setFormData(prev => ({ ...prev, date: initialDate }));
    }
  }, [schedule, initialDate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Auto-generate a Google Meet link if mode is Google Meet and location is empty
    let adjustedFormData = { ...formData };
    if (
      !adjustedFormData.location.trim() &&
      adjustedFormData.type === 'meeting' &&
      adjustedFormData.mode === 'google-meet'
    ) {
      adjustedFormData.location = generateDefaultLink('google-meet');
    }
    
    // Validate required fields
    if (!adjustedFormData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!adjustedFormData.client) {
      toast.error('Please select a client');
      return;
    }
    if (!adjustedFormData.date) {
      toast.error('Please select a date and time');
      return;
    }
    // Only require location for In Person meetings (Google Meet will be auto-generated)
    if (adjustedFormData.mode === 'in-person' && !adjustedFormData.location.trim()) {
      toast.error('Please enter a location for in-person meetings');
      return;
    }
    
    // Convert date to ISO string
    const submitData = {
      ...adjustedFormData,
      date: new Date(adjustedFormData.date).toISOString()
    };
    
    onSubmit(submitData);
  };

  const generateDefaultLink = (mode) => {
    if (mode === 'zoom') {
      return 'https://zoom.us/j/example-meeting-id';
    }
    if (mode === 'google-meet') {
      return 'https://meet.google.com/example-meeting-code';
    }
    if (mode === 'teams') {
      return 'https://teams.microsoft.com/l/meetup-join/example-meeting';
    }
    return '';
  };

  const handleReminderToggle = (reminder) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.includes(reminder)
        ? prev.reminders.filter(r => r !== reminder)
        : [...prev.reminders, reminder]
    }));
  };

  const getPlaceholder = (mode) => {
    switch (mode) {
      case 'in-person': return 'Enter physical address';
      case 'google-meet': return 'Google Meet link will be auto-generated';
      default: return 'Enter location or link';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Schedule' : 'Create New Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Meeting title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                required
                value={formData.client}
                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              >
                <option value="">Select client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, date: val }));
                  if (typeof onDateSelect === 'function') {
                    try { onDateSelect(val); } catch (err) {}
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              >
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
                <option value="follow-up">Follow-up</option>
                <option value="task">Task</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode *
              </label>
              <select
                required
                value={formData.mode}
                onChange={(e) => {
                  const newMode = e.target.value;
                  setFormData(prev => {
                    const updated = { ...prev, mode: newMode };
                    // Auto-fill Google Meet link when switching to Google Meet if empty
                    if (!prev.location && newMode === 'google-meet') {
                      updated.location = generateDefaultLink(newMode);
                    }
                    // Clear location if switching to in-person
                    if (newMode === 'in-person') {
                      updated.location = '';
                    }
                    return updated;
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              >
                <option value="in-person">In Person</option>
                <option value="google-meet">Google Meet</option>
              </select>
            </div>
          </div>

          {formData.mode === 'in-person' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              required={formData.mode === 'in-person'}
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Enter physical address"
            />
          </div>
        )}

        {formData.mode === 'google-meet' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Meet Link
            </label>
            <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
              <p className="text-sm text-gray-600">
                {formData.location ? formData.location : 'Google Meet link will be automatically generated'}
              </p>
            </div>
          </div>
        )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agenda
            </label>
            <textarea
              rows={3}
              value={formData.agenda}
              onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Meeting agenda and topics to discuss"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminders
            </label>
            <div className="flex flex-wrap gap-2">
              {['15min', '30min', '1hr', '2hr', '1day'].map(reminder => (
                <button
                  key={reminder}
                  type="button"
                  onClick={() => handleReminderToggle(reminder)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    formData.reminders.includes(reminder)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {reminder}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority }))}
                  className={`px-4 py-2 rounded-lg text-sm border capitalize transition-colors ${
                    formData.priority === priority
                      ? priority === 'high' 
                        ? 'bg-red-500 text-white border-red-500'
                        : priority === 'medium'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Any additional notes or preparation required"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              {isEdit ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Main Schedules Component
const Schedules = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDateForForm, setSelectedDateForForm] = useState(null);
  const [focusDate, setFocusDate] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    scheduled: 0,
    completed: 0,
    missed: 0
  });

  // Load schedules and clients on mount
  const loadData = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;
      
      // Fetch schedules and clients in parallel
      const [schedulesRes, clientsRes] = await Promise.all([
        schedulesAPI.getAll({ agentId: userId }),
        clientsAPI.getAll({ agent: userId })
      ]);

      const schedulesList = schedulesRes?.data?.schedules || schedulesRes?.data || [];
      const clientsList = clientsRes?.data?.clients || clientsRes?.data || [];
      
      setSchedules(schedulesList);
      setClients(clientsList);
      
      // Calculate stats
      const scheduled = schedulesList.filter(s => s.status === 'scheduled').length;
      const completed = schedulesList.filter(s => s.status === 'completed').length;
      const missed = schedulesList.filter(s => s.status === 'cancelled').length;
      
      setStats({ scheduled, completed, missed });
    } catch (error) {
      toast.error('Failed to load schedules');
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location?.state?.openCreate) {
      setShowForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const filteredSchedules = schedules.filter(schedule => {
    if (filters.type && schedule.type !== filters.type) return false;
    if (filters.status && schedule.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const clientName = schedule.client?.name || '';
      return (
        schedule.title.toLowerCase().includes(searchLower) ||
        clientName.toLowerCase().includes(searchLower) ||
        (schedule.agenda && schedule.agenda.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const handleCreateSchedule = async (scheduleData) => {
    try {
      const userId = user?._id || user?.id;
      const payload = {
        ...scheduleData,
        agent: userId
      };
      
      const response = await schedulesAPI.create(payload);
      const newSchedule = response?.data;
      
      setSchedules(prev => [...prev, newSchedule]);
      setShowForm(false);
      toast.success('Schedule created successfully');
      // focus calendar on the newly created schedule's month and switch to calendar view
      try {
        if (newSchedule?.date) {
          setFocusDate(new Date(newSchedule.date));
          setView('calendar');
        }
      } catch (e) {
        // ignore
      }
      loadData(); // Reload to update stats
    } catch (error) {
      toast.error('Failed to create schedule');
      console.error('Error creating schedule:', error);
    }
  };

  const handleUpdateSchedule = async (id, updates) => {
    try {
      const response = await schedulesAPI.update(id, updates);
      const updatedSchedule = response?.data;
      
      setSchedules(prev => 
        prev.map(s => s._id === id ? updatedSchedule : s)
      );
      setSelectedSchedule(null);
      toast.success('Schedule updated successfully');
      loadData(); // Reload to update stats
    } catch (error) {
      toast.error('Failed to update schedule');
      console.error('Error updating schedule:', error);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await schedulesAPI.delete(id);
      setSchedules(prev => prev.filter(s => s._id !== id));
      toast.success('Schedule deleted successfully');
      loadData(); // Reload to update stats
    } catch (error) {
      toast.error('Failed to delete schedule');
      console.error('Error deleting schedule:', error);
    }
  };

  const handleCompleteSchedule = async (id) => {
    try {
      const response = await schedulesAPI.update(id, { status: 'completed' });
      const updatedSchedule = response?.data;
      
      setSchedules(prev => 
        prev.map(s => s._id === id ? updatedSchedule : s)
      );
      toast.success('Schedule marked as completed');
      loadData(); // Reload to update stats
    } catch (error) {
      toast.error('Failed to complete schedule');
      console.error('Error completing schedule:', error);
    }
  };

  const handleDateClick = (date) => {
    // Format the date to datetime-local format (YYYY-MM-DDTHH:mm)
    const dateObj = new Date(date);
    dateObj.setHours(9, 0, 0, 0); // Default to 9:00 AM
    const localDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    setSelectedDateForForm(localDate);
    setShowForm(true);
  };

  const StatCard = ({ icon: Icon, label, value, color = 'orange' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Calendar}
          label="Scheduled Meetings"
          value={stats.scheduled}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completed}
          color="green"
        />
        <StatCard
          icon={AlertCircle}
          label="Missed/Cancelled"
          value={stats.missed}
          color="red"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors font-medium">
          <Download size={18} />
          <span>Export</span>
        </button>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 transition-colors font-medium"
        >
          <Plus size={18} />
          <span>New Schedule</span>
        </button>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <div className="flex space-x-2">
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              view === 'calendar' 
                ? 'bg-orange-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar size={18} />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              view === 'list' 
                ? 'bg-orange-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>List View</span>
          </button>
        </div>

        <ScheduleFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <ScheduleCalendar 
          schedules={filteredSchedules}
          onScheduleClick={setSelectedSchedule}
          onDateClick={handleDateClick}
          focusDate={focusDate}
        />
      ) : (
        <ScheduleList 
          schedules={filteredSchedules}
          onEdit={setSelectedSchedule}
          onDelete={handleDeleteSchedule}
          onComplete={handleCompleteSchedule}
          loading={loading}
        />
      )}

      {/* Modals */}
      {showForm && (
        <ScheduleForm
          onClose={() => {
            setShowForm(false);
            setSelectedSchedule(null);
            setSelectedDateForForm(null);
          }}
          onSubmit={handleCreateSchedule}
          schedule={selectedSchedule}
          clients={clients}
          initialDate={selectedDateForForm}
          onDateSelect={(localDate) => {
            if (localDate) {
              try {
                setFocusDate(new Date(localDate));
                setView('calendar');
              } catch (e) {}
            }
          }}
        />
      )}

      {selectedSchedule && !showForm && (
        <ScheduleForm
          onClose={() => setSelectedSchedule(null)}
          onSubmit={(data) => handleUpdateSchedule(selectedSchedule._id, data)}
          schedule={selectedSchedule}
          isEdit={true}
          clients={clients}
        />
      )}
    </div>
  );
};

export default Schedules;