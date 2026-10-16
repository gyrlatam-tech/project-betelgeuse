import React from 'react';
import { ShieldCheck } from 'lucide-react';

export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type LoaderVariant = 'fullscreen' | 'overlay' | 'card' | 'inline' | 'wordmark' | 'button';

export interface SkooliaLoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  label?: string;
  sublabel?: string;
  progress?: number;
  showPartnerBadge?: boolean;
  className?: string;
  id?: string;
}

/**
 * Authentic Google Spinning Circle (Google Material Spinner)
 * Features the signature Google brand colors:
 * Blue (#4285F4), Red (#EA4335), Yellow (#FBBC05), Green (#34A853)
 * with the iconic circular stroke morphing animation.
 */
export const GoogleSpinner: React.FC<{
  size?: LoaderSize;
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const pixelSize = {
    xs: 18,
    sm: 24,
    md: 36,
    lg: 48,
    xl: 60,
    '2xl': 72,
  }[size];

  const strokeWidth = size === 'xs' ? 5.5 : size === 'sm' ? 4.8 : 4.2;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      role="status"
      aria-label="Carregando..."
    >
      <svg
        className="w-full h-full animate-google-spin"
        viewBox="0 0 50 50"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#4285F4"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="animate-google-stroke"
        />
      </svg>
    </div>
  );
};

/**
 * Backward compatibility aliases:
 */
export const SkooliaEllipsis = GoogleSpinner;
export const SkooliaTwinOGlyph = GoogleSpinner;

export const SkooliaLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}> = ({ size = 'lg', className = '' }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-4xl sm:text-5xl',
    xl: 'text-5xl sm:text-6xl',
    '2xl': 'text-6xl sm:text-7xl',
  }[size];

  return (
    <span className={`font-black text-[#163300] font-['Outfit'] tracking-tight select-none ${sizeClasses} ${className}`}>
      skoolia
    </span>
  );
};

export const SkooliaAnimatedWordmark = SkooliaLogo;

/**
 * Main SkooliaLoader component with multi-scenario variants:
 * - Fullscreen (Initial load, tenant switch, auth setup, account provisioning)
 * - Modal Overlay (Payment processing, DNS verification, Batch import)
 * - Card / Container (In-table loading, view transition)
 * - Button / Inline (Inside action triggers)
 */
export const SkooliaLoader: React.FC<SkooliaLoaderProps> = ({
  size = 'md',
  variant = 'card',
  label,
  sublabel,
  progress,
  className = '',
  id,
}) => {
  // 1. Button Variant (Minimal, fits nicely inside primary action buttons)
  if (variant === 'button') {
    return (
      <span id={id} className={`inline-flex items-center gap-1.5 font-bold ${className}`}>
        {label && <span className="text-inherit">{label}</span>}
        <GoogleSpinner size="xs" />
      </span>
    );
  }

  // 2. Inline Variant (Compact badge / row loader)
  if (variant === 'inline') {
    return (
      <div id={id} className={`inline-flex items-center gap-2 ${className}`}>
        <GoogleSpinner size={size} />
        {label && <span className="text-xs font-semibold text-slate-700">{label}</span>}
      </div>
    );
  }

  // 3. Standalone Google Spinner Variant
  if (variant === 'wordmark') {
    return (
      <div id={id} className={`flex flex-col items-center justify-center p-4 text-center ${className}`}>
        <GoogleSpinner size={size} />
        {label && (
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-600 font-mono animate-pulse">
            {label}
          </p>
        )}
      </div>
    );
  }

  // 4. Modal Overlay Variant
  if (variant === 'overlay') {
    return (
      <div
        id={id}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn ${className}`}
      >
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-6 animate-modal-pop">
          {/* Animated Google Spinner */}
          <div className="py-2">
            <GoogleSpinner size="lg" />
          </div>

          {/* Titles & Status */}
          {(label || sublabel) && (
            <div className="space-y-2 max-w-xs mx-auto">
              {label && (
                <h3 className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                  {label}
                </h3>
              )}
              {sublabel && (
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {sublabel}
                </p>
              )}
            </div>
          )}

          {/* Optional Linear Progress Bar */}
          {typeof progress === 'number' && (
            <div className="w-full space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono font-bold text-slate-600">
                <span>Progresso</span>
                <span className="text-[#008a46]">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-[#4285F4] via-[#00c868] to-[#34A853] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Security & Footnote */}
          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-100 w-full">
            <ShieldCheck className="w-4 h-4 text-[#00c868]" />
            <span>Sincronização Segura Google Workspace</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Fullscreen Variant (Initial App Boot, Auth Resolution, Workspace Initialization)
  if (variant === 'fullscreen') {
    return (
      <div
        id={id || 'skoolia-fullscreen-loader'}
        className="h-screen w-screen fixed inset-0 z-50 flex items-center justify-center bg-[#F4F5F0] overflow-hidden select-none"
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
          <GoogleSpinner size="xl" />
        </div>
      </div>
    );
  }

  // 6. Card / Box Variant (Default)
  return (
    <div
      id={id}
      className={`p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center space-y-4 ${className}`}
    >
      <GoogleSpinner size={size} />

      {label && (
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">{label}</h4>
          {sublabel && <p className="text-xs text-slate-500 max-w-xs">{sublabel}</p>}
        </div>
      )}

      {typeof progress === 'number' && (
        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-[#4285F4] transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
