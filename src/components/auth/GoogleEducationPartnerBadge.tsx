import React from 'react';

export const GoogleEducationPartnerBadge: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'sidebar' | 'footer';
}> = ({ className = '', size = 'md' }) => {
  const heightClass =
    size === 'sm' || size === 'footer'
      ? 'h-14 md:h-16'
      : size === 'sidebar'
      ? 'h-[88px] md:h-[96px]'
      : size === 'lg'
      ? 'h-24 md:h-28'
      : 'h-[72px] md:h-[80px]';

  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <img
        src="https://images.seeklogo.com/logo-png/42/1/google-partner-logo-png_seeklogo-428155.png"
        alt="Google Partner"
        className={`${heightClass} w-auto object-contain select-none transition-transform hover:scale-105 duration-200`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};


