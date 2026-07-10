// Success Animation Component - Celebrate user actions
import React, { useEffect, useState } from 'react';
import { CheckCircle, Trophy, Star, Zap, Heart } from 'lucide-react';

const SuccessAnimation = ({ 
  isVisible, 
  onComplete, 
  message = 'Success!',
  variant = 'check', // 'check', 'trophy', 'star', 'zap', 'heart'
  duration = 2000
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        if (onComplete) onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  if (!show) return null;

  const icons = {
    check: CheckCircle,
    trophy: Trophy,
    star: Star,
    zap: Zap,
    heart: Heart
  };

  const colors = {
    check: 'text-green-500',
    trophy: 'text-yellow-500',
    star: 'text-purple-500',
    zap: 'text-blue-500',
    heart: 'text-red-500'
  };

  const Icon = icons[variant] || icons.check;
  const color = colors[variant] || colors.check;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-successBounce">
        <div className="relative">
          {/* Icon */}
          <Icon className={`w-24 h-24 ${color} drop-shadow-2xl animate-successPulse`} strokeWidth={2} />
          
          {/* Confetti particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full animate-confetti"
              style={{
                background: `hsl(${i * 30}, 70%, 60%)`,
                animationDelay: `${i * 0.05}s`,
                transform: `rotate(${i * 30}deg) translate(0, -50px)`
              }}
            />
          ))}
        </div>
        
        {/* Message */}
        <p className="mt-4 text-xl font-bold text-white text-center drop-shadow-lg animate-fadeIn">
          {message}
        </p>
      </div>
    </div>
  );
};

export default SuccessAnimation;
