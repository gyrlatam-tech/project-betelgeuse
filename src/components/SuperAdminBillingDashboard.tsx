import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Search,
  Mail,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building2,
  Send,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { Tenant } from '../types';

interface GlobalInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'OVERDUE' | 'OPEN' | 'VOID';
  date: string;
  dueDate: string;
  pdfUrl?: string | null;
  hostedInvoiceUrl?: string | null;
  paidAt?: string | null;
  description?: string;
  daysOverdue?: number;
}

interface TenantBillingSummary {
  id: string;
  name: string;
  slug: string;
  primaryContactEmail: string;
  financialContactEmail: string;
  allowedDomains: string[];
  domainsCount: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  mrr: number;
  totalPaid: number;
  overdueCount: number;
  overdueAmount: number;
  paidCount: number;
  nextRenewalDate: string;
  stripeCustomerId?: string | null;
  createdAt: string;
}

interface DashboardMetrics {
  totalRevenue: number;
  mrr: number;
  qrr: number;
  yrr: number;
  arpu: number;
  subscriptions: {
    total: number;
    active: number;
    trial: number;
    pastDue: number;
    suspended: number;
    canceled: number;
  };
  invoices: {
    paidCount: number;
    paidAmount: number;
    overdueCount: number;
    overdueAmount: number;
    pendingCount: number;
    pendingAmount: number;
    voidedCount: number;
  };
  planBreakdown: {
    monthlyCount: number;
    annualCount: number;
    monthlyPriceUsd: number;
    annualPriceUsd: number;
  };
}

interface SuperAdminBillingDashboardProps {
  tenants?: Tenant[];
  onSwitchToMyOrg?: () => void;
}

