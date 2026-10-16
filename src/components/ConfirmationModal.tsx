import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  targetResource?: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  targetResource,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#E2E6DF] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-modal-pop">
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
              isDestructive ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-amber-50 text-amber-500 border border-amber-100'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>
          <button
            onClick={onCancel}
            aria-label={t('common.cancel') || 'Cancelar'}
            className="w-8 h-8 rounded-full bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#5E605D] hover:text-[#0E0F0C] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-[#0E0F0C] font-['Outfit'] tracking-tight">{title}</h3>
          <p className="text-xs text-[#5E605D] leading-relaxed">{message}</p>
          {targetResource && (
            <div className="p-2.5 bg-[#F4F5F0] rounded-xl border border-[#E2E6DF] text-xs font-mono font-bold text-[#0E0F0C] truncate">
              {targetResource}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#E2E6DF] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#5E605D] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
          >
            {cancelLabel || t('common.cancel') || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer btn-press active:scale-95 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#00c868] hover:bg-[#00b35c] text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
