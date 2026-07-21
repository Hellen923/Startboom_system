import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Mail, Camera, Lock, Moon, Sun, Upload, Palette, Building, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ACCENT_PRESETS } from '../context/ThemeContext';
import { authAPI, usersAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';
import dm from '../utils/darkModeClasses';

const ProfileModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { theme, updateTheme, setAccentPreset } = useTheme();
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be less than 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    try {
      setUploading(true);
      const uploadResponse = await uploadAPI.uploadFile(file);
      if (!uploadResponse?.data) throw new Error('Invalid response from upload server');
      const photoUrl = uploadResponse.data.url || uploadResponse.data.path || uploadResponse.data;
      if (!photoUrl) throw new Error('No photo URL returned from server');
      await usersAPI.update(user._id || user.id, { profileImage: photoUrl });
      try {
        const meResponse = await authAPI.getMe();
        updateUser(meResponse.data);
      } catch {
        updateUser({ ...user, profileImage: photoUrl, photo: photoUrl });
      }
      setPhotoPreview(null);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      let msg = 'Failed to upload photo';
      if (error.response?.status === 404) msg = 'Upload endpoint not found.';
      else if (error.response?.status === 401) msg = 'Authentication failed. Please log in again.';
      else if (error.response?.data?.message) msg = error.response.data.message;
      toast.error(msg);
      setPhotoPreview(null);
    } finally { setUploading(false); }
  };

  const handleThemeToggle = () => {
    const newMode = theme.mode === 'light' ? 'dark' : 'light';
    updateTheme({ mode: newMode });
    toast.success(`Theme changed to ${newMode} mode`);
  };

  const handleChangePassword = () => { onClose(); navigate('/change-password'); };

  const fieldCls = `${dm.input} p-4`;
  const labelCls = `text-sm font-medium ${dm.textSecondary}`;
  const valueCls = `${dm.textPrimary} font-semibold mt-1`;
  const rowCls = "flex items-center space-x-3 mb-2";

  return (
    <div className={dm.modalOverlay}>
      <div className={`${dm.modalPanel} max-w-md`}>
        <div className={`${dm.modalHeader} sticky top-0 z-10`}>
          <h2 className="text-2xl font-bold">Profile</h2>
          <button type="button" onClick={onClose} className="p-2 hover:opacity-80 rounded-lg transition-opacity"><X className="w-5 h-5" /></button>
        </div>

        <div className={`${dm.modalBody} space-y-6`}>
          {/* Photo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden border-4 border-primary-500">
                {photoPreview || user?.profileImage || user?.photo ? (
                  <img src={photoPreview || user.profileImage || user.photo} alt={user?.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <User className="w-16 h-16 text-primary-500" />
                )}
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="absolute bottom-0 right-0 btn-brand p-2 rounded-full shadow-lg">
                {uploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </div>
            <div className="text-center">
              <button onClick={() => fileInputRef.current?.click()} className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center space-x-1">
                <Upload className="w-4 h-4" /><span>Upload Photo</span>
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Note: Photos are temporary in production</p>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-3">
            <div className={fieldCls}>
              <div className={rowCls}><User className="w-5 h-5 text-primary-500" /><label className={labelCls}>Username</label></div>
              <p className={valueCls}>{user?.name || 'N/A'}</p>
            </div>
            <div className={fieldCls}>
              <div className={rowCls}><Mail className="w-5 h-5 text-primary-500" /><label className={labelCls}>Email</label></div>
              <p className={valueCls}>{user?.email || 'N/A'}</p>
            </div>
            <div className={fieldCls}>
              <div className={rowCls}><User className="w-5 h-5 text-primary-500" /><label className={labelCls}>Role</label></div>
              <p className={`${valueCls} capitalize`}>{user?.role || 'N/A'}</p>
            </div>
            {user?.role === 'agent' && (
              <>
                <div className={fieldCls}>
                  <div className={rowCls}><Building className="w-5 h-5 text-primary-500" /><label className={labelCls}>Department</label></div>
                  <p className={valueCls}>{user?.department?.name || 'Not assigned'}</p>
                </div>
                {user?.team?.name && (
                  <div className={fieldCls}>
                    <div className={rowCls}><UsersIcon className="w-5 h-5 text-primary-500" /><label className={labelCls}>Team</label></div>
                    <p className={valueCls}>{user.team.name}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Settings */}
          <div className={`border-t pt-6 space-y-3 ${dm.border}`}>
            <h3 className={`text-lg font-semibold mb-4 ${dm.textPrimary}`}>Settings</h3>

            <button onClick={handleThemeToggle}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-[var(--color-bg-hover)] ${dm.border} bg-[var(--color-bg-input-subtle)]`}>
              <div className="flex items-center space-x-3">
                {theme.mode === 'light' ? <Sun className="w-5 h-5 text-[var(--primary-color)]" /> : <Moon className="w-5 h-5 text-[var(--primary-color)]" />}
                <span className={`font-medium ${dm.textPrimary}`}>Theme</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm capitalize ${dm.textMuted}`}>{theme.mode}</span>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${theme.mode === 'dark' ? 'bg-[var(--primary-color)]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${theme.mode === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            </button>

            <div className={`p-4 rounded-lg border ${dm.border} bg-[var(--color-bg-input-subtle)]`}>
              <div className="flex items-center gap-3 mb-3">
                <Palette className="w-5 h-5 text-[var(--primary-color)]" />
                <span className={`font-medium ${dm.textPrimary}`}>Workspace accent</span>
              </div>
              <p className={`text-xs mb-3 ${dm.textMuted}`}>Pick a color for buttons, highlights, and accents.</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" onClick={() => setAccentPreset(preset.id)} title={preset.label}
                    className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${theme.accentPreset === preset.id ? 'border-gray-900 dark:border-gray-100 ring-2 ring-offset-2 ring-gray-400' : 'border-white shadow'}`}
                    style={{ backgroundColor: preset.color }} aria-label={preset.label} />
                ))}
              </div>
            </div>

            <button onClick={handleChangePassword}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-[var(--color-bg-hover)] ${dm.border} bg-[var(--color-bg-input-subtle)]`}>
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-[var(--primary-color)]" />
                <span className={`font-medium ${dm.textPrimary}`}>Change Password</span>
              </div>
              <span className={`text-sm ${dm.textMuted}`}>→</span>
            </button>
          </div>
        </div>

        <div className={`${dm.modalFooter} sticky bottom-0`}>
          <button type="button" onClick={onClose} className={`w-full ${dm.btnBrand} py-3`}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
