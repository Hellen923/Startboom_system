import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

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
      // update local user state to reflect isFirstLogin false
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Set Your Password</h2>
        <p className="text-sm text-gray-600 mb-4">Use the OTP provided to set a new password. OTPs expire in 12 hours.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={form.email} disabled className="w-full p-3 border rounded mt-1 bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">OTP / Current Password</label>
            <input name="currentPassword" value={form.currentPassword} onChange={handleChange} className="w-full p-3 border rounded mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} className="w-full p-3 border rounded mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="w-full p-3 border rounded mt-1" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded">
              {loading ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
