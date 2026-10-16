import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  Copy,
  RefreshCw,
  Send,
  FileText,
  Server,
  Mail,
  ExternalLink,
  ArrowRight,
  Shield,
  Sparkles,
  Info,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Undo2,
} from 'lucide-react';
import { WorkspaceDomain, DomainAuditRecord } from '../types';
import { SkooliaTwinOGlyph } from './SkooliaLoader';

interface ApprovalsViewProps {
  domains: WorkspaceDomain[];
  onRefreshDomains: () => Promise<void>;
  onApproveDomain: (domainName: string, txtToken: string, adminNotes?: string) => Promise<boolean>;
  onVerifyDomainDns: (domainName: string) => Promise<any>;
  onUnverifyDomain?: (domainName: string) => Promise<boolean>;
  onDeleteDomain: (domainName: string) => Promise<void>;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  domains,
  onRefreshDomains,
  onApproveDomain,
  onVerifyDomainDns,
  onUnverifyDomain,
  onDeleteDomain,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'PENDING_DNS' | 'VERIFIED'>('PENDING_APPROVAL');

  // Modal / Drawer state for approving domain
  const [selectedDomain, setSelectedDomain] = useState<WorkspaceDomain | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<WorkspaceDomain | null>(null);
  const [isDeletingDomain, setIsDeletingDomain] = useState(false);
  const [domainToUnverify, setDomainToUnverify] = useState<WorkspaceDomain | null>(null);
  const [isUnverifyingDomain, setIsUnverifyingDomain] = useState(false);
  const [manualTxtInput, setManualTxtInput] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  const [dnsCheckResult, setDnsCheckResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const verifiedCount = domains.filter((d) => d.verified || d.state === 'VERIFIED').length;
  const pendingDnsCount = domains.filter((d) => !d.verified && d.state === 'PENDING_DNS').length;
  const pendingApprovalsCount = domains.filter((d) => !d.verified && d.state !== 'PENDING_DNS' && d.state !== 'VERIFIED').length;

  const filteredDomains = domains.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || d.domainName.toLowerCase().includes(q);

    const isVerified = d.verified || d.state === 'VERIFIED';
    const isPendingDns = !isVerified && d.state === 'PENDING_DNS';
    const isPendingApproval = !isVerified && !isPendingDns;

    let matchesFilter = true;
    if (filter === 'PENDING_APPROVAL') matchesFilter = isPendingApproval;
    if (filter === 'PENDING_DNS') matchesFilter = isPendingDns;
    if (filter === 'VERIFIED') matchesFilter = isVerified;

    return matchesSearch && matchesFilter;
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenApproveModal = (domain: WorkspaceDomain) => {
    setSelectedDomain(domain);
    const isPendingApproval = !domain.verified && domain.state !== 'VERIFIED' && domain.state !== 'PENDING_DNS';
    setManualTxtInput(isPendingApproval ? '' : (domain.verificationTxtToken || domain.auditRecord?.token || ''));
    setDnsCheckResult(null);
    setFeedbackMessage(null);
  };

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    const token = manualTxtInput.trim();
    if (!token) {
      setFeedbackMessage({
        type: 'error',
        text: 'Por favor, insira o registro TXT de verificação fornecido pelo Google Workspace.',
      });
      return;
    }

    setIsSubmittingApproval(true);
    setFeedbackMessage(null);

    try {
      const success = await onApproveDomain(selectedDomain.domainName, token);
      if (success) {
        setFeedbackMessage({
          type: 'success',
          text: `Os registros DNS (TXT, MX e SPF) foram enviados ao cliente com sucesso! O domínio ${selectedDomain.domainName} está aguardando configuração e propagação DNS.`,
        });
        await onRefreshDomains();
        // Update local selected domain
        setSelectedDomain((prev) =>
          prev
            ? {
                ...prev,
                state: 'PENDING_DNS',
                verificationTxtToken: token,
              }
            : null
        );
      } else {
        setFeedbackMessage({
          type: 'error',
          text: 'Não foi possível salvar a aprovação do domínio. Verifique os dados e tente novamente.',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Erro ao processar aprovação do domínio.',
      });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleLiveDnsCheck = async (domainName: string) => {
    setIsCheckingDns(true);
    setDnsCheckResult(null);
    try {
      const result = await onVerifyDomainDns(domainName);
      setDnsCheckResult(result);
      if (result.ok || result.state === 'VERIFIED') {
        setFeedbackMessage({
          type: 'success',
          text: 'Registros DNS verificados e propagados com sucesso! O domínio foi promovido a VERIFICADO.',
        });
        await onRefreshDomains();
      } else {
        setFeedbackMessage({
          type: 'info',
          text: result.message || 'Aguardando propagação DNS pública.',
        });
      }
    } catch (err: any) {
      setDnsCheckResult({ ok: false, error: err?.message });
    } finally {
      setIsCheckingDns(false);
    }
  };

  const handleRequestDelete = (domain: WorkspaceDomain) => {
    setDomainToDelete(domain);
  };

  const handleConfirmUnverifyDomain = async () => {
    if (!domainToUnverify || !onUnverifyDomain) return;
    setIsUnverifyingDomain(true);
    try {
      const success = await onUnverifyDomain(domainToUnverify.domainName);
      if (success) {
        setDomainToUnverify(null);
        if (selectedDomain?.domainName === domainToUnverify.domainName) {
          setSelectedDomain(null);
        }
        await onRefreshDomains();
        setFeedbackMessage({
          type: 'info',
          text: `Domínio ${domainToUnverify.domainName} desverificado. Ele retornou para a fila de aprovação pendente.`,
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Erro ao desverificar domínio.',
      });
    } finally {
      setIsUnverifyingDomain(false);
    }
  };

  const handleConfirmDeleteDomain = async () => {
    if (!domainToDelete) return;
    setIsDeletingDomain(true);
    try {
      await onDeleteDomain(domainToDelete.domainName);
      setDomainToDelete(null);
      if (selectedDomain?.domainName === domainToDelete.domainName) {
        setSelectedDomain(null);
      }
      await onRefreshDomains();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Erro ao excluir solicitação de domínio.',
      });
    } finally {
      setIsDeletingDomain(false);
    }
  };

  return (
    <div id="approvals-view" className="space-y-4 sm:space-y-6 animate-fadeIn pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#163300] via-[#1F4502] to-[#163300] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#9FE870]/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F7DC] text-[#163300] text-xs font-bold uppercase tracking-wider border border-[#9FE870]/40">
              <Shield className="w-3.5 h-3.5" />
              Módulo Administrador Institucional
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight">
              Central de Aprovações de Domínios
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Gerencie solicitações de registro de domínios secundários de clientes. Insira o registro TXT de verificação
              do Google Workspace, libere as instruções DNS e valide a propagação em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="refresh-approvals-btn"
              onClick={() => onRefreshDomains()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all border border-white/20 cursor-pointer backdrop-blur-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar Lista
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/15">
          <div
            onClick={() => setFilter('PENDING_APPROVAL')}
            className={`p-4 rounded-2xl cursor-pointer transition-all ${
              filter === 'PENDING_APPROVAL'
                ? 'bg-[#9FE870]/20 border border-[#9FE870]/60'
                : 'bg-white/10 hover:bg-white/15 border border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-['Outfit']">
                Aguardando Aprovação
              </span>
              <Clock className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl font-black mt-2 text-white font-['Outfit']">{pendingApprovalsCount}</div>
            <div className="text-xs text-white/70 mt-1">Requerem inserção de TXT manual</div>
          </div>

          <div
            onClick={() => setFilter('PENDING_DNS')}
            className={`p-4 rounded-2xl cursor-pointer transition-all ${
              filter === 'PENDING_DNS'
                ? 'bg-blue-500/25 border border-blue-400/60'
                : 'bg-white/10 hover:bg-white/15 border border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider font-['Outfit']">
                Aguardando DNS Cliente
              </span>
              <Globe className="w-4 h-4 text-blue-300" />
            </div>
            <div className="text-2xl font-black mt-2 text-white font-['Outfit']">{pendingDnsCount}</div>
            <div className="text-xs text-white/70 mt-1">TXT liberado, aguardando propagação</div>
          </div>

          <div
            onClick={() => setFilter('VERIFIED')}
            className={`p-4 rounded-2xl cursor-pointer transition-all ${
              filter === 'VERIFIED'
                ? 'bg-[#9FE870]/25 border border-[#9FE870]'
                : 'bg-white/10 hover:bg-white/15 border border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#9FE870] uppercase tracking-wider font-['Outfit']">
                Domínios Verificados
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#9FE870]" />
            </div>
            <div className="text-2xl font-black mt-2 text-white font-['Outfit']">{verifiedCount}</div>
            <div className="text-xs text-white/70 mt-1">DNS validado e ativo no Workspace</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868685]" />
          <input
            id="approvals-search-input"
            type="text"
            placeholder="Buscar domínio na central..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F4F5F0] border border-[#E2E6DF] rounded-full text-xs sm:text-sm text-[#0E0F0C] placeholder-[#868685] focus:outline-none focus:border-[#163300] focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {(
            [
              { key: 'PENDING_APPROVAL', label: `Pendentes (${pendingApprovalsCount})` },
              { key: 'PENDING_DNS', label: `Aguardando DNS (${pendingDnsCount})` },
              { key: 'VERIFIED', label: `Verificados (${verifiedCount})` },
              { key: 'ALL', label: 'Todos' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === t.key
                  ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                  : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#E2E6DF]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Domains Table / List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-[#F8F9F5] border-b border-[#E2E6DF] text-[11px] font-bold uppercase tracking-wider text-[#5E605D] font-['Outfit']">
                <th className="py-3.5 px-5 w-[30%]">Domínio do Cliente</th>
                <th className="py-3.5 px-4 w-[20%]">Status no Fluxo</th>
                <th className="py-3.5 px-4 w-[18%]">Registro TXT</th>
                <th className="py-3.5 px-4 w-[14%]">Data Solicitação</th>
                <th className="py-3.5 px-5 w-[18%] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6DF] text-sm">
              {filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-500">
                    <Globe className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Nenhum domínio encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Nenhum domínio corresponde aos filtros selecionados no momento.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDomains.map((domain) => {
                  const isVerified = domain.verified || domain.state === 'VERIFIED';
                  const isPendingDns = !isVerified && domain.state === 'PENDING_DNS';
                  const isPendingApproval = !isVerified && !isPendingDns;
                  const txtToken = !isPendingApproval ? (domain.verificationTxtToken || domain.auditRecord?.token) : undefined;

                  return (
                    <tr key={domain.domainName} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-700'
                                : isPendingDns
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <Globe className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="truncate">{domain.domainName}</span>
                              {domain.isPrimary && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 uppercase shrink-0">
                                  Primário
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {domain.adminNotes ? `Nota: ${domain.adminNotes}` : 'Tenant do cliente'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Verificado & Ativo
                          </span>
                        ) : isPendingDns ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                            Aguardando DNS Cliente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Aguardando Aprovação
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {txtToken ? (
                          <div className="flex items-center gap-1.5 group max-w-[220px]">
                            <span className="font-mono text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md truncate">
                              {txtToken}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(txtToken, `table-${domain.domainName}`)}
                              title="Copiar token TXT"
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0 cursor-pointer"
                            >
                              {copiedKey === `table-${domain.domainName}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : isPendingApproval ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Pendente de inserção
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Não configurado</span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle text-xs text-slate-500">
                        {domain.submittedAt
                          ? new Date(domain.submittedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : domain.auditRecord?.createdAt
                          ? new Date(domain.auditRecord.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recentemente'}
                      </td>

                      <td className="py-4 px-5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {isVerified && onUnverifyDomain && (
                            <button
                              id={`unverify-btn-${domain.domainName}`}
                              onClick={() => setDomainToUnverify(domain)}
                              title="Desverificar este domínio e retornar para fila de aprovação"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer transition-all shadow-xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              Desverificar
                            </button>
                          )}

                          <button
                            id={`approve-btn-${domain.domainName}`}
                            onClick={() => handleOpenApproveModal(domain)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                              isPendingApproval
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {isPendingApproval ? 'Aprovar / Inserir TXT' : 'Gerenciar TXT'}
                          </button>

                          <button
                            id={`check-dns-btn-${domain.domainName}`}
                            onClick={() => handleLiveDnsCheck(domain.domainName)}
                            disabled={isCheckingDns}
                            title="Checar registros DNS públicos em tempo real"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDns ? 'animate-spin' : ''}`} />
                            Verificar DNS
                          </button>

                          <button
                            id={`delete-approval-btn-${domain.domainName}`}
                            onClick={() => handleRequestDelete(domain)}
                            title="Excluir solicitação de domínio"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve / Manage Domain Modal */}
      {selectedDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                    Aprovação de Domínio: {selectedDomain.domainName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Insira o registro TXT de verificação oficial para liberar a configuração ao cliente.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDomain(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registro TXT de Verificação do Google (Obrigatório) *
                </label>
                <div className="relative">
                  <input
                    id="manual-txt-input"
                    type="text"
                    required
                    placeholder="google-site-verification=exemplo-token-google-123456789"
                    value={manualTxtInput}
                    onChange={(e) => setManualTxtInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  {manualTxtInput && (
                    <button
                      type="button"
                      onClick={() => handleCopy(manualTxtInput, 'txt-token-input')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer text-xs flex items-center gap-1"
                    >
                      {copiedKey === 'txt-token-input' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {feedbackMessage && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : feedbackMessage.type === 'error'
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-blue-50 text-blue-900 border border-blue-200'
                  }`}
                >
                  {feedbackMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : feedbackMessage.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <span>{feedbackMessage.text}</span>
                </div>
              )}

              {/* DNS Verification Results Card */}
              {dnsCheckResult && (
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs space-y-3 font-mono">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span>Validação de Domínio</span>
                    <span className={dnsCheckResult.ok ? 'text-emerald-400' : 'text-amber-400'}>
                      {dnsCheckResult.ok ? 'VERIFICADO & ATIVO' : 'VERIFICAÇÃO PENDENTE'}
                    </span>
                  </div>

                  {/* Dual verification status badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      dnsCheckResult.tokenMatched
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-800 text-amber-300'
                    }`}>
                      <div className="flex items-center gap-1.5 font-sans font-semibold text-[11px]">
                        {dnsCheckResult.tokenMatched ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>1. Propagação DNS</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase">
                        {dnsCheckResult.tokenMatched ? 'Propagado' : 'Pendente'}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      dnsCheckResult.adminConsoleActive
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-800 text-amber-300'
                    }`}>
                      <div className="flex items-center gap-1.5 font-sans font-semibold text-[11px]">
                        {dnsCheckResult.adminConsoleActive ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>2. Ativação do Domínio</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase">
                        {dnsCheckResult.adminConsoleActive ? 'Ativo' : 'Aguardando Ativação'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">TXT Encontrados:</div>
                    <div className="bg-slate-800 p-2 rounded-lg mt-1 max-h-24 overflow-y-auto">
                      {dnsCheckResult.foundTxtRecords?.length > 0 ? (
                        dnsCheckResult.foundTxtRecords.map((t: string, idx: number) => (
                          <div key={idx} className="truncate text-slate-200">
                            • {t}
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">Nenhum registro TXT retornado pelo DNS público.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">MX Encontrados:</div>
                    <div className="bg-slate-800 p-2 rounded-lg mt-1 max-h-24 overflow-y-auto">
                      {dnsCheckResult.foundMxRecords?.length > 0 ? (
                        dnsCheckResult.foundMxRecords.map((m: string, idx: number) => (
                          <div key={idx} className="truncate text-slate-200">
                            • {m}
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">Nenhum registro MX retornado.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleRequestDelete(selectedDomain)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all whitespace-nowrap cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir Solicitação
                  </button>

                  {(selectedDomain.verified || selectedDomain.state === 'VERIFIED') && onUnverifyDomain && (
                    <button
                      type="button"
                      onClick={() => setDomainToUnverify(selectedDomain)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      Desverificar Domínio
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handleLiveDnsCheck(selectedDomain.domainName)}
                    disabled={isCheckingDns}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingDns ? (
                      <>
                        <SkooliaTwinOGlyph size="xs" />
                        <span>Testando DNS...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Testar DNS</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDomain(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all whitespace-nowrap cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    id="submit-approval-btn"
                    type="submit"
                    disabled={isSubmittingApproval}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingApproval ? (
                      <>
                        <SkooliaTwinOGlyph size="xs" />
                        <span>Processando Aprovação...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Aprovar e Enviar ao Cliente</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unverify Confirmation Modal */}
      {domainToUnverify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-['Outfit']">
                  Desverificar Domínio?
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {domainToUnverify.domainName}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Ação do Administrador Institucional
              </div>
              <p>
                O domínio <strong>{domainToUnverify.domainName}</strong> perderá o status de <strong>Verificado & Ativo</strong> e retornará para a fila de aprovações pendentes (<em>Aguardando Aprovação</em>).
              </p>
              <p className="text-amber-800 text-[11px]">
                Você poderá cadastrar um novo registro TXT de verificação ou reiniciar os testes de validação DNS a qualquer momento.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDomainToUnverify(null)}
                disabled={isUnverifyingDomain}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                id={`confirm-unverify-domain-${domainToUnverify.domainName}`}
                type="button"
                onClick={handleConfirmUnverifyDomain}
                disabled={isUnverifyingDomain}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <RotateCcw className={`w-4 h-4 ${isUnverifyingDomain ? 'animate-spin' : ''}`} />
                {isUnverifyingDomain ? 'Desverificando...' : 'Confirmar Desverificação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {domainToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-['Outfit']">
                  Excluir Solicitação de Domínio?
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {domainToDelete.domainName}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                Ação do Administrador Institucional
              </div>
              <p>
                A solicitação de cadastro do domínio <strong>{domainToDelete.domainName}</strong> será cancelada e removida permanentemente do painel de aprovações.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDomainToDelete(null)}
                disabled={isDeletingDomain}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                id={`confirm-delete-approval-${domainToDelete.domainName}`}
                type="button"
                onClick={handleConfirmDeleteDomain}
                disabled={isDeletingDomain}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeletingDomain ? 'Excluindo...' : 'Excluir Solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
