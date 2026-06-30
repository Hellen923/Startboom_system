import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Mail, Camera, Lock, Moon, Sun, Upload, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ACCENT_PRESETS } from '../context/ThemeContext';
import { authAPI, usersAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { theme, updateTheme, setAccentPreset } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload photo
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      // Log the upload attempt for debugging
      const API_URL = process.env.REACT_APP_API_URL || 'https://crm-dbs.onrender.com/api';
      console.log('Uploading photo to:', `${API_URL}/upload`);
      console.log('File details:', { name: file.name, type: file.type, size: file.size });
      
      // Upload file first
      const uploadResponse = await uploadAPI.uploadFile(file);
      
      if (!uploadResponse || !uploadResponse.data) {
        throw new Error('Invalid response from upload server');
      }
      
      const photoUrl = uploadResponse.data.url || uploadResponse.data.path || uploadResponse.data;
      
      if (!photoUrl) {
        throw new Error('No photo URL returned from server');
      }
      
      console.log('Photo uploaded successfully, URL:', photoUrl);
      
      // Update user profile with the photo URL
      await usersAPI.update(user._id || user.id, { 
        profileImage: photoUrl 
      });
      
      // Refresh user data from backend to ensure consistency
      try {
        const meResponse = await authAPI.getMe();
        const updatedUserData = meResponse.data;
        updateUser(updatedUserData);
      } catch (refreshError) {
        console.warn('Failed to refresh user data, using local update:', refreshError);
        // If refresh fails, still update with the photo URL
        updateUser({ 
          ...user, 
          profileImage: photoUrl,
          photo: photoUrl // Also set photo for backward compatibility
        });
      }
      
      // Clear preview since we've saved it
      setPhotoPreview(null);
      
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      
      // Provide detailed error messages
      let errorMessage = 'Failed to upload photo';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          errorMessage = 'Upload endpoint not found. Please check if the backend server is running and the API URL is correct.';
          console.error('404 Error - Check API URL:', process.env.REACT_APP_API_URL || 'https://crm-dbs.onrender.com/api');
        } else if (status === 401 || status === 403) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 400) {
          errorMessage = data?.message || 'Invalid file. Please check file type and size.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data?.message || `Upload failed (${status})`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your internet connection and ensure the backend server is running.';
        console.error('Network error - No response received:', error.message);
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      toast.error(errorMessage);
      
      // Reset preview on error
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleThemeToggle = () => {
    const newMode = theme.mode === 'light' ? 'dark' : 'light';
    updateTheme({ mode: newMode });
    toast.success(`Theme changed to ${newMode} mode`);
  };

  const handleChangePassword = () => {
    onClose();
    navigate('/change-password');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-4 border-primary-500">
                {photoPreview || user?.profileImage || user?.photo ? (
                  <img
                    src={photoPreview || user.profileImage || user.photo}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <User className="w-16 h-16 text-primary-500" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 transition-colors shadow-lg"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <div className="text-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                >
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
              </button>
              <p className="text-xs text-gray-500 mt-1">Note: Photos are temporary in production</p>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <User className="w-5 h-5 text-primary-500" />
                <label className="text-sm font-medium text-gray-700">Username</label>
              </div>
              <p className="text-gray-900 font-semibold">{user?.name || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Mail className="w-5 h-5 text-primary-500" />
                <label className="text-sm font-medium text-gray-700">Email</label>
              </div>
              <p className="text-gray-900 font-semibold">{user?.email || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <User className="w-5 h-5 text-primary-500" />
                <label className="text-sm font-medium text-gray-700">Role</label>
              </div>
              <p className="text-gray-900 font-semibold capitalize">{user?.role || 'N/A'}</p>
            </div>
          </div>

          {/* Settings Section */}
          <div className="border-t pt-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>

            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {theme.mode === 'light' ? (
                  <Sun className="w-5 h-5 text-primary-500" />
                ) : (
                  <Moon className="w-5 h-5 text-primary-500" />
                )}
                <span className="font-medium text-gray-900">Theme</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 capitalize">{theme.mode}</span>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  theme.mode === 'dark' ? 'bg-primary-500' : 'bg-gray-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    theme.mode === 'dark' ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </button>

            {/* Workspace accent color */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Palette className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-gray-900">Workspace accent</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">Pick a color for buttons, highlights, and accents. Works with light or dark mode.</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAccentPreset(preset.id)}
                    title={preset.label}
                    className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                      theme.accentPreset === preset.id ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-white shadow'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    aria-label={preset.label}
                  />
                ))}
              </div>
            </div>

            {/* Change Password */}
            <button
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-gray-900">Change Password</span>
              </div>
              <span className="text-sm text-gray-600">→</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;







