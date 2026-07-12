// Custom Fields Manager - Add custom fields to any entity
import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Plus,
  Edit2,
  Trash2,
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  List,
  DollarSign,
  Image,
  File,
  Users
} from 'lucide-react';
import { customFieldApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CustomFields = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState('client');
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);

  useEffect(() => {
    fetchFields();
  }, [selectedEntity]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await customFieldApi.getByEntity(selectedEntity);
      setFields(response.data.fields || []);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      toast.error('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async (fieldData) => {
    try {
      if (editingField) {
        await customFieldApi.update(editingField._id, fieldData);
        toast.success('Custom field updated successfully');
      } else {
        await customFieldApi.create(fieldData);
        toast.success('Custom field created successfully');
      }
      setShowModal(false);
      setEditingField(null);
      fetchFields();
    } catch (error) {
      console.error('Error saving custom field:', error);
      toast.error('Failed to save custom field');
    }
  };

  const handleDeleteField = async (id) => {
    if (!window.confirm('Delete this field? Data in this field will be lost.')) return;
    
    try {
      await customFieldApi.delete(id);
      toast.success('Custom field deleted');
      fetchFields();
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast.error('Failed to delete custom field');
    }
  };

  const getFieldTypeIcon = (type) => {
    const icons = {
      text: Type,
      textarea: Type,
      number: Hash,
      email: Mail,
      phone: Phone,
      date: Calendar,
      datetime: Calendar,
      checkbox: CheckSquare,
      dropdown: List,
      multi_select: List,
      currency: DollarSign,
      file: File,
      image: Image,
      user: Users
    };
    return icons[type] || Type;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Custom Fields Manager
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Add custom fields to any entity to capture industry-specific data
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#1E293B] text-white' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
          >
            <option value="client">Clients</option>
            <option value="deal">Deals</option>
            <option value="sale">Sales</option>
            <option value="product">Products</option>
            <option value="contact">Contacts</option>
            <option value="meeting">Meetings</option>
          </select>
          <button
            onClick={() => {
              setEditingField(null);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-[#D89A00] hover:bg-[#B87900] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Field</span>
          </button>
        </div>
      </div>

      {/* Fields List */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Custom Fields for {selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1)}s ({fields.length})
          </h2>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-12">
            <Sliders className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No Custom Fields Yet
            </h3>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Add custom fields to capture industry-specific information
            </p>
            <button
              onClick={() => {
                setEditingField(null);
                setShowModal(true);
              }}
              className="px-6 py-3 bg-[#D89A00] text-white rounded-lg hover:bg-[#B87900] transition"
            >
              Add First Field
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.sort((a, b) => (a.ui?.order || 999) - (b.ui?.order || 999)).map(field => {
              const Icon = getFieldTypeIcon(field.fieldType);
              return (
                <div
                  key={field._id}
                  className={`p-4 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-gray-50'} flex items-center justify-between`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${PROFESSIONAL_COLORS.primary.main}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: PROFESSIONAL_COLORS.primary.main }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {field.fieldLabel}
                        </h3>
                        {field.validation?.required && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">
                            Required
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
                          {field.fieldType?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          Field Name: {field.fieldName}
                        </span>
                        {field.ui?.helpText && (
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            {field.ui.helpText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingField(field);
                        setShowModal(true);
                      }}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field._id)}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CustomFieldModal
          field={editingField}
          entityType={selectedEntity}
          isDark={isDark}
          onSave={handleSaveField}
          onClose={() => {
            setShowModal(false);
            setEditingField(null);
          }}
        />
      )}
    </div>
  );
};


// Custom Field Modal
const CustomFieldModal = ({ field, entityType, isDark, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    entityType: field?.entityType || entityType,
    fieldName: field?.fieldName || '',
    fieldLabel: field?.fieldLabel || '',
    fieldType: field?.fieldType || 'text',
    options: field?.options || [],
    validation: {
      required: field?.validation?.required || false,
      minLength: field?.validation?.minLength || '',
      maxLength: field?.validation?.maxLength || ''
    },
    ui: {
      placeholder: field?.ui?.placeholder || '',
      helpText: field?.ui?.helpText || '',
      width: field?.ui?.width || 'full'
    }
  });

  const [newOption, setNewOption] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    setFormData({
      ...formData,
      options: [...formData.options, { label: newOption, value: newOption.toLowerCase().replace(/\s+/g, '_') }]
    });
    setNewOption('');
  };

  const removeOption = (index) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`rounded-xl p-6 max-w-2xl w-full my-8 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {field ? 'Edit Custom Field' : 'New Custom Field'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Field Label *
                </label>
                <input
                  type="text"
                  value={formData.fieldLabel}
                  onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  placeholder="e.g., Policy Number"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Field Name *
                </label>
                <input
                  type="text"
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  placeholder="e.g., policy_number"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Field Type *
                </label>
                <select
                  value={formData.fieldType}
                  onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  required
                >
                  <option value="text">Text</option>
                  <option value="textarea">Text Area</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="url">URL</option>
                  <option value="date">Date</option>
                  <option value="datetime">Date & Time</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="multi_select">Multi Select</option>
                  <option value="currency">Currency</option>
                  <option value="percentage">Percentage</option>
                  <option value="file">File Upload</option>
                  <option value="image">Image Upload</option>
                </select>
              </div>
            </div>
          </div>

          {/* Options for dropdown/multi-select */}
          {(formData.fieldType === 'dropdown' || formData.fieldType === 'multi_select' || formData.fieldType === 'radio') && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Options
              </h3>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  placeholder="Add option..."
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-4 py-2 bg-[#D89A00] text-white rounded-lg hover:bg-[#B87900]"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formData.options.map((opt, index) => (
                  <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-[#334155]' : 'bg-gray-100'}`}>
                    <span>{opt.label}</span>
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Validation
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.validation.required}
                  onChange={(e) => setFormData({
                    ...formData,
                    validation: { ...formData.validation, required: e.target.checked }
                  })}
                  className="mr-2"
                />
                <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Required field
                </label>
              </div>

              {(formData.fieldType === 'text' || formData.fieldType === 'textarea') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Min Length
                    </label>
                    <input
                      type="number"
                      value={formData.validation.minLength}
                      onChange={(e) => setFormData({
                        ...formData,
                        validation: { ...formData.validation, minLength: e.target.value }
                      })}
                      className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Max Length
                    </label>
                    <input
                      type="number"
                      value={formData.validation.maxLength}
                      onChange={(e) => setFormData({
                        ...formData,
                        validation: { ...formData.validation, maxLength: e.target.value }
                      })}
                      className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* UI Settings */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              UI Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={formData.ui.placeholder}
                  onChange={(e) => setFormData({
                    ...formData,
                    ui: { ...formData.ui, placeholder: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>

              <div className="col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Help Text
                </label>
                <input
                  type="text"
                  value={formData.ui.helpText}
                  onChange={(e) => setFormData({
                    ...formData,
                    ui: { ...formData.ui, helpText: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Field Width
                </label>
                <select
                  value={formData.ui.width}
                  onChange={(e) => setFormData({
                    ...formData,
                    ui: { ...formData.ui, width: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                >
                  <option value="full">Full Width</option>
                  <option value="half">Half Width</option>
                  <option value="third">Third Width</option>
                  <option value="quarter">Quarter Width</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#D89A00] text-white rounded-lg hover:bg-[#B87900]"
            >
              Save Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomFields;
