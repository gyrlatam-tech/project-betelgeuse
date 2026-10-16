import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  ArrowRight,
  Clock,
  Lock,
  LifeBuoy,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CONTRACTS_DATA, ContractItem } from '../data/contractsData';
import { ContractDetailPage } from './ContractDetailPage';
import { GoogleEducationPartnerBadge } from './auth/GoogleEducationPartnerBadge';

interface ContractsViewProps {
  initialContractSlug?: string | null;
  onUrlChange?: (newPath: string) => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  initialContractSlug,
  onUrlChange,
}) => {
  const { language } = useLanguage();
  const content = CONTRACTS_DATA[language] || CONTRACTS_DATA.pt;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeContractSlug, setActiveContractSlug] = useState<string | null>(initialContractSlug || null);

  // Sync initial slug if provided
  useEffect(() => {
    if (initialContractSlug) {
      setActiveContractSlug(initialContractSlug);
    }
  }, [initialContractSlug]);

  // Handle URL updates when active contract changes
  const handleOpenContract = (slug: string) => {
    setActiveContractSlug(slug);
    const newPath = `/contracts/${slug}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ contractSlug: slug }, '', newPath);
    }
    if (onUrlChange) {
      onUrlChange(newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseContract = () => {
    setActiveContractSlug(null);
    const newPath = '/contracts';
    if (window.location.pathname !== newPath) {
      window.history.pushState({ contractSlug: null }, '', newPath);
    }
    if (onUrlChange) {
      onUrlChange(newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/contracts/')) {
        const slug = path.replace('/contracts/', '').replace(/\/$/, '');
        setActiveContractSlug(slug);
      } else {
        setActiveContractSlug(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Filter contracts by category and search
  const filteredContracts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return content.contracts.filter((contract) => {
      const matchCategory = selectedCategory === 'all' || contract.category === selectedCategory;
      const matchSearch =
        !q ||
        contract.title.toLowerCase().includes(q) ||
        contract.subtitle.toLowerCase().includes(q) ||
        contract.summary.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [content.contracts, selectedCategory, searchQuery]);

  // Active contract for dedicated page
  const activeContract = useMemo(() => {
    if (!activeContractSlug) return null;
    return content.contracts.find((c) => c.slug === activeContractSlug) || null;
  }, [content.contracts, activeContractSlug]);

  // Categories list
  const categories = useMemo(() => {
    return [
      { id: 'all', label: content.filterAll },
      { id: 'primary', label: 'Termos Gerais' },
      { id: 'privacy', label: 'Privacidade & Dados' },
      { id: 'sla', label: 'SLA & Suporte' },
      { id: 'compliance', label: 'DPA & Governança' },
      { id: 'security', label: 'Uso Aceitável' },
    ];
  }, [content.filterAll]);

  // If a contract is selected, render the dedicated contract page directly (NOT as modal)
  if (activeContract) {
    return (
      <ContractDetailPage
        contract={activeContract}
        content={content}
        onBack={handleCloseContract}
        onSelectAnotherContract={handleOpenContract}
        allContracts={content.contracts}
      />
    );
  }

  // Otherwise, render the clean, uncluttered directory page
  return (
    <div id="contracts-directory-page" className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Clean Header & Search */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2E6DF]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#163300] tracking-tight font-['Outfit']">
              {content.pageTitle}
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-[#5E605D] leading-relaxed">
              {content.pageSubtitle}
            </p>
          </div>

          <div className="shrink-0 self-start md:self-center">
            <GoogleEducationPartnerBadge size="footer" />
          </div>
        </div>

        {/* Clean Search Input & Filter Pills */}
        <div className="mt-8 pt-6 border-t border-[#F4F5F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="contracts-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={content.searchPlaceholder}
              className="w-full bg-[#F4F5F0] text-xs sm:text-sm text-[#0E0F0C] placeholder-[#868685] pl-10 pr-8 py-2 rounded-full border border-[#E2E6DF] focus:border-[#163300] focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#868685] hover:text-[#0E0F0C] px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Minimalist Categories List */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#163300] text-white shadow-xs'
                      : 'bg-[#F4F5F0] text-[#5E605D] hover:bg-[#E8EBE6] hover:text-[#0E0F0C]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clean Grid of Contracts */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5E605D] font-['Outfit']">
            Documentos Disponíveis ({filteredContracts.length})
          </span>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E6DF]">
            <FileText className="w-10 h-10 text-[#868685] mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-bold text-[#0E0F0C]">Nenhum contrato encontrado</h3>
            <p className="text-xs text-[#868685] mt-1">
              Tente redefinir a busca ou selecionar outra categoria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-full text-xs font-bold bg-[#163300] text-white hover:bg-[#0A1A00] transition-colors cursor-pointer"
            >
              Ver todos os contratos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredContracts.map((contract) => {
              const isPrincipal = contract.isPrincipal;

              const Icon =
                contract.category === 'privacy'
                  ? Lock
                  : contract.category === 'sla'
                  ? Clock
                  : contract.category === 'security'
                  ? ShieldCheck
                  : FileText;

              return (
                <div
                  key={contract.id}
                  id={`contract-card-${contract.slug}`}
                  onClick={() => handleOpenContract(contract.slug)}
                  className={`bg-white rounded-2xl p-6 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer group ${
                    isPrincipal
                      ? 'border-[#9FE870] ring-1 ring-[#9FE870]/40'
                      : 'border-[#E2E6DF] hover:border-[#163300]/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Category tag + Reading time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#F4F5F0] group-hover:bg-[#E8F7DC] text-[#163300] flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-[#5E605D] uppercase tracking-wider font-['Outfit']">
                          {contract.badge}
                        </span>
                      </div>

                      <span className="text-[11px] text-[#868685] font-medium">
                        {contract.readingTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-[#163300] group-hover:text-[#0A1A00] transition-colors font-['Outfit'] leading-snug">
                      {contract.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-[#5E605D] leading-relaxed line-clamp-3">
                      {contract.summary}
                    </p>
                  </div>

                  {/* Card Footer: Version & Action */}
                  <div className="pt-4 mt-4 border-t border-[#F4F5F0] flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[#868685]">
                      {contract.version}
                    </span>

                    <div className="flex items-center gap-1 font-bold text-[#163300] group-hover:translate-x-0.5 transition-transform">
                      <span>Ler documento</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
