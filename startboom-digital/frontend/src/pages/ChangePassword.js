import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const inputCls = 'w-full p-3 border border-gray-300 rounded-xl mt-1 bg-white dark:bg-[#1E293B] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const ChangePassword = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.changePassword({
        email: form.email,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      toast.success(response.data.message || 'Password updated');
      updateUser({ isFirstLogin: false });
      navigate(user?.role === 'admin' ? '/admin' : '/agent', { replace: true });
    } catch (error) {
      console.error('Change password error', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F172A] p-4">
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-md p-8 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Set Your Password</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Use the OTP provided to set a new password. OTPs expire in 12 hours.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input type="email" name="email" value={form.email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">OTP / Current Password</label>
            <div className="relative">
              <input name="currentPassword" type={showOtp ? 'text' : 'password'} value={form.currentPassword} onChange={handleChange} className={`${inputCls} pr-10`} placeholder="Enter your OTP" />
              <button type="button" onClick={() => setShowOtp(p => !p)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                {showOtp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <div className="relative">
              <input name="newPassword" type={showNew ? 'text' : 'password'} value={form.newPassword} onChange={handleChange} className={`${inputCls} pr-10`} placeholder="Enter new password" />
              <button type="button" onClick={() => setShowNew(p => !p)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
            <div className="relative">
              <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} className={`${inputCls} pr-10`} placeholder="Re-enter new password" />
              <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
