import React from 'react';
import {
  X,
  ShieldCheck,
  ExternalLink,
  Lock,
  FileText,
  School,
  CheckCircle2,
  Printer,
  Globe,
  Database,
  Users,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleAccept = () => {
    if (onAccept) onAccept();
    onClose();
  };

  return (
    <div
      id="terms-of-service-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="terms-of-service-modal-card"
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-[#00a855] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 font-['Outfit']">
                  {t('termsModal.title')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 tracking-wide">
                  {t('termsModal.resellerBadge')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('termsModal.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-terms-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-[#0E0F0C]">
          {/* Key Agreement Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl flex items-start gap-3.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                {t('termsModal.agreementNotice')}
              </h4>
              <p className="text-xs text-emerald-900/90 mt-1 leading-relaxed">
                {t('termsModal.bannerDescription')}
              </p>
            </div>
          </div>

          {/* Section 1: Aceite & Objeto */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                {t('termsModal.section1Title')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              {t('termsModal.section1Content')}
            </p>
          </div>

          {/* Section 2: Integração Google Workspace */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                {t('termsModal.section2Title')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              {t('termsModal.section2Content')}
            </p>
          </div>

          {/* Section 3: Privacidade de Alunos e Instituições (LGPD / FERPA / COPPA) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                {t('termsModal.section3Title')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              {t('termsModal.section3Content')}
            </p>
          </div>

          {/* Section 4: Posse de Domínio e Gestão de Contas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                {t('termsModal.section4Title')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              {t('termsModal.section4Content')}
            </p>
          </div>

          {/* Section 5: Segurança e Criptografia */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                5
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                {t('termsModal.section5Title')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              {t('termsModal.section5Content')}
            </p>
          </div>

          {/* Section 6: Acordo de Nível de Serviço (SLA) & Suporte Parceiro */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                6
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                {t('termsModal.section6Title')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              {t('termsModal.section6Content')}
            </p>
          </div>

          {/* Official External Links Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('termsModal.officialLinksTitle')}</span>
            </h5>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href="https://workspace.google.com/terms/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#008a46] hover:text-[#006030] underline flex items-center gap-1.5"
              >
                <span>Google Workspace Agreement</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="hidden sm:inline text-slate-300">•</span>
              <a
                href="https://cloud.google.com/terms/data-processing-addendum"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#008a46] hover:text-[#006030] underline flex items-center gap-1.5"
              >
                <span>Cloud Data Processing Addendum (CDPA)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-start">
            <button
              type="button"
              onClick={handlePrint}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('termsModal.print')}</span>
            </button>
            <span className="text-xs text-slate-400">
              {t('termsModal.lastUpdated')}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              {t('common.close')}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-6 py-2 rounded-full bg-[#00c868] hover:bg-[#00b35c] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('termsModal.acceptAndClose')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