export const SuperAdminBillingDashboard: React.FC<SuperAdminBillingDashboardProps> = ({
  onSwitchToMyOrg,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [invoices, setInvoices] = useState<GlobalInvoice[]>([]);
  const [tenantsBilling, setTenantsBilling] = useState<TenantBillingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isStripeConnected, setIsStripeConnected] = useState(false);

  // Active Tab: 'INVOICES' | 'SUBSCRIPTIONS' | 'ANALYTICS'
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'SUBSCRIPTIONS' | 'ANALYTICS'>('INVOICES');

  // Invoices Filters
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'OVERDUE' | 'PAID' | 'OPEN'>('ALL');

  // Tenant Filters
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAST_DUE' | 'TRIAL' | 'SUSPENDED'>('ALL');
  const [planCycleFilter, setPlanCycleFilter] = useState<'ALL' | 'MONTHLY' | 'ANNUAL'>('ALL');

  // Action status (sending invoice)
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchDashboardData = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/system-dashboard');
      const data = await res.json();

      if (data.success) {
        setMetrics(data.metrics);
        setInvoices(data.invoices || []);
        setTenantsBilling(data.tenantsBilling || []);
        setIsStripeConnected(!!data.isStripeConnected);
        setLastRefreshed(new Date());
      } else {
        setError(data.error || 'Erro ao carregar dados de faturamento do sistema.');
      }
    } catch (err: any) {
      console.error('Error fetching billing dashboard:', err);
      setError('Falha ao comunicar com o servidor de faturamento.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format currency helpers
  const formatUsd = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const cleanDisplayName = (name?: string | null) => {
    if (!name) return 'Organização';
    const trimmed = name.trim();
    const match = trimmed.match(/^(.*?)\s*\(\s*\1\s*\)$/i);
    if (match) return match[1].trim();
    return trimmed;
  };

  // Resend invoice email action
  const handleResendInvoice = async (inv: GlobalInvoice) => {
    setSendingInvoiceId(inv.id);
    try {
      const res = await fetch('/api/billing/send-invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inv.customerEmail,
          customerName: inv.tenantName,
          invoiceNumber: inv.invoiceNumber,
          invoiceId: inv.id,
          amount: inv.amount,
          currency: inv.currency,
          planName: inv.description || 'Google Workspace Standard Unlimited',
          pdfUrl: inv.pdfUrl,
          hostedInvoiceUrl: inv.hostedInvoiceUrl,
          lang: language,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          language === 'pt'
            ? `Fatura ${inv.invoiceNumber} reenviada com sucesso para ${inv.customerEmail}!`
            : language === 'es'
            ? `¡Factura ${inv.invoiceNumber} reenviada con éxito a ${inv.customerEmail}!`
            : `Invoice ${inv.invoiceNumber} successfully resent to ${inv.customerEmail}!`,
          'success'
        );
      } else {
        showToast(data.error || 'Erro ao reenviar fatura.', 'error');
      }
    } catch (err: any) {
      showToast('Erro de conexão ao reenviar fatura.', 'error');
    } finally {
      setSendingInvoiceId(null);
    }
  };

  // Export CSV of invoices
  const handleExportCsv = () => {
    if (invoices.length === 0) return;

    const headers = ['Numero Fatura', 'Organizacao', 'Email Financeiro', 'Valor USD', 'Status', 'Data Emissao', 'Data Vencimento', 'Dias Atraso'];
    const rows = invoices.map((i) => [
      i.invoiceNumber,
      `"${i.tenantName.replace(/"/g, '""')}"`,
      i.customerEmail,
      i.amount.toFixed(2),
      i.status,
      i.date,
      i.dueDate,
      i.daysOverdue || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_faturas_global_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(
      language === 'pt'
        ? 'Relatório CSV exportado com sucesso!'
        : language === 'es'
        ? '¡Informe CSV exportado con éxito!'
        : 'CSV report exported successfully!',
      'success'
    );
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (invoiceStatusFilter !== 'ALL') {
        if (invoiceStatusFilter === 'OVERDUE' && inv.status !== 'OVERDUE') return false;
        if (invoiceStatusFilter === 'PAID' && inv.status !== 'PAID') return false;
        if (invoiceStatusFilter === 'OPEN' && inv.status !== 'OPEN') return false;
      }

      // Search query
      if (invoiceSearchQuery.trim()) {
        const q = invoiceSearchQuery.toLowerCase();
        const matchesNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesName = inv.tenantName.toLowerCase().includes(q);
        const matchesEmail = inv.customerEmail.toLowerCase().includes(q);
        if (!matchesNum && !matchesName && !matchesEmail) return false;
      }

      return true;
    });
  }, [invoices, invoiceStatusFilter, invoiceSearchQuery]);

  // Filtered Tenants - strictly Workspace Standard Unlimited plans
  const filteredTenants = useMemo(() => {
    return tenantsBilling.filter((tenant) => {
      if (tenantStatusFilter !== 'ALL') {
        if (tenantStatusFilter === 'ACTIVE' && tenant.subscriptionStatus !== 'ACTIVE') return false;
        if (tenantStatusFilter === 'PAST_DUE' && tenant.subscriptionStatus !== 'PAST_DUE') return false;
        if (tenantStatusFilter === 'TRIAL' && tenant.subscriptionStatus !== 'TRIAL') return false;
        if (tenantStatusFilter === 'SUSPENDED' && tenant.status !== 'SUSPENDED') return false;
      }

      if (planCycleFilter !== 'ALL') {
        if (tenant.billingCycle !== planCycleFilter) return false;
      }

      if (tenantSearchQuery.trim()) {
        const q = tenantSearchQuery.toLowerCase();
        const matchesName = tenant.name.toLowerCase().includes(q);
        const matchesEmail = (tenant.primaryContactEmail || '').toLowerCase().includes(q) || (tenant.financialContactEmail || '').toLowerCase().includes(q);
        const matchesDomain = (tenant.allowedDomains || []).some((d) => d.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesDomain) return false;
      }

      return true;
    });
  }, [tenantsBilling, tenantStatusFilter, planCycleFilter, tenantSearchQuery]);

  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-3 border-[#9FE870] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#0E0F0C] font-['Outfit']">
          {language === 'pt'
            ? 'Carregando Dashboard de Faturamento do Sistema...'
            : language === 'es'
            ? 'Cargando Panel de Facturación del Sistema...'
            : 'Loading System Billing Dashboard...'}
        </p>
        <p className="text-xs text-[#5E605D]">
          {language === 'pt'
            ? 'Consolidando métricas e faturas do sistema.'
            : language === 'es'
            ? 'Consolidando métricas y facturas del sistema.'
            : 'Consolidating system metrics and invoices.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-4 ${
            toastMessage.type === 'success'
              ? 'bg-[#163300] text-[#9FE870] border-[#9FE870]/30'
              : 'bg-red-950 text-red-200 border-red-800'
          }`}
        >
          {toastMessage.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-xs font-bold font-['Outfit']">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#E2E6DF] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#163300] text-[#9FE870] font-['Outfit']">
              <ShieldCheck className="w-3.5 h-3.5" />
              {language === 'pt' ? 'Superadmin • Visão Geral' : language === 'es' ? 'Superadmin • Vista General' : 'SuperAdmin • Overview'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#5E605D] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {language === 'pt' ? 'Sincronização Ativa' : language === 'es' ? 'Sincronización Activa' : 'Live Sync Active'}
            </span>
            <span className="text-xs text-[#868685]">
              • {language === 'pt' ? 'Atualizado às' : language === 'es' ? 'Actualizado a las' : 'Updated at'}{' '}
              {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#0E0F0C] tracking-tight font-['Outfit']">
            {language === 'pt'
              ? 'Faturamento e Receita'
              : language === 'es'
              ? 'Facturación e Ingresos'
              : 'Billing & Revenue'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {onSwitchToMyOrg && (
            <button
              onClick={onSwitchToMyOrg}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#D4DACF] hover:bg-[#F4F5F0] text-[#0E0F0C] font-bold text-xs cursor-pointer transition-all shadow-2xs whitespace-nowrap"
              title={language === 'pt' ? 'Ver faturamento da minha instituição' : language === 'es' ? 'Ver facturación de mi institución' : 'View my institution billing'}
            >
              <Building2 className="w-4 h-4 text-[#5E605D]" />
              <span>{language === 'pt' ? 'Minha Organização' : language === 'es' ? 'Mi Organización' : 'My Organization'}</span>
            </button>
          )}

          <button
            onClick={() => fetchDashboardData(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#E2E6DF] hover:border-[#163300] bg-white text-[#0E0F0C] font-bold text-xs cursor-pointer transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 whitespace-nowrap"
            title={language === 'pt' ? 'Sincronizar faturas e dados' : language === 'es' ? 'Sincronizar facturas y datos' : 'Sync invoices and data'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#163300] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? (language === 'pt' ? 'Sincronizando...' : language === 'es' ? 'Sincronizando...' : 'Syncing...') : (language === 'pt' ? 'Sincronizar' : language === 'es' ? 'Sincronizar' : 'Sync')}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#163300] hover:bg-[#204900] text-[#9FE870] font-black text-xs cursor-pointer shadow-xs transition-all active:scale-98 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#9FE870]" />
            <span>{language === 'pt' ? 'Exportar CSV' : language === 'es' ? 'Exportar CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Error Notice if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchDashboardData()} className="underline font-bold cursor-pointer">
            {language === 'pt' ? 'Tentar novamente' : language === 'es' ? 'Reintentar' : 'Retry'}
          </button>
        </div>
      )}

      {/* 4 CORE ESSENTIAL EXECUTIVE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Arrecadado */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E6DF] shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-[#9FE870]/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#5E605D] font-['Outfit']">
              {language === 'pt' ? 'Total Arrecadado' : language === 'es' ? 'Total Recaudado' : 'Total Collected'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E8F7DC] text-[#163300] flex items-center justify-center shadow-2xs">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#0E0F0C] tracking-tight font-['Outfit']">
              {formatUsd(metrics?.totalRevenue)}
            </div>
            <p className="text-[11px] text-[#5E605D] mt-1 font-medium">
              {language === 'pt'
                ? `${metrics?.invoices.paidCount || 0} faturas quitadas`
                : language === 'es'
                ? `${metrics?.invoices.paidCount || 0} facturas pagadas`
                : `${metrics?.invoices.paidCount || 0} paid invoices`}
            </p>
          </div>
        </div>

        {/* 2. MRR (Receita Recorrente Mensal) */}
        <div className="bg-gradient-to-br from-white to-[#F6FAF1] p-5 rounded-3xl border border-[#9FE870]/60 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#163300] font-['Outfit']">
              {language === 'pt' ? 'MRR (Recorrência Mensal)' : language === 'es' ? 'MRR (Mensual)' : 'Monthly Recurring (MRR)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#163300] text-[#9FE870] flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#163300] tracking-tight font-['Outfit']">
              {formatUsd(metrics?.mrr)}
              <span className="text-xs font-bold text-[#5E605D] ml-1">/mês</span>
            </div>
            <p className="text-[11px] text-[#5E605D] mt-1 font-medium flex items-center justify-between">
              <span>
                {language === 'pt'
                  ? `${metrics?.subscriptions.active || 0} assinaturas ativas`
                  : language === 'es'
                  ? `${metrics?.subscriptions.active || 0} suscripciones activas`
                  : `${metrics?.subscriptions.active || 0} active subscriptions`}
              </span>
              <span className="text-[10px] text-[#868685]">
                ARR: {formatUsd(metrics?.yrr)}
              </span>
            </p>
          </div>
        </div>

        {/* 3. Em Aberto (Pendente) */}
        <div
          onClick={() => {
            setActiveTab('INVOICES');
            setInvoiceStatusFilter('OPEN');
          }}
          className="bg-white p-5 rounded-3xl border border-[#E2E6DF] shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden cursor-pointer hover:border-amber-400 hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#5E605D] font-['Outfit']">
              {language === 'pt' ? 'A Receber (Em Aberto)' : language === 'es' ? 'Pendiente por Cobrar' : 'Pending Invoices'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#0E0F0C] tracking-tight font-['Outfit']">
              {formatUsd(metrics?.invoices.pendingAmount)}
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">
              {language === 'pt'
                ? `${metrics?.invoices.pendingCount || 0} faturas em aberto`
                : language === 'es'
                ? `${metrics?.invoices.pendingCount || 0} facturas pendientes`
                : `${metrics?.invoices.pendingCount || 0} pending invoices`}
            </p>
          </div>
        </div>

        {/* 4. Inadimplência (Em Atraso) */}
        <div
          onClick={() => {
            setActiveTab('INVOICES');
            setInvoiceStatusFilter('OVERDUE');
          }}
          className={`p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] ${
            (metrics?.invoices.overdueCount || 0) > 0
              ? 'bg-red-50/70 border-red-300 hover:border-red-400'
              : 'bg-white border-[#E2E6DF]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black uppercase tracking-wider font-['Outfit'] ${
              (metrics?.invoices.overdueCount || 0) > 0 ? 'text-red-800' : 'text-[#5E605D]'
            }`}>
              {language === 'pt' ? 'Inadimplência' : language === 'es' ? 'Facturas Vencidas' : 'Overdue Invoices'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs ${
              (metrics?.invoices.overdueCount || 0) > 0 ? 'bg-red-200 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {(metrics?.invoices.overdueCount || 0) > 0 ? <AlertTriangle className="w-4 h-4 stroke-[2.5]" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight font-['Outfit'] ${
              (metrics?.invoices.overdueCount || 0) > 0 ? 'text-red-700' : 'text-[#0E0F0C]'
            }`}>
              {formatUsd(metrics?.invoices.overdueAmount)}
            </div>
            <p className={`text-[11px] mt-1 font-medium ${
              (metrics?.invoices.overdueCount || 0) > 0 ? 'text-red-700 font-bold' : 'text-emerald-700'
            }`}>
              {(metrics?.invoices.overdueCount || 0) > 0
                ? (language === 'pt'
                    ? `${metrics?.invoices.overdueCount} em atraso • Ver detalhes`
                    : language === 'es'
                    ? `${metrics?.invoices.overdueCount} vencidas • Ver detalles`
                    : `${metrics?.invoices.overdueCount} overdue • View details`)
                : (language === 'pt' ? 'Nenhuma fatura em atraso' : language === 'es' ? 'Cero facturas vencidas' : 'No overdue invoices')}
            </p>
          </div>
        </div>
      </div>

      {/* DASHBOARD TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[#E2E6DF] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'INVOICES'
              ? 'bg-[#163300] text-[#9FE870] shadow-xs'
              : 'text-[#5E605D] hover:text-[#0E0F0C] hover:bg-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{language === 'pt' ? 'Faturas do Sistema' : language === 'es' ? 'Facturas del Sistema' : 'System Invoices'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'INVOICES' ? 'bg-[#9FE870] text-[#163300]' : 'bg-[#E2E6DF] text-[#0E0F0C]'
          }`}>
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SUBSCRIPTIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SUBSCRIPTIONS'
              ? 'bg-[#163300] text-[#9FE870] shadow-xs'
              : 'text-[#5E605D] hover:text-[#0E0F0C] hover:bg-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{language === 'pt' ? 'Assinaturas & Organizações' : language === 'es' ? 'Suscripciones y Organizaciones' : 'Tenants & Subscriptions'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'SUBSCRIPTIONS' ? 'bg-[#9FE870] text-[#163300]' : 'bg-[#E2E6DF] text-[#0E0F0C]'
          }`}>
            {tenantsBilling.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ANALYTICS'
              ? 'bg-[#163300] text-[#9FE870] shadow-xs'
              : 'text-[#5E605D] hover:text-[#0E0F0C] hover:bg-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'pt' ? 'Projeções & Saúde Financeira' : language === 'es' ? 'Proyecciones y Salud Financiera' : 'Projections & Analytics'}</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM INVOICES */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#E2E6DF] shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868685]" />
              <input
                type="text"
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                placeholder={
                  language === 'pt'
                    ? 'Buscar por número de fatura, organização ou e-mail...'
                    : language === 'es'
                    ? 'Buscar por número de factura, organización o correo...'
                    : 'Search by invoice number, tenant, or email...'
                }
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#F4F5F0] border border-[#E2E6DF] rounded-full focus:outline-none focus:border-[#163300] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'OVERDUE', 'PAID', 'OPEN'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setInvoiceStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold font-['Outfit'] transition-all cursor-pointer whitespace-nowrap ${
                    invoiceStatusFilter === st
                      ? 'bg-[#163300] text-[#9FE870]'
                      : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C]'
                  }`}
                >
                  {st === 'ALL' && (language === 'pt' ? 'Todas' : language === 'es' ? 'Todas' : 'All')}
                  {st === 'OVERDUE' && (
                    <span className="flex items-center gap-1 text-red-600 font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      {language === 'pt' ? 'Em Atraso' : language === 'es' ? 'Vencidas' : 'Overdue'}
                    </span>
                  )}
                  {st === 'PAID' && (language === 'pt' ? 'Pagas' : language === 'es' ? 'Pagadas' : 'Paid')}
                  {st === 'OPEN' && (language === 'pt' ? 'Em Aberto' : language === 'es' ? 'Abiertas' : 'Pending')}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-3xl border border-[#E2E6DF] shadow-xs overflow-hidden">
            {filteredInvoices.length === 0 ? (
              <div className="py-16 text-center text-[#5E605D] space-y-2">
                <FileText className="w-10 h-10 mx-auto text-[#CBD3C5]" />
                <p className="font-bold text-sm text-[#0E0F0C] font-['Outfit']">
                  {language === 'pt' ? 'Nenhuma fatura encontrada' : language === 'es' ? 'Ninguna factura encontrada' : 'No invoices found'}
                </p>
                <p className="text-xs">
                  {language === 'pt'
                    ? 'Tente alterar os termos da busca ou limpar os filtros de status.'
                    : language === 'es'
                    ? 'Intente cambiar los términos de búsqueda o limpiar los filtros.'
                    : 'Try adjusting your search terms or clearing status filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E6DF] bg-[#F9FAF8] text-[11px] font-black uppercase tracking-wider text-[#5E605D] font-['Outfit']">
                      <th className="py-3.5 px-5">{language === 'pt' ? 'Fatura' : language === 'es' ? 'Factura' : 'Invoice'}</th>
                      <th className="py-3.5 px-5">{language === 'pt' ? 'Organização / Cliente' : language === 'es' ? 'Organización / Cliente' : 'Organization'}</th>
                      <th className="py-3.5 px-5">{language === 'pt' ? 'Status' : language === 'es' ? 'Estado' : 'Status'}</th>
                      <th className="py-3.5 px-5">{language === 'pt' ? 'Vencimento' : language === 'es' ? 'Vencimiento' : 'Due Date'}</th>
                      <th className="py-3.5 px-5">{language === 'pt' ? 'Valor' : language === 'es' ? 'Valor' : 'Amount'}</th>
                      <th className="py-3.5 px-5 text-right">{language === 'pt' ? 'Ações & Recibo' : language === 'es' ? 'Acciones y Recibo' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E6DF] text-xs">
                    {filteredInvoices.map((inv) => {
                      const isOverdue = inv.status === 'OVERDUE';
                      const isPaid = inv.status === 'PAID';
                      const isOpen = inv.status === 'OPEN';

                      return (
                        <tr key={inv.id} className="hover:bg-[#F9FAF8] transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-mono font-bold text-[#0E0F0C]">{inv.invoiceNumber}</div>
                            <div className="text-[11px] text-[#868685]">{formatDate(inv.date)}</div>
                          </td>

                          <td className="py-4 px-5">
                            <div className="font-bold text-[#0E0F0C]">{cleanDisplayName(inv.tenantName)}</div>
                            <div className="text-[11px] text-[#5E605D]">{inv.customerEmail}</div>
                          </td>

                          <td className="py-4 px-5">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 font-['Outfit']">
                                <CheckCircle2 className="w-3 h-3" />
                                {language === 'pt' ? 'Paga' : language === 'es' ? 'Pagada' : 'Paid'}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 font-['Outfit'] animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                {language === 'pt' ? `Overdue (${inv.daysOverdue || 1}d)` : language === 'es' ? `Vencida (${inv.daysOverdue || 1}d)` : `Overdue (${inv.daysOverdue || 1}d)`}
                              </span>
                            )}
                            {isOpen && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 font-['Outfit']">
                                <Clock className="w-3 h-3" />
                                {language === 'pt' ? 'Em Aberto' : language === 'es' ? 'Abierta' : 'Open'}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-5">
                            <span className={`font-medium ${isOverdue ? 'text-red-700 font-bold' : 'text-[#0E0F0C]'}`}>
                              {formatDate(inv.dueDate)}
                            </span>
                          </td>

                          <td className="py-4 px-5">
                            <span className="font-bold text-[#0E0F0C] font-['Outfit'] text-sm">
                              {formatUsd(inv.amount)}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Resend Email Button */}
                              <button
                                onClick={() => handleResendInvoice(inv)}
                                disabled={sendingInvoiceId === inv.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#D4DACF] hover:bg-[#F4F5F0] text-[#0E0F0C] font-bold text-[11px] cursor-pointer transition-all shadow-2xs whitespace-nowrap"
                                title={language === 'pt' ? 'Reenviar fatura por e-mail' : language === 'es' ? 'Reenviar factura por correo' : 'Resend invoice by email'}
                              >
                                <Send className={`w-3 h-3 text-[#163300] ${sendingInvoiceId === inv.id ? 'animate-spin' : ''}`} />
                                <span>{sendingInvoiceId === inv.id ? 'Enviando...' : (language === 'pt' ? 'Reenviar' : language === 'es' ? 'Reenviar' : 'Resend')}</span>
                              </button>

                              {/* PDF Receipt Link */}
                              {(inv.pdfUrl || inv.hostedInvoiceUrl) && (
                                <a
                                  href={inv.pdfUrl || inv.hostedInvoiceUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E8F7DC] hover:bg-[#D9F2C7] text-[#163300] font-black text-[11px] transition-all shadow-2xs whitespace-nowrap"
                                >
                                  <span>{language === 'pt' ? 'Recibo' : language === 'es' ? 'Recibo' : 'Receipt'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TENANTS & SUBSCRIPTIONS */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#E2E6DF] shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868685]" />
              <input
                type="text"
                value={tenantSearchQuery}
                onChange={(e) => setTenantSearchQuery(e.target.value)}
                placeholder={
                  language === 'pt'
                    ? 'Buscar organização por nome, e-mail ou domínio...'
                    : language === 'es'
                    ? 'Buscar organización por nombre, correo o dominio...'
                    : 'Search organization by name, email, or domain...'
                }
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#F4F5F0] border border-[#E2E6DF] rounded-full focus:outline-none focus:border-[#163300] transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Plan Cycle Filter */}
              <div className="flex items-center gap-1 bg-[#F4F5F0] p-1 rounded-full border border-[#E2E6DF]">
                {(['ALL', 'MONTHLY', 'ANNUAL'] as const).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setPlanCycleFilter(cycle)}
                    className={`px-3 py-1 rounded-full text-xs font-bold font-['Outfit'] transition-all cursor-pointer whitespace-nowrap ${
                      planCycleFilter === cycle
                        ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                        : 'text-[#5E605D] hover:text-[#0E0F0C]'
                    }`}
                  >
                    {cycle === 'ALL' && (language === 'pt' ? 'Todos os Ciclos' : language === 'es' ? 'Todos los Ciclos' : 'All Cycles')}
                    {cycle === 'MONTHLY' && (language === 'pt' ? 'Mensal ($ 199,99)' : language === 'es' ? 'Mensual ($ 199,99)' : 'Monthly ($199.99)')}
                    {cycle === 'ANNUAL' && (language === 'pt' ? 'Anual ($ 1.999,99)' : language === 'es' ? 'Anual ($ 1.999,99)' : 'Annual ($1,999.99)')}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'ACTIVE', 'PAST_DUE', 'TRIAL', 'SUSPENDED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTenantStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold font-['Outfit'] transition-all cursor-pointer whitespace-nowrap ${
                      tenantStatusFilter === st
                        ? 'bg-[#163300] text-[#9FE870]'
                        : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C]'
                    }`}
                  >
                    {st === 'ALL' && (language === 'pt' ? 'Todas' : language === 'es' ? 'Todas' : 'All')}
                    {st === 'ACTIVE' && (language === 'pt' ? 'Ativas' : language === 'es' ? 'Activas' : 'Active')}
                    {st === 'PAST_DUE' && (
                      <span className="text-red-600 font-black">
                        {language === 'pt' ? 'Inadimplentes' : language === 'es' ? 'Impagadas' : 'Past Due'}
                      </span>
                    )}
                    {st === 'TRIAL' && (language === 'pt' ? 'Em Avaliação' : language === 'es' ? 'En Prueba' : 'In Trial')}
                    {st === 'SUSPENDED' && (language === 'pt' ? 'Suspensas' : language === 'es' ? 'Suspendidas' : 'Suspended')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white rounded-3xl border border-[#E2E6DF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E6DF] bg-[#F9FAF8] text-[11px] font-black uppercase tracking-wider text-[#5E605D] font-['Outfit']">
                    <th className="py-3.5 px-5">{language === 'pt' ? 'Organização' : language === 'es' ? 'Organización' : 'Organization'}</th>
                    <th className="py-3.5 px-5">{language === 'pt' ? 'Plano / Ciclo' : language === 'es' ? 'Plan / Ciclo' : 'Plan / Cycle'}</th>
                    <th className="py-3.5 px-5">{language === 'pt' ? 'Status' : language === 'es' ? 'Estado' : 'Status'}</th>
                    <th className="py-3.5 px-5">{language === 'pt' ? 'MRR Contratado' : language === 'es' ? 'MRR Contratado' : 'MRR'}</th>
                    <th className="py-3.5 px-5">{language === 'pt' ? 'Total Pago' : language === 'es' ? 'Total Pagado' : 'Lifetime Paid'}</th>
                    <th className="py-3.5 px-5">{language === 'pt' ? 'Próxima Renovação' : language === 'es' ? 'Próxima Renovación' : 'Renewal Date'}</th>
                    <th className="py-3.5 px-5 text-right">{language === 'pt' ? 'Faturas' : language === 'es' ? 'Facturas' : 'Invoices'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6DF] text-xs">
                  {filteredTenants.map((t) => {
                    const isPastDue = t.subscriptionStatus === 'PAST_DUE';
                    const isSuspended = t.status === 'SUSPENDED';

                    return (
                      <tr key={t.id} className="hover:bg-[#F9FAF8] transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-[#0E0F0C]">{t.name}</div>
                          <div className="text-[11px] text-[#5E605D]">{t.financialContactEmail || t.primaryContactEmail}</div>
                          {t.allowedDomains.length > 0 && (
                            <div className="text-[10px] text-[#868685] mt-0.5 font-mono">{t.allowedDomains.join(', ')}</div>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <div className="font-bold text-[#0E0F0C]">Workspace Standard Unlimited</div>
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-[#F4F5F0] text-[#5E605D] font-mono mt-0.5">
                            {t.billingCycle === 'ANNUAL'
                              ? (language === 'pt' ? 'Ciclo Anual ($ 1.999,99)' : language === 'es' ? 'Ciclo Anual ($ 1.999,99)' : 'Annual Cycle ($1,999.99)')
                              : (language === 'pt' ? 'Ciclo Mensal ($ 199,99)' : language === 'es' ? 'Ciclo Mensal ($ 199,99)' : 'Monthly Cycle ($199.99)')}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          {t.subscriptionStatus === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 font-['Outfit']">
                              <CheckCircle2 className="w-3 h-3" />
                              {language === 'pt' ? 'Ativa' : language === 'es' ? 'Activa' : 'Active'}
                            </span>
                          )}
                          {isPastDue && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 font-['Outfit'] animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              {language === 'pt' ? 'Inadimplente' : language === 'es' ? 'Impagada' : 'Past Due'}
                            </span>
                          )}
                          {t.subscriptionStatus === 'TRIAL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300 font-['Outfit']">
                              <Clock className="w-3 h-3" />
                              {language === 'pt' ? 'Trial' : language === 'es' ? 'Trial' : 'Trial'}
                            </span>
                          )}
                          {isSuspended && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-zinc-200 text-zinc-800 border border-zinc-300 font-['Outfit']">
                              {language === 'pt' ? 'Suspensa' : language === 'es' ? 'Suspendida' : 'Suspended'}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <span className="font-bold text-[#163300] font-['Outfit'] text-sm">
                            {formatUsd(t.mrr)}
                          </span>
                          <span className="text-[10px] text-[#5E605D]"> /mês</span>
                        </td>

                        <td className="py-4 px-5">
                          <span className="font-medium text-[#0E0F0C] font-['Outfit']">
                            {formatUsd(t.totalPaid)}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span className="text-[#0E0F0C] font-medium">
                            {formatDate(t.nextRenewalDate)}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-emerald-700">
                              {t.paidCount} {language === 'pt' ? 'pagas' : language === 'es' ? 'pagadas' : 'paid'}
                            </span>
                            {t.overdueCount > 0 && (
                              <span className="text-[11px] font-black text-red-600">
                                {t.overdueCount} {language === 'pt' ? 'overdue' : language === 'es' ? 'vencidas' : 'overdue'} ({formatUsd(t.overdueAmount)})
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECTIONS & ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Run-Rate Overview */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E6DF] shadow-xs space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#163300]" />
              <h3 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                {language === 'pt' ? 'Projeções Financeiras Recorrentes' : language === 'es' ? 'Proyecciones Financieras Recurrentes' : 'Recurring Revenue Projections'}
              </h3>
            </div>
            <p className="text-xs text-[#5E605D] leading-relaxed">
              {language === 'pt'
                ? 'Estimativas calculadas com base nas assinaturas oficiais ativas e contratos corporativos vigentes.'
                : language === 'es'
                ? 'Estimaciones calculadas en base a suscripciones oficiales activas y contratos vigentes.'
                : 'Estimations calculated based on active platform subscriptions and contracted corporate terms.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#5E605D] font-['Outfit']">MRR</span>
                <div className="text-xl font-black text-[#0E0F0C] font-['Outfit']">{formatUsd(metrics?.mrr)}</div>
                <p className="text-[11px] text-[#5E605D]">Receita mensal consolidada</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#5E605D] font-['Outfit']">QRR (Trimestre)</span>
                <div className="text-xl font-black text-[#0E0F0C] font-['Outfit']">{formatUsd(metrics?.qrr)}</div>
                <p className="text-[11px] text-[#5E605D]">Run-rate dos próximos 3 meses</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#E8F7DC] border border-[#9FE870]/60 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#163300] font-['Outfit']">YRR / ARR (Ano)</span>
                <div className="text-xl font-black text-[#163300] font-['Outfit']">{formatUsd(metrics?.yrr)}</div>
                <p className="text-[11px] text-[#163300]">Projeção anualizada (12 meses)</p>
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="pt-4 border-t border-[#E2E6DF] space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0E0F0C] font-['Outfit']">
                {language === 'pt' ? 'Distribuição por Ciclo de Cobrança' : language === 'es' ? 'Distribución por Ciclo de Cobro' : 'Billing Cycle Distribution'}
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#0E0F0C]">
                  <span>{language === 'pt' ? 'Planos Mensais ($ 199,99/mês)' : language === 'es' ? 'Planes Mensuales ($ 199,99/mes)' : 'Monthly Plans ($199.99/mo)'}</span>
                  <span>{metrics?.planBreakdown.monthlyCount || 0} {language === 'pt' ? 'organizações' : language === 'es' ? 'organizaciones' : 'orgs'}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#E2E6DF] overflow-hidden">
                  <div
                    className="h-full bg-[#163300] rounded-full"
                    style={{
                      width: `${
                        ((metrics?.planBreakdown.monthlyCount || 0) /
                          ((metrics?.planBreakdown.monthlyCount || 1) + (metrics?.planBreakdown.annualCount || 0))) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-[#0E0F0C] pt-2">
                  <span>{language === 'pt' ? 'Planos Anuais ($ 1.999,99/ano • 17% OFF)' : language === 'es' ? 'Planes Anuales ($ 1.999,99/año • 17% OFF)' : 'Annual Plans ($1,999.99/yr • 17% OFF)'}</span>
                  <span>{metrics?.planBreakdown.annualCount || 0} {language === 'pt' ? 'organizações' : language === 'es' ? 'organizaciones' : 'orgs'}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#E2E6DF] overflow-hidden">
                  <div
                    className="h-full bg-[#9FE870] rounded-full"
                    style={{
                      width: `${
                        ((metrics?.planBreakdown.annualCount || 0) /
                          ((metrics?.planBreakdown.monthlyCount || 0) + (metrics?.planBreakdown.annualCount || 1))) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ARPU & Platform Health Metrics */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E6DF] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#163300]" />
              <h3 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                {language === 'pt' ? 'Métricas de Saúde' : language === 'es' ? 'Métricas de Salud' : 'Health & Retention'}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F9FAF8] border border-[#E2E6DF] space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#5E605D] font-['Outfit']">ARPU</span>
                <div className="text-2xl font-black text-[#0E0F0C] font-['Outfit']">
                  {formatUsd(metrics?.arpu)}
                  <span className="text-xs font-bold text-[#5E605D] ml-1">/mês</span>
                </div>
                <p className="text-[11px] text-[#5E605D]">
                  {language === 'pt' ? 'Receita Média por Instituição Ativa' : language === 'es' ? 'Ingreso Promedio por Institución Activa' : 'Average Revenue Per Account'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 font-['Outfit']">Taxa de Adimplência</span>
                <div className="text-2xl font-black text-emerald-800 font-['Outfit']">
                  {metrics?.invoices.paidCount && metrics?.invoices.overdueCount !== undefined
                    ? `${(
                        (metrics.invoices.paidCount / (metrics.invoices.paidCount + metrics.invoices.overdueCount || 1)) *
                        100
                      ).toFixed(1)}%`
                    : '100%'}
                </div>
                <p className="text-[11px] text-emerald-700">Faturas pagas vs faturas em atraso</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F9FAF8] border border-[#E2E6DF] space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#5E605D] font-['Outfit']">Instituições em Trial</span>
                <div className="text-2xl font-black text-[#0E0F0C] font-['Outfit']">
                  {metrics?.subscriptions.trial || 0}
                </div>
                <p className="text-[11px] text-[#5E605D]">Oportunidade de conversão nos próximos 30 dias</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
