import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, Lock } from 'lucide-react';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);

        try {
            // API call to request OTP
            await authAPI.forgotPassword(email);
            // We always show success message to prevent email enumeration (backend logic)
            setEmailSent(true);
            toast.success('Reset code sent to your email!');
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error(error.response?.data?.message || 'Failed to send reset code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
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
                            Forgot Password?
                        </h2>
                        <p className="text-gray-600">
                            {emailSent
                                ? "We've sent a 6-digit code to your email."
                                : "Enter your email address to receive a reset code."}
                        </p>
                    </div>

                    {emailSent ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
                        >
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-green-800 mb-2">Check your email</h3>
                            <p className="text-green-700 mb-6">
                                We have sent a password reset code to <strong>{email}</strong>
                            </p>
                            <div className="space-y-3">
                                <Link
                                    to="/reset-password"
                                    state={{ email }}
                                    className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors shadow-sm"
                                >
                                    Enter Reset Code
                                </Link>
                                <button
                                    onClick={() => setEmailSent(false)}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Try a different email
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        /* Request Form */
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        <span>Sending...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                        <span>Send Reset Code</span>
                                        <Send className="w-4 h-4" />
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
                    <div className="max-w-md">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
                            <Lock className="w-12 h-12 text-white" /> {/* Using Lock icon as placeholder */}
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Secure Account Recovery</h3>
                        <p className="text-orange-100 text-lg">
                            Don't worry, we'll help you get back to your account in a few simple steps.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ForgotPassword;
