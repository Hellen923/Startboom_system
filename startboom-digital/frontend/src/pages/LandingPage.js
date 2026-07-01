import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, BarChart3, Calendar, ShoppingCart, TrendingUp, Shield, ArrowRight,
  CheckCircle, Star, Zap, Target, DollarSign, LineChart
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Client Management',
      description: 'Organize contacts, track interactions, and never miss a follow-up'
    },
    {
      icon: ShoppingCart,
      title: 'Product Catalogue',
      description: 'Manage inventory with real-time stock tracking and auto-deduction'
    },
    {
      icon: TrendingUp,
      title: 'Sales Pipeline',
      description: 'Visual deal tracking from lead to close with win/loss analytics'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Performance dashboards, leaderboards, and target tracking'
    },
    {
      icon: Target,
      title: 'Commission Tracking',
      description: 'Automated commission calculation and agent performance rewards'
    },
    {
      icon: Shield,
      title: 'Multi-Tenant Security',
      description: 'Enterprise-grade security with role-based access control'
    }
  ];

  const stats = [
    { value: '50+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' }
  ];

  const benefits = [
    'Complete sales pipeline from lead to close',
    'Stock management with auto-deduction',
    'Receipt generation for every sale',
    'Agent leaderboards and targets',
    'Mobile Money integration (MTN, Airtel)',
    'Territory management with GPS'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 lg:px-12 overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl"
        />

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left - Content */}
            <div>
              {/* Logo above headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-8"
              >
                <img src="/Swavelink.png" alt="Swavelink" className="h-16 w-16 object-contain" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Swavelink</h1>
                  <p className="text-sm text-primary-400">Sales Management System</p>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              >
                Grow Your Sales,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-yellow-300">
                  Track Everything
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-xl text-gray-300 mb-8 leading-relaxed"
              >
                Complete sales management system built for small businesses in Uganda. 
                Manage leads, track inventory, record sales, and grow your team.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  className="group px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-primary-600/50 transition-all"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            </div>

            {/* Right - Feature Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary-600/20 rounded-3xl blur-3xl" />
              
              <div className="relative grid grid-cols-2 gap-4">
                {features.slice(0, 4).map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all group"
                  >
                    <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600/30 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 lg:px-12 border-y border-white/10 backdrop-blur-sm bg-white/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-primary-400 mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 px-6 lg:px-12">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-yellow-300"> Manage Sales</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From lead generation to commission tracking, we've got you covered
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-primary-600/50 transition-all group"
              >
                <div className="w-14 h-14 bg-primary-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-600/30 group-hover:scale-110 transition-all">
                  <feature.icon className="w-7 h-7 text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 lg:px-12 bg-gradient-to-br from-primary-600/10 to-transparent">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Why Choose Swavelink?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Built specifically for Ugandan businesses with local payment methods, 
                real-time stock tracking, and complete sales automation.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary-600/30 rounded-3xl blur-3xl" />
              <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-white mb-1">1,000+</div>
                      <div className="text-gray-400">Sales Recorded</div>
                    </div>
                    <LineChart className="w-12 h-12 text-primary-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-white mb-1">50+</div>
                      <div className="text-gray-400">Active Agents</div>
                    </div>
                    <Users className="w-12 h-12 text-blue-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-white mb-1">UGX 50M+</div>
                      <div className="text-gray-400">Revenue Tracked</div>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-12">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative backdrop-blur-xl bg-gradient-to-r from-primary-600/20 to-blue-600/20 border border-white/20 rounded-3xl p-12 lg:p-16 text-center overflow-hidden"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 right-0 w-64 h-64 bg-primary-600/30 rounded-full blur-3xl"
            />
            
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to Grow Your Business?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join businesses across Uganda using Swavelink to manage their sales, 
                track inventory, and grow their revenue.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="group px-10 py-5 bg-primary-600 hover:bg-primary-700 text-white text-lg rounded-xl font-bold flex items-center gap-3 mx-auto shadow-2xl shadow-primary-600/50 transition-all"
              >
                Get Started
                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/Swavelink.png" alt="Swavelink" className="h-8 w-8 object-contain" />
              <div>
                <div className="text-white font-bold">Swavelink</div>
                <div className="text-sm text-gray-400">Sales Management System</div>
              </div>
            </div>
            
            <div className="text-gray-400 text-sm text-center md:text-right">
              © 2026 Swavelink. All rights reserved.
              <br />
              Built with ❤️ in Uganda
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
