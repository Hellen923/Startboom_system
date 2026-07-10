import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import potLogo from '../assets/pot logo.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email.trim().toLowerCase(), formData.password);

      if (result.success) {
        toast.success(`Welcome back, ${result.user.name}! 🎉`);

        // Check if user needs to change password (first login)
        if (result.requiresPasswordChange || result.user.isFirstLogin) {
          navigate('/change-password', { replace: true });
        } else {
          // Navigate based on user role
          const roleRedirects = {
            superadmin: '/superadmin',
            admin: '/admin',
            agent: '/agent'
          };
          const redirectPath = roleRedirects[result.user.role] || '/agent';
          navigate(redirectPath, { replace: true });
        }
      } else {
        toast.error(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-[#FFFDF7]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm lg:max-w-md"
        >
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-4 mb-8">
              <div className="w-16 h-16 flex items-center justify-center">
                <img src={potLogo} alt="HoneyPot Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#2D2A26]">HoneyPot</h1>
                <p className="text-sm text-[#D99A00] font-medium">CRM & Sales Platform</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-[#2D2A26] mb-2">
              Welcome back
            </h2>
            <p className="text-[#6B6B6B] mb-8">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2D2A26] mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-[#E8E3D5] bg-white text-[#2D2A26] rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D99A00] focus:border-[#D99A00] transition-colors duration-200"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-[#2D2A26]">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-[#D99A00] hover:text-[#B7791F] font-medium"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-[#E8E3D5] bg-white text-[#2D2A26] rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D99A00] focus:border-[#D99A00] transition-colors duration-200"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D99A00] to-[#B7791F] text-white py-3 px-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#D99A00] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign in</span>
              )}
            </motion.button>
          </form>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#6B6B6B]">
              Need help?{' '}
              <a href="mailto:support@honeypot.com" className="text-[#D99A00] hover:text-[#B7791F] font-medium">
                Contact support
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#D99A00] via-[#B7791F] to-[#2D2A26]">
        <div className="flex-1 flex items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center text-white"
          >
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <img src={potLogo} alt="HoneyPot Logo" className="w-full h-full object-contain opacity-90" />
              </div>
              <h3 className="text-4xl font-bold mb-4">HoneyPot</h3>
              <p className="text-white/90 text-lg max-w-md mx-auto">
                Streamline your sales process, manage clients efficiently, and boost your team's performance with our powerful sales management solution.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mt-12 max-w-xs mx-auto">
              <div className="flex items-center justify-start space-x-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-white font-semibold text-lg">Product Management</span>
              </div>
              <div className="flex items-center justify-start space-x-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-white font-semibold text-lg">Territory Mapping</span>
              </div>
              <div className="flex items-center justify-start space-x-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-white font-semibold text-lg">Team Performance</span>
              </div>
              <div className="flex items-center justify-start space-x-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-white font-semibold text-lg">Sales Analytics</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
