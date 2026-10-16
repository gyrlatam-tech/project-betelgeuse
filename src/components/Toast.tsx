import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start justify-between gap-3 animate-modal-pop bg-white relative overflow-hidden group transition-all duration-200 ${
        toast.type === 'SUCCESS'
          ? 'border-[#9FE870]/70 text-[#0E0F0C] shadow-[#9FE870]/10'
          : toast.type === 'ERROR'
          ? 'border-rose-200 text-[#0E0F0C] shadow-rose-500/10'
          : 'border-[#E2E6DF] text-[#0E0F0C]'
      }`}
    >
      {/* Auto-dismiss subtle progress countdown bar */}
      <div
        className={`absolute bottom-0 left-0 h-1 animate-toast-progress ${
          toast.type === 'SUCCESS'
            ? 'bg-[#00c868]'
            : toast.type === 'ERROR'
            ? 'bg-rose-500'
            : 'bg-[#163300]'
        }`}
      />

      <div className="flex items-start gap-3">
        {toast.type === 'SUCCESS' && (
          <div className="w-7 h-7 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0 border border-[#9FE870]/50 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#163300] stroke-[2.5]" />
          </div>
        )}
        {toast.type === 'ERROR' && (
          <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
        )}
        {toast.type === 'INFO' && (
          <div className="w-7 h-7 rounded-full bg-[#F4F5F0] text-[#163300] flex items-center justify-center shrink-0 border border-[#E2E6DF] shadow-2xs">
            <Info className="w-4 h-4 stroke-[2.5]" />
          </div>
        )}

        <div className="space-y-0.5 text-xs">
          <p className="font-bold text-[#0E0F0C] font-['Outfit'] text-sm tracking-tight">{toast.title}</p>
          {toast.description && <p className="text-[#5E605D] text-xs leading-relaxed">{toast.description}</p>}
        </div>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="w-6 h-6 rounded-full hover:bg-[#F4F5F0] text-[#868685] hover:text-[#0E0F0C] flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
        aria-label="Fechar notificação"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
