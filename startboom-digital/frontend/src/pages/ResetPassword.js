import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Step 1: Verify OTP, Step 2: Set New Password
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // If no email in state, redirect to forgot password
        if (!location.state?.email) {
            toast.error('Please start the reset process from here');
            navigate('/forgot-password');
        }
    }, [location, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handeVerifyOTP = async (e) => {
        e.preventDefault();
        if (!formData.otp) {
            toast.error('Please enter the verification code');
            return;
        }

        setLoading(true);
        try {
            await authAPI.verifyOTP({ email: formData.email, otp: formData.otp });
            toast.success('Code verified! Now set your new password.');
            setStep(2);
        } catch (error) {
            console.error('Verify OTP error:', error);
            toast.error(error.response?.data?.message || 'Invalid or expired code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!formData.newPassword || !formData.confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword({
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });

            toast.success('Password reset successfully! Please login.');
            navigate('/login');
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error(error.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mx-auto w-full max-w-sm lg:max-w-md"
                >
                    {/* Header */}
                    <div className="text-center lg:text-left mb-10">
                        <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>

                        <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-xl flex items-center justify-center">
                                <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {step === 1 ? 'Verify Your Identity' : 'Set New Password'}
                        </h2>
                        <p className="text-gray-600">
                            {step === 1
                                ? <span>Enter the code sent to <strong>{formData.email}</strong></span>
                                : 'Choose a strong password for your account.'}
                        </p>
                    </div>

                    {step === 1 ? (
                        /* STEP 1: OTP FORM */
                        <form className="space-y-6" onSubmit={handeVerifyOTP}>
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Code (OTP)
                                </label>
                                <div className="relative">
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        required
                                        className="block w-full px-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 tracking-widest text-center text-lg font-mono"
                                        placeholder="000000"
                                        maxLength="6"
                                        value={formData.otp}
                                        onChange={handleChange}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                        <span>Verify Code</span>
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                )}
                            </motion.button>
                        </form>
                    ) : (
                        /* STEP 2: PASSWORD FORM */
                        <form className="space-y-6" onSubmit={handleResetPassword}>
                            {/* New Password Field */}
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                                        placeholder="At least 6 characters"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        autoFocus
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

                            {/* Confirm Password Field */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Resetting Password...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                        <span>Reset Password</span>
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                )}
                            </motion.button>
                        </form>
                    )}
                </motion.div>
            </div>

            {/* Right Side - Illustration */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-500 to-orange-600">
                <div className="flex-1 flex items-center justify-center p-12 text-white text-center">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-md"
                    >
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
                            {step === 1 ? <ShieldCheck className="w-12 h-12 text-white" /> : <Lock className="w-12 h-12 text-white" />}
                        </div>
                        <h3 className="text-3xl font-bold mb-4">{step === 1 ? 'Verify Identity' : 'Secure Account'}</h3>
                        <p className="text-orange-100 text-lg">
                            {step === 1 ? 'First, let\'s make sure it\'s really you.' : 'Now, create a new password to protect your data.'}
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
