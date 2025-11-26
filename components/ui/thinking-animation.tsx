import React from "react";

const ThinkingAnimation = () => {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-2xl text-gray-800 text-[12px]">
        <div className="flex items-center gap-1">
          <span 
            className="text-gray-600"
            style={{ animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: '0s' }}
          >
            Thinking
          </span>
          <span 
            className="text-gray-600"
            style={{ animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: '0.2s' }}
          >
            .
          </span>
          <span 
            className="text-gray-600"
            style={{ animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: '0.4s' }}
          >
            .
          </span>
          <span 
            className="text-gray-600"
            style={{ animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: '0.6s' }}
          >
            .
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default ThinkingAnimation;