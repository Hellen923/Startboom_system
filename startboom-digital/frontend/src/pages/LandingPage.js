import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, BarChart3, Calendar, MessageSquare, TrendingUp, Shield, ArrowRight
} from 'lucide-react';
import logo from '../assets/logo.png';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Client Management',
      description: 'Organize all your clients in one centralized platform',
      iconSize: 'w-10 h-10'
    },
    {
      icon: BarChart3,
      title: 'Sales Analytics',
      description: 'Track performance with real-time insights and reporting',
      iconSize: 'w-9 h-9'
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Never miss important meetings with intelligent reminders',
      iconSize: 'w-10 h-10'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Integration',
      description: 'Connect with clients instantly through integrated messaging',
      iconSize: 'w-9 h-9'
    },
    {
      icon: TrendingUp,
      title: 'Deal Pipeline',
      description: 'Manage your sales pipeline with visual tracking',
      iconSize: 'w-11 h-11'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security for your business data',
      iconSize: 'w-10 h-10'
    }
  ];

  // Quadruple for seamless infinite loop
  const carouselFeatures = [...features, ...features, ...features, ...features];

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Cinematic Volumetric Light Rays and Plasma Energy */}
      <div className="absolute inset-0">
        {/* Pure black base */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Dramatic volumetric light beams from top-right */}
        <div className="absolute inset-0">
          {/* Main volumetric light ray */}
          <motion.div
            animate={{
              opacity: [0.5, 0.7, 0.5],
              scale: [1, 1.15, 1],
              rotate: [-3, 2, -3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 -right-1/4 w-[2200px] h-[2200px]"
            style={{
              background: 'conic-gradient(from 225deg at 85% 15%, rgba(249, 115, 22, 0.6) 0deg, rgba(234, 88, 12, 0.5) 40deg, rgba(194, 65, 12, 0.35) 80deg, transparent 160deg)',
              filter: 'blur(90px)',
              transformOrigin: '85% 15%',
            }}
          />

          {/* Secondary plasma stream */}
          <motion.div
            animate={{
              opacity: [0.4, 0.6, 0.4],
              x: [0, 120, 0],
              rotate: [0, 8, 0],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 right-0 w-[1800px] h-[1400px]"
            style={{
              background: 'radial-gradient(ellipse at top right, rgba(251, 146, 60, 0.5) 0%, rgba(249, 115, 22, 0.35) 25%, rgba(234, 88, 12, 0.2) 45%, transparent 65%)',
              filter: 'blur(100px)',
              transform: 'rotate(-30deg)',
            }}
          />

          {/* Energy wave diagonal sweep */}
          <motion.div
            animate={{
              opacity: [0.35, 0.55, 0.35],
              scale: [1, 1.2, 1],
              rotate: [-5, 5, -5],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-1/4 w-[1600px] h-[1600px]"
            style={{
              background: 'radial-gradient(circle, rgba(249, 115, 22, 0.45) 0%, rgba(234, 88, 12, 0.25) 35%, transparent 60%)',
              filter: 'blur(110px)',
            }}
          />
        </div>

        {/* Floating ember sparks - animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(35)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [typeof window !== 'undefined' ? Math.random() * window.innerHeight : 800, -120],
                x: [0, (Math.random() - 0.5) * 250],
                opacity: [0, 0.9, 0.9, 0],
                scale: [0, 1.2, 1, 0],
              }}
              transition={{
                duration: 10 + Math.random() * 12,
                repeat: Infinity,
                delay: Math.random() * 6,
                ease: "linear",
              }}
              className="absolute rounded-full"
              style={{
                left: `${30 + Math.random() * 60}%`,
                top: `${100 + Math.random() * 25}%`,
                width: `${2 + Math.random() * 5}px`,
                height: `${2 + Math.random() * 5}px`,
                background: `rgba(249, 115, 22, ${0.7 + Math.random() * 0.3})`,
                boxShadow: '0 0 12px rgba(249, 115, 22, 1), 0 0 24px rgba(234, 88, 12, 0.6)',
                filter: 'blur(0.8px)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative min-h-screen flex items-center">
        <div className="w-full px-8 md:px-16 lg:px-24 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
            
            {/* LEFT SIDE - Branding & Content */}
            <div className="flex-1 max-w-2xl z-10">
              {/* Logo Badge - Matching Reference */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center mb-12 px-5 py-3 rounded-2xl border border-orange-900/30"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-lg mr-3"
                >
                  <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
                </motion.div>
                <div>
                  <h1 className="text-base font-bold text-white leading-tight">Startboom Digital</h1>
                  <p className="text-xs text-primary-400/80 font-normal">Sales Management</p>
                </div>
              </motion.div>

              {/* Headline - Matching Reference Style */}
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 leading-[1.05] tracking-tight"
              >
                Grow Your Business
              </motion.h2>
              <motion.h3
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.05] tracking-tight"
                style={{
                  background: 'linear-gradient(to right, #E6C200, #FFD700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Smarter & Faster
              </motion.h3>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="text-xl text-gray-400 mb-10 leading-relaxed"
              >
                The simple CRM built for small businesses
              </motion.p>

              {/* CTA Button - White with Orange Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="space-y-5"
              >
                <motion.button
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="group px-10 py-4 bg-white text-primary-700 rounded-xl text-base font-bold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                {/* Trust Indicator */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-gray-500 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Manage leads, clients, and sales in one place
                </motion.p>
              </motion.div>
            </div>

            {/* RIGHT SIDE - Cards with Orange Glow Borders */}
            <div className="flex-1 relative w-full lg:w-auto min-h-[600px]">
              {/* Ambient orange glow behind cards */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-[120%] h-[80%]"
                  style={{
                    background: 'radial-gradient(ellipse, rgba(234, 88, 12, 0.25) 0%, transparent 60%)',
                    filter: 'blur(80px)',
                  }}
                />
              </div>

              {/* Floating Cards Track */}
              <div className="absolute inset-0 flex items-center">
                <div className="relative w-full h-full flex items-center overflow-hidden">
                  {/* Infinite Scroll */}
                  <motion.div
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{
                      duration: 40,
                      repeat: Infinity,
                      ease: "linear",
                      repeatType: "loop"
                    }}
                    className="flex gap-6 will-change-transform"
                  >
                    {carouselFeatures.map((feature, index) => (
                      <motion.div
                        key={`feature-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02, duration: 0.5 }}
                        whileHover={{ 
                          scale: 1.05,
                          y: -12,
                          transition: { duration: 0.3 }
                        }}
                        className="relative group flex-shrink-0"
                      >
                        {/* Orange Glowing Border Card */}
                        <div
                          className="relative w-[320px] h-[380px] rounded-3xl overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, rgba(20, 15, 10, 0.9) 0%, rgba(30, 20, 15, 0.8) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1.5px solid rgba(234, 88, 12, 0.4)',
                            boxShadow: `
                              0 0 40px rgba(234, 88, 12, 0.3),
                              0 20px 60px rgba(0, 0, 0, 0.6),
                              inset 0 1px 0 rgba(234, 88, 12, 0.2)
                            `,
                          }}
                        >
                          {/* Inner glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-transparent" />
                          
                          {/* Hover glow intensification */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                              boxShadow: '0 0 60px rgba(234, 88, 12, 0.5), inset 0 0 40px rgba(234, 88, 12, 0.1)',
                            }}
                          />
                          
                          {/* Content */}
                          <div className="relative h-full flex flex-col items-center justify-center p-10 text-center">
                            {/* Icon with Orange Background */}
                            <motion.div
                              whileHover={{ rotate: 360, scale: 1.1 }}
                              transition={{ duration: 0.7 }}
                              className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
                              style={{
                                background: 'rgba(234, 88, 12, 0.15)',
                                border: '1px solid rgba(234, 88, 12, 0.3)',
                                boxShadow: '0 8px 32px rgba(234, 88, 12, 0.2)',
                              }}
                            >
                              <feature.icon className="w-10 h-10 text-primary-500" strokeWidth={1.5} />
                            </motion.div>
                            
                            {/* Title */}
                            <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                              {feature.title}
                            </h3>
                            
                            {/* Description */}
                            <p className="text-gray-400 text-sm leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="backdrop-blur-md bg-white/70 border-t border-white/60 py-6">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-center">
            <p className="text-gray-600 text-sm text-center">
              © 2026 Startboom Digital. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
