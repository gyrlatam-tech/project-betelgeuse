import React from 'react';
import { Sparkles, Clock, Ticket, CheckCircle2, ArrowRight, X, Layers, Receipt } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface UpgradeActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  quantity: number;
  protocol: string;
  ticketId: string;
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  onViewTickets: () => void;
}

export const UpgradeActivationModal: React.FC<UpgradeActivationModalProps> = ({
  isOpen,
  onClose,
  serviceName,
  quantity,
  protocol,
  ticketId: _ticketId,
  invoiceNumber,
  amount,
  currency = 'USD',
  onViewTickets,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      id="upgrade-activation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0F0C]/65 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white border border-[#E2E6DF] rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow in header */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#9FE870]/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F7DC] border border-[#9FE870]/80 flex items-center justify-center text-[#163300] shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#163300] text-[#9FE870] text-[10px] font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t('upgradeActivation.paymentApprovedBadge') || 'Pagamento Aprovado'}</span>
              </div>
              <h3 className="text-xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                {t('upgradeActivation.modalTitle') || 'Upgrade Contratado com Sucesso!'}
              </h3>
            </div>
          </div>

          <button
            id="close-upgrade-modal-btn"
            onClick={onClose}
            aria-label={t('common.close') || 'Fechar'}
            className="w-8 h-8 rounded-full bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#5E605D] hover:text-[#0E0F0C] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Service Details Card */}
        <div className="p-4 bg-[#F9FAF8] rounded-2xl border border-[#E2E6DF] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5E605D]">
                {t('upgradeActivation.serviceLabel') || 'Serviço de Upgrade'}
              </span>
              <p className="text-sm font-bold text-[#0E0F0C] leading-snug">
                {serviceName}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-white border border-[#E2E6DF] text-[#163300] font-black text-xs rounded-xl shadow-2xs shrink-0">
              {quantity} {quantity === 1 ? 'unidade' : 'unidades'}
            </span>
          </div>

          {(invoiceNumber || amount !== undefined) && (
            <div className="pt-2.5 border-t border-[#E2E6DF]/80 flex items-center justify-between text-xs text-[#5E605D]">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Receipt className="w-3.5 h-3.5 text-[#163300]" />
                <span>{invoiceNumber || 'Recibo Gerado'}</span>
              </div>
              {amount !== undefined && (
                <span className="font-bold text-[#0E0F0C]">
                  {currency} {amount.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* High-priority Notice: 24h SLA Warning */}
        <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3.5 text-amber-950 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              {t('upgradeActivation.activationNoticeTitle') || 'Prazo de Ativação Técnica: até 24 horas'}
            </p>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {t('upgradeActivation.activationNoticeDesc') ||
                'A ativação é realizada em até 24 horas. Um chamado de suporte prioritário foi registrado para a equipe técnica realizar o provisionamento das licenças e pools no console do Google Workspace.'}
            </p>
          </div>
        </div>

        {/* Support Ticket Opened Notice */}
        <div className="p-4 bg-[#E8F7DC]/40 border border-[#9FE870]/70 rounded-2xl flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#163300] text-[#9FE870] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Ticket className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#163300]">
                {t('upgradeActivation.ticketBadge') || 'Ticket de Suporte Prioritário Aberto'}
              </span>
              <span className="font-mono text-xs font-bold text-[#163300] px-2 py-0.5 bg-white rounded-lg border border-[#9FE870]/60">
                #{protocol}
              </span>
            </div>
            <p className="text-xs text-[#0E0F0C] font-semibold truncate">
              {t('upgradeActivation.ticketSubjectPrefix') || 'Upgrade:'} {serviceName} ({quantity} un.)
            </p>
            <p className="text-[11px] text-[#5E605D] leading-relaxed">
              {t('upgradeActivation.ticketExplanation') ||
                'O chamado foi registrado com prioridade alta no sistema. Você pode acompanhar as atualizações em tempo real na aba de Chamados de Suporte.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[#E2E6DF]">
          <button
            type="button"
            id="dismiss-upgrade-modal-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] rounded-full transition-colors cursor-pointer"
          >
            {t('upgradeActivation.closeBtn') || 'Entendido, fechar'}
          </button>

          <button
            type="button"
            id="view-support-ticket-btn"
            onClick={() => {
              onClose();
              onViewTickets();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#163300] hover:bg-[#1f4700] text-[#9FE870] rounded-full text-xs font-black transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t('upgradeActivation.viewTicketsBtn') || 'Acompanhar em Chamados'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
