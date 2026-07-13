import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import sidebarLogo from '../assets/sidebar.png';
import { BUTTON_STYLES, FORM_STYLES } from '../utils/designSystem';

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
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-[var(--color-bg-page)]">
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
                <img src={sidebarLogo} alt="HoneyPot Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">HoneyPot</h1>
                <p className="text-sm text-[var(--primary-color)] font-medium">CRM & Sales Platform</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
              Welcome back
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className={FORM_STYLES.label}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[var(--color-text-placeholder)]" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`${FORM_STYLES.input} pl-11 pr-4`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className={FORM_STYLES.label}>
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium transition-colors"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[var(--color-text-placeholder)]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`${FORM_STYLES.input} pl-11 pr-12`}
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
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className={`${BUTTON_STYLES.primary} w-full`}
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
            <p className="text-sm text-[#64748B]">
              Need help?{' '}
              <a href="mailto:support@honeypot.com" className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium transition-colors">
                Contact support
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#1F1D1A] via-[#2D2A26] to-[#1F1D1A]">
        <div className="flex-1 flex items-center justify-center p-12 relative">
          {/* Subtle honey accent overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#D99A00]/5"></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center text-white relative z-10"
          >
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <img src={sidebarLogo} alt="HoneyPot Logo" className="w-full h-full object-contain opacity-90" />
              </div>
              <h3 className="text-4xl font-bold mb-4">HoneyPot</h3>
              <p className="text-[#94A3B8] text-lg max-w-md mx-auto">
                Streamline your sales process, manage clients efficiently, and boost your team's performance with our powerful sales management solution.
              </p>
            </div>

              <div className="space-y-4 mt-12 max-w-xs mx-auto">
              {[
                'Product Management',
                'Territory Mapping',
                'Team Performance',
                'Sales Analytics',
              ].map((item) => (
                <div key={item} className="flex items-center gap-4 bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--primary-color)' }}></div>
                  <span className="text-white font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
