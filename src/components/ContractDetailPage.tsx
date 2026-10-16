import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Share2,
  Printer,
  Check,
  Search,
  Calendar,
  Clock,
  FileText,
  ShieldCheck,
  ChevronRight,
  ArrowUp,
} from 'lucide-react';
import { ContractItem, ContractsContent } from '../data/contractsData';
import { GoogleEducationPartnerBadge } from './auth/GoogleEducationPartnerBadge';

interface ContractDetailPageProps {
  contract: ContractItem;
  content: ContractsContent;
  onBack: () => void;
  onSelectAnotherContract: (slug: string) => void;
  allContracts: ContractItem[];
}

export const ContractDetailPage: React.FC<ContractDetailPageProps> = ({
  contract,
  content,
  onBack,
  onSelectAnotherContract,
  allContracts = [],
}) => {
  const [clauseSearch, setClauseSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeClauseId, setActiveClauseId] = useState<string>('clause-1');

  // Filter clauses based on in-page search
  const filteredClauses = useMemo(() => {
    const query = clauseSearch.trim().toLowerCase();
    if (!query) return contract.clauses;

    return contract.clauses.filter((clause) => {
      const inTitle = clause.title.toLowerCase().includes(query);
      const inContent = clause.content.toLowerCase().includes(query);
      const inSub = clause.subclauses?.some(
        (sub) => sub.title?.toLowerCase().includes(query) || sub.content.toLowerCase().includes(query)
      );
      return inTitle || inContent || inSub;
    });
  }, [contract.clauses, clauseSearch]);

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  // Handle copying direct URL
  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/contracts/${contract.slug}`;
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

  const scrollToClause = (clauseNum: string) => {
    const element = document.getElementById(`clause-${clauseNum}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveClauseId(`clause-${clauseNum}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="contract-detail-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header / Breadcrumb Bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#E2E6DF] flex items-center justify-between gap-3 shadow-xs print:hidden">
        {/* Breadcrumbs & Back */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            id="btn-back-to-contracts-list"
            className="h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-full border border-[#CBD3C5] text-[#163300] hover:bg-[#F4F5F0] transition-colors cursor-pointer inline-flex items-center justify-center gap-2 text-xs font-bold shrink-0 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">{content.backToContractsBtn}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[#868685] min-w-0 truncate">
            <span className="hover:text-[#163300] cursor-pointer" onClick={onBack}>
              {content.pageTitle}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#CBD3C5] shrink-0" />
            <span className="font-semibold text-[#163300] truncate">
              {contract.title}
            </span>
          </div>
        </div>

        {/* Actions: Copy Link & Print */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyLink}
            id="btn-copy-contract-direct-link"
            className="h-8.5 sm:h-9 px-3 rounded-full text-xs font-bold text-[#163300] bg-[#F4F5F0] hover:bg-[#E8F7DC] border border-[#E2E6DF] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 hidden sm:inline">Link copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#5E605D]" />
                <span className="hidden sm:inline">{content.copyLinkBtn}</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            id="btn-print-contract-page"
            className="h-8.5 sm:h-9 px-3 rounded-full text-xs font-bold text-[#163300] bg-[#F4F5F0] hover:bg-[#E8F7DC] border border-[#E2E6DF] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-[#5E605D]" />
            <span className="hidden sm:inline">{content.printBtn}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Editorial Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Sidebar on Desktop, bottom on mobile */}
        <aside className="order-2 lg:order-1 lg:col-span-4 space-y-4 print:hidden lg:sticky lg:top-24">
          {/* Table of Contents Card */}
          <div className="bg-white rounded-2xl border border-[#E2E6DF] p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#163300] font-['Outfit']">
                {content.tableOfContentsTitle}
              </span>
              <span className="text-[11px] font-mono text-[#868685]">
                {contract.clauses.length} cláusulas
              </span>
            </div>

            {/* Quick in-page filter */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-[#868685] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={clauseSearch}
                onChange={(e) => setClauseSearch(e.target.value)}
                placeholder="Filtrar cláusula..."
                className="w-full bg-[#F4F5F0] text-xs text-[#0E0F0C] pl-8 pr-3 py-2 rounded-xl border border-[#E2E6DF] focus:border-[#163300] focus:bg-white focus:outline-none transition-all"
              />
              {clauseSearch && (
                <button
                  onClick={() => setClauseSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#868685] hover:text-[#0E0F0C]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Clause navigation list */}
            <nav className="space-y-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredClauses.map((clause) => {
                const isActive = activeClauseId === `clause-${clause.number}`;
                return (
                  <button
                    key={clause.number}
                    onClick={() => scrollToClause(clause.number)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-start gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-[#E8F7DC] text-[#163300] font-bold'
                        : 'text-[#5E605D] hover:bg-[#F4F5F0] hover:text-[#0E0F0C]'
                    }`}
                  >
                    <span className="font-mono text-[11px] opacity-70 shrink-0 mt-0.5">
                      § {clause.number}.
                    </span>
                    <span className="truncate leading-tight">{clause.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Other Documents Quick Switcher */}
          {allContracts.length > 1 && (
            <div className="bg-white rounded-2xl border border-[#E2E6DF] p-5">
              <div className="text-xs font-black uppercase tracking-wider text-[#163300] font-['Outfit'] mb-3">
                Outros Documentos
              </div>
              <div className="space-y-1.5">
                {allContracts
                  .filter((c) => c.slug !== contract.slug)
                  .map((other) => (
                    <button
                      key={other.slug}
                      onClick={() => onSelectAnotherContract(other.slug)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#5E605D] hover:text-[#163300] hover:bg-[#F4F5F0] border border-transparent hover:border-[#E2E6DF] transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate font-medium">{other.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#CBD3C5] group-hover:text-[#163300] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Reading Article (ordered first on mobile) */}
        <article className="order-1 lg:order-2 lg:col-span-8 bg-white rounded-3xl border border-[#E2E6DF] p-6 sm:p-10 lg:p-12 space-y-8 shadow-xs print:border-0 print:p-0">
          {/* Header section */}
          <div className="border-b border-[#E2E6DF] pb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#163300] text-[#9FE870] font-['Outfit']">
                {contract.badge}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8F7DC] text-[#163300] border border-[#CBD3C5] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {content.certifiedBadge}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#163300] tracking-tight font-['Outfit']">
              {contract.title}
            </h1>

            <p className="text-sm sm:text-base text-[#5E605D] leading-relaxed">
              {contract.subtitle}
            </p>

            {/* Metadata info */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs text-[#5E605D]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#868685]" />
                <span>
                  <strong>{content.effectiveDateLabel}:</strong> {contract.effectiveDate}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#868685]" />
                <span>
                  <strong>{content.versionLabel}:</strong> {contract.version}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#868685]" />
                <span>
                  <strong>{content.readingTimeLabel}:</strong> {contract.readingTime}
                </span>
              </div>
            </div>

            {/* Executive summary card */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[#F8F9F6] border border-[#E2E6DF] space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-[#163300] font-['Outfit']">
                Resumo do Documento
              </div>
              <p className="text-xs sm:text-sm text-[#2E302D] leading-relaxed">
                {contract.summary}
              </p>
            </div>
          </div>

          {/* Clauses list */}
          <div className="space-y-8">
            {filteredClauses.length === 0 ? (
              <div className="py-12 text-center text-[#868685]">
                <p className="text-sm font-semibold">Nenhuma cláusula encontrada para "{clauseSearch}".</p>
              </div>
            ) : (
              filteredClauses.map((clause) => (
                <section
                  key={clause.number}
                  id={`clause-${clause.number}`}
                  className="scroll-mt-6 border-b border-[#F4F5F0] pb-6 last:border-b-0 space-y-3"
                >
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-xs sm:text-sm font-black text-[#163300] bg-[#E8F7DC] px-2.5 py-1 rounded-lg shrink-0">
                      Cláusula {clause.number}ª
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-[#0E0F0C] font-['Outfit']">
                      {clause.title}
                    </h2>
                  </div>

                  <p className="text-sm sm:text-base text-[#2E302D] leading-relaxed pl-1">
                    {clause.content}
                  </p>

                  {/* Subclauses if any */}
                  {clause.subclauses && clause.subclauses.length > 0 && (
                    <div className="mt-3 space-y-2.5 pl-3 sm:pl-4 border-l-2 border-[#CBD3C5]">
                      {clause.subclauses.map((sub) => (
                        <div key={sub.number} className="text-xs sm:text-sm text-[#4E504D]">
                          <p className="leading-relaxed">
                            <strong className="font-bold text-[#0E0F0C]">
                              {sub.number} {sub.title ? `(${sub.title})` : ''} —
                            </strong>{' '}
                            {sub.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </div>

          {/* Corporate Signatory & Official Footer */}
          <div className="pt-8 border-t border-[#E2E6DF] mt-12 bg-[#F8F9F6] p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GoogleEducationPartnerBadge size="footer" />
              <div className="text-xs text-[#5E605D]">
                <p className="font-bold text-[#0E0F0C]">InternetByMOL LLC</p>
                <p className="text-[11px]">
                  3101 North Central Avenue, Phoenix, 85012, Estados Unidos
                </p>
                <a href="mailto:help@skoolia.net" className="text-[11px] text-[#008a46] font-semibold hover:underline">
                  help@skoolia.net
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={scrollToTop}
                className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-[#5E605D] hover:text-[#0E0F0C] hover:bg-white border border-[#E2E6DF] transition-all cursor-pointer"
                title="Voltar ao topo"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Topo</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#163300] bg-[#9FE870] hover:bg-[#8CD85E] transition-colors cursor-pointer shadow-xs"
              >
                {content.printBtn}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
