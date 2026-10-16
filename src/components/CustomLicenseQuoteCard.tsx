import React, { useState } from 'react';
import { Sparkles, Mail, MessageSquare, ArrowRight, Check, Copy } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface CustomLicenseQuoteCardProps {
  onOpenTicket?: () => void;
  className?: string;
  compact?: boolean;
}

export const CustomLicenseQuoteCard: React.FC<CustomLicenseQuoteCardProps> = ({
  onOpenTicket,
  className = '',
  compact = false,
}) => {
  const { t, language } = useLanguage();
  const { institution } = useAuth();
  const [copied, setCopied] = useState(false);

  const supportEmail = 'help@skoolia.net';
  const orgName = institution?.institutionName || 'Nossa Instituição';

  const mailtoSubject = encodeURIComponent(
    language === 'en'
      ? `Custom License Quote Request - ${orgName}`
      : language === 'es'
      ? `Solicitud de Cotización de Licencias Personalizadas - ${orgName}`
      : `Solicitação de Cotação de Licenças Personalizadas - ${orgName}`
  );

  const mailtoBody = encodeURIComponent(
    language === 'en'
      ? `Hello Skoolia Support Team,\n\nOur institution (${orgName}) needs a custom volume of Google Workspace licenses beyond the standard 200 license plan.\n\nEstimated number of licenses needed:\nContact phone/WhatsApp:\nComments/Requirements:\n\nThank you!`
      : language === 'es'
      ? `Hola Equipo de Soporte Skoolia,\n\nNuestra institución (${orgName}) necesita un volumen personalizado de licencias de Google Workspace por encima del plan estándar de 200 licencias.\n\nCantidad estimada de licencias requeridas:\nTeléfono/WhatsApp de contacto:\nComentarios/Requerimientos:\n\n¡Gracias!`
      : `Olá Equipe de Suporte Skoolia,\n\nNossa instituição (${orgName}) precisa de uma quantidade customizada de licenças do Google Workspace além do plano padrão de 200 licenças.\n\nQuantidade estimada de licenças necessárias:\nTelefone/WhatsApp de contato:\nObservações/Requisitos específicos:\n\nObrigado!`
  );

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const phraseText =
    language === 'en'
      ? 'Need a custom quantity? Contact our team at help@skoolia.net or open a support ticket to receive a quote.'
      : language === 'es'
      ? '¿Necesita una cantidad personalizada? Comuníquese con nuestro equipo en help@skoolia.net o abra un ticket de soporte para recibir una cotización.'
      : 'Precisa de uma quantidade customizada? Entre em contato com a nossa equipe em help@skoolia.net ou abra um ticket de suporte para receber uma cotação.';

  const cardTitle =
    language === 'en'
      ? 'Need more than 200 licenses or a tailored plan?'
      : language === 'es'
      ? '¿Necesita más de 200 licencias o un plan a medida?'
      : 'Precisa de mais de 200 licenças ou plano sob medida?';

  const badgeText =
    language === 'en'
      ? 'Custom License Volume • Tailored Plan'
      : language === 'es'
      ? 'Volumen Personalizado • Plan a Medida'
      : 'Quantidade Customizada • Plano Sob Medida';

  if (compact) {
    return (
      <div
        className={`bg-gradient-to-r from-[#163300] to-[#1F4500] text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#9FE870]/30 relative overflow-hidden ${className}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9FE870]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#9FE870]/20 text-[#9FE870] text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#9FE870]/30 font-['Outfit']">
              <Sparkles className="w-3 h-3 shrink-0" />
              {badgeText}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#F4F5F0] leading-relaxed">
            {phraseText}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={`mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] text-xs font-black rounded-full transition-all shadow-xs active:scale-98"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>{supportEmail}</span>
            </a>

            {onOpenTicket && (
              <button
                type="button"
                onClick={onOpenTicket}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full border border-white/20 transition-all active:scale-98 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#9FE870]" />
                <span>{language === 'en' ? 'Open Ticket' : language === 'es' ? 'Abrir Ticket' : 'Abrir Ticket de Cotação'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl p-5 sm:p-7 border border-[#E2E6DF] bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden ${className}`}
    >
      {/* Decorative subtle backdrop accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#E8F7DC]/50 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-[#E8F7DC] text-[#163300] text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-[#9FE870]/40 font-['Outfit']">
              <Sparkles className="w-3.5 h-3.5 text-[#163300] shrink-0" />
              {badgeText}
            </span>
            <span className="text-xs text-[#5E605D] font-medium hidden sm:inline">
              {language === 'en'
                ? 'Priority SLA within 24h'
                : language === 'es'
                ? 'SLA prioritario en hasta 24h'
                : 'SLA prioritário em até 24h'}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
            {cardTitle}
          </h3>

          <p className="text-xs sm:text-sm text-[#5E605D] leading-relaxed font-medium">
            {phraseText}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <a
            href={`mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`}
            className="h-11 px-4 sm:px-5 rounded-full bg-[#F4F5F0] hover:bg-[#E2E6DF] border border-[#D4DACF] text-[#0E0F0C] text-xs sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-98"
            title="Enviar e-mail para help@skoolia.net"
          >
            <Mail className="w-4 h-4 text-[#163300] shrink-0" />
            <span>help@skoolia.net</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopyEmail();
              }}
              className="p-1 text-[#868685] hover:text-[#0E0F0C] rounded-full transition-colors ml-0.5"
              title="Copiar e-mail"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </a>

          {onOpenTicket && (
            <button
              type="button"
              onClick={onOpenTicket}
              className="h-11 px-5 sm:px-6 rounded-full bg-[#163300] hover:bg-[#1f4700] text-[#9FE870] text-xs sm:text-sm font-black transition-all inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              <MessageSquare className="w-4 h-4 text-[#9FE870] shrink-0" />
              <span>
                {language === 'en'
                  ? 'Open Quote Ticket'
                  : language === 'es'
                  ? 'Abrir Ticket de Cotización'
                  : 'Abrir Ticket de Suporte'}
              </span>
              <ArrowRight className="w-4 h-4 text-[#9FE870] shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
