import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  ArrowLeft,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Search,
  BookOpen,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Globe2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { CONTRACTS_DATA, ContractItem } from '../data/contractsData';
import { GoogleEducationPartnerBadge } from './auth/GoogleEducationPartnerBadge';
import { ContractsView } from './ContractsView';

export type PublicLegalPageType = 'privacy' | 'terms' | 'contracts';

interface PublicLegalViewProps {
  pageType: PublicLegalPageType;
  onNavigate: (path: string) => void;
  isUserLoggedIn?: boolean;
}

export const PublicLegalView: React.FC<PublicLegalViewProps> = ({
  pageType,
  onNavigate,
  isUserLoggedIn = false,
}) => {
  const { language, t } = useLanguage();
  const content = CONTRACTS_DATA[language] || CONTRACTS_DATA.pt;

  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClauseId, setActiveClauseId] = useState<string>('');

  const isPt = language === 'pt';
  const isEs = language === 'es';

  // Find the matching contract data
  const targetContract: ContractItem | undefined = useMemo(() => {
    if (pageType === 'privacy') {
      return (
        content.contracts.find((c) => c.slug === 'privacy-policy' || c.id === 'privacy-policy') ||
        content.contracts[1]
      );
    }
    if (pageType === 'terms') {
      return (
        content.contracts.find((c) => c.slug === 'terms-of-service' || c.id === 'terms-of-service') ||
        content.contracts[0]
      );
    }
    return undefined;
  }, [pageType, content.contracts]);

  // Set document title according to current page
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (pageType === 'privacy') {
        document.title = isPt
          ? 'Política de Privacidade | Skoolia'
          : isEs
          ? 'Política de Privacidad | Skoolia'
          : 'Privacy Policy | Skoolia';
      } else if (pageType === 'terms') {
        document.title = isPt
          ? 'Termos de Serviço | Skoolia'
          : isEs
          ? 'Términos de Servicio | Skoolia'
          : 'Terms of Service | Skoolia';
      } else {
        document.title = isPt
          ? 'Central de Contratos | Skoolia'
          : isEs
          ? 'Central de Contratos | Skoolia'
          : 'Legal Agreements Center | Skoolia';
      }
    }
  }, [pageType, isPt, isEs]);

  // Handle printing
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Handle link copying
  const handleCopyCurrentLink = () => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin.includes('localhost')
      ? 'https://skoolia.net'
      : window.location.origin;
    const currentPath =
      pageType === 'privacy'
        ? '/legal/privacy/terms'
        : pageType === 'terms'
        ? '/legal/terms'
        : '/contracts';
    const fullUrl = `${origin}${currentPath}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Filter clauses by search
  const filteredClauses = useMemo(() => {
    if (!targetContract) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return targetContract.clauses;

    return targetContract.clauses.filter((clause) => {
      const matchTitle = clause.title.toLowerCase().includes(q);
      const matchContent = clause.content.toLowerCase().includes(q);
      const matchSub = clause.subclauses?.some(
        (sub) => sub.title?.toLowerCase().includes(q) || sub.content.toLowerCase().includes(q)
      );
      return matchTitle || matchContent || matchSub;
    });
  }, [targetContract, searchQuery]);

  const scrollToClause = (clauseNum: string) => {
    const el = document.getElementById(`clause-${clauseNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveClauseId(`clause-${clauseNum}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F0] text-[#0E0F0C] flex flex-col selection:bg-[#9FE870] selection:text-[#163300]">
      {/* Top Universal Legal Header */}
      <header className="bg-white border-b border-[#E2E6DF] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 sticky top-0 z-40 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto w-full relative">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Back to Home & Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-full border border-[#CBD3C5] text-[#163300] hover:bg-[#F4F5F0] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 active:scale-95"
                title={isPt ? 'Voltar para a Página Inicial' : isEs ? 'Volver a la Página Principal' : 'Back to Home'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isPt ? 'Início' : isEs ? 'Inicio' : 'Home'}
                </span>
              </button>

              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                className="text-xl sm:text-2xl font-black text-[#163300] font-['Outfit'] tracking-tight hover:opacity-90 transition-opacity"
              >
                skoolia
              </a>

              <span className="hidden md:inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#163300]/10 text-[#163300]">
                {isPt ? 'Conformidade & Jurídico' : isEs ? 'Conformidad y Legal' : 'Compliance & Legal'}
              </span>
            </div>

            {/* Center: Exactly Centered Navigation Tabs for Legal Sections (Desktop) */}
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-[#F4F5F0] p-1 rounded-full border border-[#E2E6DF] text-xs font-semibold">
              <a
                href="/legal/privacy/terms"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/legal/privacy/terms');
                }}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  pageType === 'privacy'
                    ? 'bg-white text-[#163300] font-bold shadow-xs'
                    : 'text-[#5E605D] hover:text-[#0E0F0C]'
                }`}
              >
                {isPt ? 'Política de Privacidade' : isEs ? 'Política de Privacidad' : 'Privacy Policy'}
              </a>

              <a
                href="/legal/terms"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/legal/terms');
                }}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  pageType === 'terms'
                    ? 'bg-white text-[#163300] font-bold shadow-xs'
                    : 'text-[#5E605D] hover:text-[#0E0F0C]'
                }`}
              >
                {isPt ? 'Termos de Serviço' : isEs ? 'Términos de Servicio' : 'Terms of Service'}
              </a>

              <a
                href="/contracts"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contracts');
                }}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  pageType === 'contracts'
                    ? 'bg-white text-[#163300] font-bold shadow-xs'
                    : 'text-[#5E605D] hover:text-[#0E0F0C]'
                }`}
              >
                {isPt ? 'Central de Contratos' : isEs ? 'Central de Contratos' : 'Legal Agreements'}
              </a>
            </nav>

            {/* Right: Language, Print, Login aligned with uniform height */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <LanguageSelector variant="compact" />

              <button
                type="button"
                onClick={handlePrint}
                className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-full border border-[#CBD3C5] text-[#0E0F0C] hover:bg-[#F4F5F0] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title={isPt ? 'Imprimir ou Salvar PDF' : isEs ? 'Imprimir o Guardar PDF' : 'Print or Save PDF'}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  PDF
                </span>
              </button>

              {isUserLoggedIn ? (
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="h-8.5 sm:h-9 px-3 sm:px-4 rounded-full text-xs font-bold bg-[#163300] text-[#9FE870] hover:bg-[#0A1A00] transition-colors cursor-pointer font-['Outfit'] inline-flex items-center justify-center shrink-0 whitespace-nowrap shadow-xs"
                >
                  <span className="hidden xs:inline">{isPt ? 'Console' : isEs ? 'Consola' : 'Console'}</span>
                  <span className="xs:hidden">{isPt ? 'Painel' : isEs ? 'Panel' : 'App'}</span>
                </button>
              ) : (
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/login');
                  }}
                  className="h-8.5 sm:h-9 px-3 sm:px-4 rounded-full text-xs font-bold bg-[#163300] text-[#9FE870] hover:bg-[#0A1A00] transition-colors cursor-pointer font-['Outfit'] inline-flex items-center justify-center shrink-0 whitespace-nowrap shadow-xs"
                >
                  <span>{isPt ? 'Login' : isEs ? 'Login' : 'Sign In'}</span>
                </a>
              )}
            </div>
          </div>

          {/* Mobile Subnavigation Tabs */}
          <div className="lg:hidden flex items-center justify-center gap-2 pt-2.5 mt-2 border-t border-[#E2E6DF]/70 text-xs font-semibold">
            <a
              href="/legal/privacy/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/legal/privacy/terms');
              }}
              className={`h-8 px-3.5 inline-flex items-center justify-center rounded-full whitespace-nowrap transition-all ${
                pageType === 'privacy'
                  ? 'bg-[#163300] text-white font-bold shadow-xs'
                  : 'text-[#5E605D] bg-[#EAECE6] hover:bg-[#DFE2DA]'
              }`}
            >
              {isPt ? 'Privacidade' : isEs ? 'Privacidad' : 'Privacy'}
            </a>
            <a
              href="/legal/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/legal/terms');
              }}
              className={`h-8 px-3.5 inline-flex items-center justify-center rounded-full whitespace-nowrap transition-all ${
                pageType === 'terms'
                  ? 'bg-[#163300] text-white font-bold shadow-xs'
                  : 'text-[#5E605D] bg-[#EAECE6] hover:bg-[#DFE2DA]'
              }`}
            >
              {isPt ? 'Termos' : isEs ? 'Términos' : 'Terms'}
            </a>
            <a
              href="/contracts"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/contracts');
              }}
              className={`h-8 px-3.5 inline-flex items-center justify-center rounded-full whitespace-nowrap transition-all ${
                pageType === 'contracts'
                  ? 'bg-[#163300] text-white font-bold shadow-xs'
                  : 'text-[#5E605D] bg-[#EAECE6] hover:bg-[#DFE2DA]'
              }`}
            >
              {isPt ? 'Contratos' : isEs ? 'Contratos' : 'Contracts'}
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {pageType === 'contracts' ? (
          <ContractsView
            initialContractSlug={null}
            onUrlChange={(newPath) => onNavigate(newPath)}
          />
        ) : (
          targetContract && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Document Overview Hero Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E6DF] shadow-xs relative overflow-hidden">
                <div className="max-w-3xl space-y-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#163300] text-[#9FE870] font-['Outfit']">
                      {targetContract.badge}
                    </span>
                    <span className="text-xs text-[#868685]">
                      {targetContract.version}
                    </span>
                    <span className="text-[#CBD3C5]">•</span>
                    <span className="text-xs text-[#868685]">
                      {isPt ? 'Vigência:' : isEs ? 'Vigencia:' : 'Effective:'} {targetContract.effectiveDate}
                    </span>
                    <span className="text-[#CBD3C5]">•</span>
                    <span className="text-xs font-semibold text-[#008a46]">
                      {isPt ? 'Documento Oficial Público' : isEs ? 'Documento Oficial Público' : 'Official Public Document'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                    {targetContract.title}
                  </h1>

                  <p className="text-sm sm:text-base text-[#5E605D] leading-relaxed">
                    {targetContract.subtitle}
                  </p>

                  {/* Summary Callout */}
                  <div className="p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] text-xs sm:text-sm text-[#0E0F0C] leading-relaxed">
                    <span className="font-bold text-[#163300]">
                      {isPt ? 'Resumo Executivo:' : isEs ? 'Resumen Ejecutivo:' : 'Executive Summary:'}{' '}
                    </span>
                    {targetContract.summary}
                  </div>
                </div>

                {/* Direct Action Toolbar */}
                <div className="mt-6 pt-5 border-t border-[#E2E6DF] flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCurrentLink}
                      className="px-3.5 py-1.5 rounded-full bg-[#F4F5F0] hover:bg-[#EAECE6] text-[#163300] font-semibold border border-[#CBD3C5] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#008a46]" />
                          <span>{isPt ? 'Link Copiado!' : isEs ? '¡Enlace Copiado!' : 'Link Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isPt ? 'Copiar Link Permanente' : isEs ? 'Copiar Enlace Permanente' : 'Copy Permanent Link'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3.5 py-1.5 rounded-full bg-[#F4F5F0] hover:bg-[#EAECE6] text-[#0E0F0C] font-semibold border border-[#CBD3C5] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{isPt ? 'Imprimir Documento' : isEs ? 'Imprimir Documento' : 'Print Document'}</span>
                    </button>
                  </div>

                  {/* Cross Links between Privacy and Terms */}
                  <div className="flex items-center gap-3 text-[#5E605D]">
                    {pageType === 'privacy' ? (
                      <a
                        href="/legal/terms"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate('/legal/terms');
                        }}
                        className="font-bold text-[#008a46] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isPt ? 'Consultar Termos de Serviço' : isEs ? 'Consultar Términos de Servicio' : 'View Terms of Service'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <a
                        href="/legal/privacy/terms"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate('/legal/privacy/terms');
                        }}
                        className="font-bold text-[#008a46] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isPt ? 'Consultar Política de Privacidade' : isEs ? 'Consultar Política de Privacidad' : 'View Privacy Policy'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Special Google OAuth 2.0 & Limited Use Disclosure Callout */}
              <div className="bg-[#EBF7EE] border-2 border-[#A8E5BA] rounded-3xl p-6 sm:p-7 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#008a46] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#0B401F] font-['Outfit']">
                        {isPt
                          ? 'Declaração Oficial Google API Services User Data Policy'
                          : isEs
                          ? 'Declaración Oficial Google API Services User Data Policy'
                          : 'Official Google API Services User Data Policy Disclosure'}
                      </h3>
                      <p className="text-xs text-[#176635] font-medium">
                        {isPt
                          ? 'Requisitos de Uso Limitado (Limited Use Requirements) e Transparência de Dados'
                          : isEs
                          ? 'Requisitos de Uso Limitado (Limited Use Requirements) y Transparencia de Datos'
                          : 'Limited Use Requirements & Data Stewardship Standards'}
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-[#0B401F] hover:bg-[#D7F1DF] border border-[#A8E5BA] transition-colors shrink-0"
                  >
                    <span>Google User Data Policy</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="bg-white/80 rounded-2xl p-4 border border-[#A8E5BA]/60 text-xs sm:text-sm text-[#0B401F] space-y-2 leading-relaxed">
                  <p className="font-bold">
                    {isPt
                      ? 'Compromisso Expresso de Uso Limitado:'
                      : isEs
                      ? 'Compromiso Expreso de Uso Limitado:'
                      : 'Express Limited Use Commitment:'}
                  </p>
                  <blockquote className="italic border-l-4 border-[#008a46] pl-3 py-1 font-semibold text-[#0E0F0C]">
                    &ldquo;
                    {isPt
                      ? "O uso e a transferência pela Skoolia de informações recebidas das APIs do Google para qualquer outro aplicativo obedecerão à Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado (Google API Services User Data Policy, including Limited Use requirements)."
                      : isEs
                      ? "El uso y la transferencia por parte de Skoolia de la información recibida de las API de Google a cualquier otra aplicación se ajustarán a la Política de Datos de Usuario de los Servicios de las API de Google, incluidos los requisitos de Uso Limitado (Google API Services User Data Policy, including Limited Use requirements)."
                      : "Skoolia's use and transfer of information received from Google APIs to any other app will adhere to Google API Services User Data Policy, including the Limited Use requirements."}
                    &rdquo;
                  </blockquote>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-[#F4F9F5] p-3 rounded-xl border border-[#D7F1DF]">
                      <span className="font-bold block text-xs text-[#0B401F]">
                        {isPt ? '1. Escopo Restrito' : isEs ? '1. Alcance Restringido' : '1. Narrow Scope'}
                      </span>
                      <p className="text-[11px] text-[#176635] mt-0.5">
                        {isPt
                          ? 'Acessamos apenas dados de diretório, domínio e cotas autorizados pelo administrador escolar.'
                          : isEs
                          ? 'Solo accedemos a datos de directorio, dominios y cuotas autorizados por el administrador escolar.'
                          : 'Only accessing directory, domain, and quota data authorized by the school administrator.'}
                      </p>
                    </div>

                    <div className="bg-[#F4F9F5] p-3 rounded-xl border border-[#D7F1DF]">
                      <span className="font-bold block text-xs text-[#0B401F]">
                        {isPt ? '2. Zero Venda ou Anúncios' : isEs ? '2. Cero Venta o Anuncios' : '2. Zero Commercial Ads'}
                      </span>
                      <p className="text-[11px] text-[#176635] mt-0.5">
                        {isPt
                          ? 'Os dados nunca são vendidos, alugados ou usados para publicidade ou treinamento de IA geral.'
                          : isEs
                          ? 'Los datos nunca se venden ni se usan para publicidad o entrenamiento de IA general.'
                          : 'Data is never sold, transferred for ads, or used to train general artificial intelligence models.'}
                      </p>
                    </div>

                    <div className="bg-[#F4F9F5] p-3 rounded-xl border border-[#D7F1DF]">
                      <span className="font-bold block text-xs text-[#0B401F]">
                        {isPt ? '3. Revogação a Qualquer Momento' : isEs ? '3. Revocación Inmediata' : '3. Immediate Revocation'}
                      </span>
                      <p className="text-[11px] text-[#176635] mt-0.5">
                        {isPt
                          ? 'Acesso pode ser revogado a qualquer instante em myaccount.google.com/permissions.'
                          : isEs
                          ? 'El acceso se puede revocar en cualquier instante en myaccount.google.com/permissions.'
                          : 'Permissions can be revoked instantly at myaccount.google.com/permissions.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Table of Contents & Clauses */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Table of Contents & Metadata Sidebar (ordered after clauses on mobile) */}
                <aside className="order-2 lg:order-1 lg:col-span-4 space-y-5 lg:sticky lg:top-24">
                  {/* Search inside Document */}
                  <div className="bg-white p-4 rounded-2xl border border-[#E2E6DF] shadow-xs">
                    <label className="text-xs font-bold text-[#163300] block mb-2 font-['Outfit']">
                      {isPt ? 'Pesquisar nas Cláusulas' : isEs ? 'Buscar en Cláusulas' : 'Search Clauses'}
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#868685] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isPt ? 'Ex: Google, dados, exclusão...' : isEs ? 'Ej: Google, datos, supresión...' : 'e.g. Google, data, deletion...'}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F4F5F0] border border-[#CBD3C5] text-xs text-[#0E0F0C] placeholder-[#868685] focus:outline-none focus:ring-2 focus:ring-[#163300]"
                      />
                    </div>
                  </div>

                  {/* Index of Clauses */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E2E6DF] shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#163300] font-['Outfit'] border-b border-[#E2E6DF] pb-2">
                      <BookOpen className="w-4 h-4 text-[#008a46]" />
                      <span>{content.tableOfContentsTitle}</span>
                    </div>
                    <nav className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                      {targetContract.clauses.map((c) => (
                        <button
                          key={c.number}
                          type="button"
                          onClick={() => scrollToClause(c.number)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#F4F5F0] transition-colors flex items-start gap-2 text-[#5E605D] hover:text-[#163300] cursor-pointer"
                        >
                          <span className="font-bold text-[#0E0F0C] shrink-0 font-mono">
                            §{c.number}
                          </span>
                          <span className="truncate">{c.title}</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Entity Information Card */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E2E6DF] shadow-xs space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#163300] font-['Outfit'] border-b border-[#E2E6DF] pb-2">
                      <Building2 className="w-4 h-4 text-[#008a46]" />
                      <span>{isPt ? 'Entidade Controladora' : isEs ? 'Entidad Controladora' : 'Operating Entity'}</span>
                    </div>
                    <div className="space-y-2 text-[#5E605D]">
                      <p className="font-bold text-[#0E0F0C]">
                        InternetByMOL LLC
                      </p>
                      <div className="flex items-start gap-2 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#868685] shrink-0 mt-0.5" />
                        <span>
                          3101 North Central Avenue, Phoenix, 85012, United States
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-[#868685] shrink-0" />
                        <a
                          href="mailto:help@skoolia.net"
                          className="text-[#008a46] font-semibold hover:underline"
                        >
                          help@skoolia.net
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <Globe2 className="w-3.5 h-3.5 text-[#868685] shrink-0" />
                        <a
                          href="https://skoolia.net"
                          className="text-[#008a46] font-semibold hover:underline"
                        >
                          https://skoolia.net
                        </a>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Right: Full Clauses Content (ordered first on mobile) */}
                <div className="order-1 lg:order-2 lg:col-span-8 space-y-6">
                  {filteredClauses.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-[#E2E6DF] text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-[#868685] mx-auto" />
                      <p className="text-sm font-semibold text-[#0E0F0C]">
                        {isPt ? 'Nenhuma cláusula encontrada para a pesquisa.' : isEs ? 'No se encontraron cláusulas para la búsqueda.' : 'No clauses match your search query.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-bold text-[#008a46] hover:underline"
                      >
                        {isPt ? 'Limpar filtro' : isEs ? 'Limpiar filtro' : 'Clear filter'}
                      </button>
                    </div>
                  ) : (
                    filteredClauses.map((clause) => (
                      <article
                        key={clause.number}
                        id={`clause-${clause.number}`}
                        className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E6DF] shadow-xs space-y-4 scroll-mt-24 transition-all hover:border-[#CBD3C5]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-[#163300] text-[#9FE870] font-black text-xs font-['Outfit'] flex items-center justify-center shrink-0">
                            §{clause.number}
                          </span>
                          <h2 className="text-base sm:text-lg font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                            {clause.title}
                          </h2>
                        </div>

                        <p className="text-xs sm:text-sm text-[#5E605D] leading-relaxed pl-1 sm:pl-11">
                          {clause.content}
                        </p>

                        {/* Subclauses */}
                        {clause.subclauses && clause.subclauses.length > 0 && (
                          <div className="space-y-3 pl-1 sm:pl-11 pt-2 border-t border-[#F4F5F0]">
                            {clause.subclauses.map((sub) => (
                              <div
                                key={sub.number}
                                className="bg-[#F4F5F0] p-4 rounded-2xl border border-[#E2E6DF] space-y-1.5"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-[#163300] font-mono">
                                    {sub.number}
                                  </span>
                                  {sub.title && (
                                    <h4 className="text-xs font-bold text-[#0E0F0C] font-['Outfit']">
                                      {sub.title}
                                    </h4>
                                  )}
                                </div>
                                <p className="text-xs text-[#5E605D] leading-relaxed">
                                  {sub.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    ))
                  )}

                  {/* Official Closing Declaration */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E6DF] shadow-xs space-y-4 text-xs sm:text-sm text-[#5E605D]">
                    <div className="flex items-center gap-3 text-[#163300] font-bold font-['Outfit']">
                      <CheckCircle2 className="w-5 h-5 text-[#008a46]" />
                      <span>
                        {isPt
                          ? 'Autenticidade e Vigência Jurídica'
                          : isEs
                          ? 'Autenticidad y Vigencia Jurídica'
                          : 'Authenticity & Legal Force'}
                      </span>
                    </div>
                    <p className="leading-relaxed">
                      {content.acceptDeclarationText}
                    </p>
                    <div className="pt-3 border-t border-[#E2E6DF] flex flex-wrap items-center justify-between gap-3 text-xs text-[#868685]">
                      <span>
                        {isPt ? 'Última revisão formal: Janeiro de 2026' : isEs ? 'Última revisión formal: Enero de 2026' : 'Last formal audit: January 2026'}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href="https://workspace.google.com/terms/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#008a46] font-semibold hover:underline flex items-center gap-1"
                        >
                          <span>Google Workspace Terms</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Official Legal Footer */}
      <footer className="w-full bg-[#F4F5F0] border-t border-[#E2E6DF] py-8 px-4 sm:px-8 text-xs text-[#5E605D] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Entity, Logo, Address */}
          <div className="flex flex-col items-center md:items-start gap-1.5 text-center md:text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#163300] font-['Outfit'] tracking-tight">
                skoolia
              </span>
              <span className="text-[#CBD3C5]">•</span>
              <span className="font-semibold text-[#0E0F0C]">
                InternetByMOL LLC
              </span>
            </div>
            <p className="text-[11px] text-[#868685]">
              3101 North Central Avenue, Phoenix, 85012, United States
            </p>
            <p className="text-[10px] text-[#868685]">
              © {new Date().getFullYear()} InternetByMOL LLC. {content.badgeVersion}
            </p>
          </div>

          {/* Right: Direct Nav Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6 text-xs font-medium">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="text-[#5E605D] hover:text-[#163300] hover:underline transition-colors"
            >
              {isPt ? 'Página Inicial' : isEs ? 'Página Principal' : 'Home'}
            </a>

            <a
              href="/legal/privacy/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/legal/privacy/terms');
              }}
              className={`hover:underline transition-colors ${
                pageType === 'privacy' ? 'font-bold text-[#163300]' : 'text-[#5E605D] hover:text-[#163300]'
              }`}
            >
              {isPt ? 'Política de Privacidade' : isEs ? 'Política de Privacidad' : 'Privacy Policy'}
            </a>

            <a
              href="/legal/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/legal/terms');
              }}
              className={`hover:underline transition-colors ${
                pageType === 'terms' ? 'font-bold text-[#163300]' : 'text-[#5E605D] hover:text-[#163300]'
              }`}
            >
              {isPt ? 'Termos de Serviço' : isEs ? 'Términos de Servicio' : 'Terms of Service'}
            </a>

            <a
              href="/contracts"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/contracts');
              }}
              className="text-[#5E605D] hover:text-[#163300] hover:underline transition-colors"
            >
              {isPt ? 'Central de Contratos' : isEs ? 'Central de Contratos' : 'Contracts'}
            </a>

            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/contact');
              }}
              className="text-[#5E605D] hover:text-[#163300] hover:underline transition-colors"
            >
              {isPt ? 'Contato & Suporte' : isEs ? 'Contacto y Soporte' : 'Contact & Support'}
            </a>

            <span className="hidden sm:inline text-[#CBD3C5]">•</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[#868685]">{isPt ? 'Suporte:' : isEs ? 'Soporte:' : 'Support:'}</span>
              <a
                href="mailto:help@skoolia.net"
                className="text-[#008a46] font-semibold hover:underline"
              >
                help@skoolia.net
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
