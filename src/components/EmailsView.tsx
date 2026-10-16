import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mail,
  Send,
  Eye,
  Code,
  Smartphone,
  Monitor,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Save,
  Search,
  Filter,
  ExternalLink,
  Info,
  Shield,
  Layers,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import type { EmailTemplate, EmailTemplateType, EmailLogEntry, EmailServiceStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ConfirmationModal } from './ConfirmationModal';

interface EmailsViewProps {
  currentUserEmail?: string;
  isSuperAdmin?: boolean;
}

export const EmailsView: React.FC<EmailsViewProps> = ({
  currentUserEmail = 'gyrlatam@gmail.com',
  isSuperAdmin = true,
}) => {
  const { t, language } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'logs'>('editor');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl_account_created');
  const [status, setStatus] = useState<EmailServiceStatus | null>(null);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [testEmailAddress, setTestEmailAddress] = useState<string>(currentUserEmail);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'visual' | 'code'>('visual');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State for currently selected template
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});
  // Sample variables state for real-time preview customizer
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [showVariablesPanel, setShowVariablesPanel] = useState<boolean>(false);

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0] || null;
  }, [templates, selectedTemplateId]);

  // Load Templates & Logs on mount or when language changes
  useEffect(() => {
    fetchTemplatesAndStatus();
  }, [language]);

  // When active template changes, sync form data and sample variables
  useEffect(() => {
    if (activeTemplate) {
      setFormData({
        subject: activeTemplate.subject,
        preheader: activeTemplate.preheader,
        badgeText: activeTemplate.badgeText,
        badgeColor: activeTemplate.badgeColor || '#00c868',
        title: activeTemplate.title,
        bodyHtml: activeTemplate.bodyHtml,
        ctaText: activeTemplate.ctaText,
        ctaUrl: activeTemplate.ctaUrl,
        footerNote: activeTemplate.footerNote,
      });

      const initialVars: Record<string, string> = {};
      activeTemplate.supportedVariables?.forEach((v) => {
        initialVars[v.key] = v.sampleValue;
      });
      setCustomVariables(initialVars);
    }
  }, [activeTemplate]);

  const fetchTemplatesAndStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/emails/templates?lang=${encodeURIComponent(language)}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        setStatus(data.status || null);
        if (data.templates && data.templates.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(data.templates[0].id);
        }
      }

      // Also fetch logs
      const logsRes = await fetch('/api/emails/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (err: any) {
      console.error('Failed fetching email templates:', err);
      showNotification('error', t('emails.notifications.loadError') || 'Erro ao carregar modelos de e-mail.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSaveTemplate = async () => {
    if (!activeTemplate) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/emails/templates/${activeTemplate.id}?lang=${encodeURIComponent(language)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
        },
        body: JSON.stringify({
          ...formData,
          preferredLanguage: language,
          lang: language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === activeTemplate.id ? { ...t, ...data.template, isCustomized: true } : t))
        );
        showNotification(
          'success',
          t('emails.notifications.saveSuccess', { name: activeTemplate.name }) || `Modelo "${activeTemplate.name}" atualizado com sucesso!`
        );
      } else {
        const errData = await res.json();
        throw new Error(errData.error || t('emails.notifications.saveError') || 'Erro ao salvar alterações.');
      }
    } catch (err: any) {
      showNotification('error', err.message || t('emails.notifications.saveError') || 'Falha ao salvar modelo.');
    } finally {
      setSaving(false);
    }
  };

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleResetToDefault = () => {
    if (!activeTemplate) return;
    setIsResetConfirmOpen(true);
  };

  const handleExecuteResetToDefault = async () => {
    if (!activeTemplate) return;
    setIsResetConfirmOpen(false);

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/emails/templates/${activeTemplate.id}/reset?lang=${encodeURIComponent(language)}`, {
        method: 'POST',
        headers: {
          'x-app-language': language,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === activeTemplate.id ? { ...t, ...data.template, isCustomized: false } : t))
        );
        setFormData({
          subject: data.template.subject,
          preheader: data.template.preheader,
          badgeText: data.template.badgeText,
          badgeColor: data.template.badgeColor,
          title: data.template.title,
          bodyHtml: data.template.bodyHtml,
          ctaText: data.template.ctaText,
          ctaUrl: data.template.ctaUrl,
          footerNote: data.template.footerNote,
        });
        showNotification('success', t('emails.notifications.restoreSuccess') || 'Modelo restaurado para o padrão com sucesso!');
      }
    } catch (err: any) {
      showNotification('error', t('emails.notifications.restoreError') || 'Falha ao restaurar modelo padrão.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!activeTemplate || !testEmailAddress) {
      showNotification('error', t('emails.notifications.testEmailRequired') || 'Informe um endereço de e-mail válido para envio de teste.');
      return;
    }

    try {
      setSendingTest(true);
      const res = await fetch('/api/admin/emails/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
        },
        body: JSON.stringify({
          templateId: activeTemplate.id,
          toEmail: testEmailAddress.trim(),
          customVariables,
          preferredLanguage: language,
          lang: language,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(
          'success',
          t('emails.notifications.testSuccess', { email: testEmailAddress }) ||
            `E-mail de teste disparado com sucesso para ${testEmailAddress}!`
        );
        // Refresh logs
        const logsRes = await fetch('/api/emails/logs');
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData.logs || []);
        }
      } else {
        throw new Error(data.error || t('emails.notifications.testError') || 'Falha ao disparar e-mail de teste.');
      }
    } catch (err: any) {
      showNotification('error', err.message || t('emails.notifications.testError') || 'Erro ao enviar e-mail de teste.');
    } finally {
      setSendingTest(false);
    }
  };

  // Real-time rendered HTML for preview
  const renderedPreview = useMemo(() => {
    if (!activeTemplate) return { html: '', subject: '', plainText: '' };

    const subject = (formData.subject || activeTemplate.subject || '').replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_, k) => customVariables[k] ?? `{{${k}}}`
    );
    const preheader = (formData.preheader || activeTemplate.preheader || '').replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_, k) => customVariables[k] ?? `{{${k}}}`
    );
    const title = (formData.title || activeTemplate.title || '').replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_, k) => customVariables[k] ?? `{{${k}}}`
    );
    const badgeText = (formData.badgeText || activeTemplate.badgeText || '').replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_, k) => customVariables[k] ?? `{{${k}}}`
    );
    const badgeColor = formData.badgeColor || activeTemplate.badgeColor || '#00c868';
    const bodyContent = (formData.bodyHtml || activeTemplate.bodyHtml || '').replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_, k) => customVariables[k] ?? `{{${k}}}`
    );
    const ctaText = (formData.ctaText || activeTemplate.ctaText || '').replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_, k) => customVariables[k] ?? `{{${k}}}`
    );
    let ctaUrl = (formData.ctaUrl || activeTemplate.ctaUrl || '').replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_, k) => customVariables[k] ?? `{{${k}}}`
    );
    if (ctaUrl && /skoolia\.com/i.test(ctaUrl)) {
      try {
        if (ctaUrl.startsWith('http://') || ctaUrl.startsWith('https://')) {
          const parsed = new URL(ctaUrl);
          ctaUrl = `https://skoolia.net/login${parsed.search || ''}${parsed.hash || ''}`;
        } else {
          const qIdx = ctaUrl.indexOf('?');
          ctaUrl = `https://skoolia.net/login${qIdx !== -1 ? ctaUrl.slice(qIdx) : ''}`;
        }
      } catch (_) {
        ctaUrl = 'https://skoolia.net/login';
      }
    }
    const footerNote = (formData.footerNote || activeTemplate.footerNote || '').replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_, k) => customVariables[k] ?? `{{${k}}}`
    );

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F4F5F0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0E0F0C;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F4F5F0;
      padding: 32px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      border: 1px solid #E2E6DF;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .header {
      background-color: #ffffff;
      padding: 28px 32px 18px 32px;
      border-bottom: 1px solid #F0F2EB;
    }
    .brand-text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.6px;
      color: #163300;
      text-decoration: none;
      display: inline-block;
    }
    .partner-pill {
      font-size: 11px;
      font-weight: 700;
      color: #5E605D;
      background-color: #F4F5F0;
      padding: 4px 10px;
      border-radius: 9999px;
      display: inline-block;
      letter-spacing: 0.2px;
    }
    .badge {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
    }
    .content {
      padding: 32px;
      line-height: 1.65;
      font-size: 15px;
      color: #4A4D48;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #0E0F0C;
      margin: 0 0 16px 0;
      letter-spacing: -0.4px;
      line-height: 1.3;
    }
    .info-box {
      background-color: #F8F9F5;
      border: 1px solid #E2E6DF;
      border-radius: 14px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #EAECE6;
      font-size: 14px;
    }
    .info-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-item:first-child {
      padding-top: 0;
    }
    .info-label {
      color: #5E605D;
      font-weight: 600;
    }
    .info-value {
      color: #0E0F0C;
      font-weight: 700;
      text-align: right;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0 14px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #00c868;
      color: #ffffff !important;
      font-weight: 800;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 9999px;
      box-shadow: 0 2px 8px rgba(0, 200, 104, 0.3);
    }
    .token-box {
      background-color: #0E0F0C;
      color: #00c868;
      padding: 14px 18px;
      border-radius: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      word-break: break-all;
      margin: 16px 0;
      border: 1px solid #232522;
    }
    .footer {
      background-color: #FAFAF7;
      padding: 24px 32px;
      border-top: 1px solid #F0F2EB;
      text-align: center;
      font-size: 12px;
      color: #868685;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td class="header">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    <span class="brand-text">skoolia</span>
                  </td>
                  <td align="right">
                    <span class="partner-pill">Google Partner</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="content">
              ${
                badgeText
                  ? `<div class="badge" style="background-color: ${badgeColor}18; color: ${badgeColor === '#00c868' ? '#008a46' : badgeColor}; border: 1px solid ${badgeColor}35;">${badgeText}</div>`
                  : ''
              }
              <h1 class="title">${title}</h1>
              ${bodyContent}
              ${
                ctaText && ctaUrl
                  ? `
                <div class="cta-container">
                  <a href="${ctaUrl}" target="_blank" class="cta-button">
                    ${ctaText}
                  </a>
                </div>
              `
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #5E605D;">${footerNote}</p>
              <div style="margin: 12px 0; padding-top: 12px; border-top: 1px solid #E2E6DF; color: #4B4D49; font-size: 11px; line-height: 1.6;">
                <strong style="color: #0E0F0C; font-size: 11.5px;">InternetByMOL LLC</strong><br>
                3101 North Central Avenue<br>
                Phoenix, 85012<br>
                ${language === 'en' ? 'United States' : 'Estados Unidos'}<br>
                <span style="color: #868685;">Email:</span> <a href="mailto:help@skoolia.net" style="color: #008a46; text-decoration: none; font-weight: 600;">help@skoolia.net</a>
              </div>
              <p style="margin: 8px 0 0 0; color: #868685; font-size: 11px;">© ${new Date().getFullYear()} InternetByMOL LLC. ${
                language === 'pt' ? 'Todos os direitos reservados.' : language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'
              }</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return { html: fullHtml, subject, plainText: bodyContent.replace(/<[^>]*>?/gm, '') };
  }, [activeTemplate, formData, customVariables, language]);

  const insertVariable = (key: string, targetField: 'subject' | 'bodyHtml' | 'title' = 'bodyHtml') => {
    const placeholder = `{{${key}}}`;
    setFormData((prev) => {
      const currentVal = prev[targetField] || '';
      return {
        ...prev,
        [targetField]: currentVal + placeholder,
      };
    });
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const categoryFilterOptions = useMemo(() => [
    { key: 'all', label: t('emails.categories.all') || 'Todos', alts: ['all', 'todos'] },
    { key: 'Onboarding', label: t('emails.categories.onboarding') || 'Onboarding', alts: ['onboarding'] },
    { key: 'Domínios', label: t('emails.categories.domains') || 'Domínios', alts: ['domains', 'dominios', 'domínios'] },
    { key: 'Segurança', label: t('emails.categories.security') || 'Segurança', alts: ['security', 'seguridad', 'segurança', 'seguranca'] },
    { key: 'Faturamento', label: t('emails.categories.billing') || 'Faturamento', alts: ['billing', 'facturación', 'facturacion', 'faturamento'] },
    { key: 'Administração', label: t('emails.categories.administration') || 'Administração', alts: ['administration', 'administración', 'administracion', 'administração', 'administracao'] },
    { key: 'Suporte', label: t('emails.categories.support') || 'Suporte', alts: ['support', 'soporte', 'suporte'] },
  ], [t]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (categoryFilter === 'all') return matchSearch;

      const opt = categoryFilterOptions.find((c) => c.key === categoryFilter);
      const catLower = (t.category || '').toLowerCase();
      const matchCategory =
        catLower === categoryFilter.toLowerCase() ||
        (opt?.alts?.some((alt) => alt.toLowerCase() === catLower) ?? false);

      return matchSearch && matchCategory;
    });
  }, [templates, searchTerm, categoryFilter, categoryFilterOptions]);

  return (
    <div id="emails-admin-view" className="space-y-4 sm:space-y-6 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all transform animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-[#163300] text-[#9FE870] border border-[#9FE870]/30'
              : 'bg-red-950 text-red-200 border border-red-800'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#9FE870]" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner / Breadcrumb & Status */}
      <div className="bg-white border border-[#E2E6DF] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#008a46]">
            <Shield className="w-4 h-4" />
            <span>{t('emails.badge') || 'Administrador Institucional • Gestão de Comunicações'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0E0F0C] tracking-tight font-['Outfit']">
            {t('emails.title') || 'Modelos de E-mail Transacionais'}
          </h1>
          <p className="text-sm text-[#5E605D] max-w-2xl">
            {t('emails.description') || 'Edite o conteúdo, assuntos, variáveis dinâmicas e layouts dos e-mails automáticos enviados pela plataforma aos clientes e administradores.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Sub-Tabs: Editor vs Delivery Logs */}
          <div className="bg-[#F4F5F0] p-1.5 rounded-full flex items-center border border-[#E2E6DF]">
            <button
              onClick={() => setActiveSubTab('editor')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'editor'
                  ? 'bg-white text-[#0E0F0C] shadow-xs font-black'
                  : 'text-[#5E605D] hover:text-[#0E0F0C]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              {t('emails.editorTab') || 'Editor de Modelos'}
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'logs'
                  ? 'bg-white text-[#0E0F0C] shadow-xs font-black'
                  : 'text-[#5E605D] hover:text-[#0E0F0C]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {t('emails.logsTab') || 'Histórico & Logs'} ({logs.length})
            </button>
          </div>

          <button
            onClick={fetchTemplatesAndStatus}
            disabled={loading}
            className="p-2.5 rounded-full border border-[#E2E6DF] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
            title={t('emails.reloadTooltip') || 'Recarregar Dados'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Tab 1: Editor & Live Device Preview */}
      {activeSubTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Template List & Category Filter (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Search & Filter */}
            <div className="bg-white border border-[#E2E6DF] rounded-3xl p-5 space-y-4 shadow-xs">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#868685]" />
                <input
                  type="text"
                  placeholder={t('emails.searchPlaceholder') || 'Buscar modelo de e-mail...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] text-xs font-medium text-[#0E0F0C] focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {categoryFilterOptions.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      categoryFilter === cat.key
                        ? 'bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40'
                        : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] border border-transparent'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template List */}
            <div className="space-y-2.5">
              {filteredTemplates.map((template) => {
                const isSelected = template.id === selectedTemplateId;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer select-none relative ${
                      isSelected
                        ? 'bg-white border-[#00c868] shadow-md ring-2 ring-[#00c868]/15'
                        : 'bg-white border-[#E2E6DF] hover:border-[#CBD2C6] hover:bg-[#FAFBF8]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F4F5F0] text-[#5E605D]">
                        {template.category}
                      </span>
                      {template.isCustomized && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {t('emails.editedBadge') || 'Editado'}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-bold tracking-tight mb-1 ${isSelected ? 'text-[#0E0F0C]' : 'text-[#2D302C]'}`}>
                      {template.name}
                    </h3>
                    <p className="text-xs text-[#868685] line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#E2E6DF] text-[#868685] text-xs">
                  {t('emails.noTemplatesFound') || 'Nenhum modelo encontrado para a busca.'}
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Split Editor + Live Preview (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {activeTemplate && (
              <>
                {/* Editor Card */}
                <div className="bg-white border border-[#E2E6DF] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                  {/* Top Bar with actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E6DF]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-[#0E0F0C] font-['Outfit']">
                          {activeTemplate.name}
                        </h2>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F7DC] text-[#163300]">
                          {activeTemplate.type}
                        </span>
                      </div>
                      <p className="text-xs text-[#868685] mt-0.5">
                        {activeTemplate.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetToDefault}
                        disabled={saving}
                        className="px-3.5 py-2 rounded-full border border-[#E2E6DF] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title={t('emails.actions.restoreDefault') || 'Restaurar valores padrão deste modelo'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t('emails.actions.restoreDefault') || 'Restaurar Padrão'}
                      </button>

                      <button
                        onClick={handleSaveTemplate}
                        disabled={saving}
                        className="px-5 py-2 rounded-full bg-[#00c868] text-white hover:bg-[#00b05b] text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        {saving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {saving ? (t('emails.actions.saving') || 'Salvando...') : (t('emails.actions.saveChanges') || 'Salvar Alterações')}
                      </button>
                    </div>
                  </div>

                  {/* Variables Helper Toolbar */}
                  <div className="bg-[#F8F9F5] border border-[#E2E6DF] rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0E0F0C] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#00c868]" />
                        {t('emails.variables.title') || 'Tags e Variáveis Dinâmicas Disponíveis:'}
                      </span>
                      <span className="text-[11px] text-[#868685]">
                        {t('emails.variables.hint') || 'Clique para inserir no corpo do e-mail'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeTemplate.supportedVariables.map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => insertVariable(v.key, 'bodyHtml')}
                          className="px-2.5 py-1 bg-white hover:bg-[#E8F7DC] border border-[#E2E6DF] hover:border-[#9FE870] rounded-xl text-xs font-mono font-bold text-[#163300] transition-all flex items-center gap-1.5 cursor-pointer"
                          title={`${v.label}: ${v.description} (Ex: ${v.sampleValue})`}
                        >
                          <span>{`{{${v.key}}}`}</span>
                          {copiedKey === v.key ? (
                            <Check className="w-3 h-3 text-[#008a46]" />
                          ) : (
                            <span className="text-[10px] text-[#868685] font-sans">({v.label})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fields Grid */}
                  <div className="space-y-4">
                    {/* Subject Line */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0E0F0C] flex items-center justify-between">
                        <span>{t('emails.form.subjectLabel') || 'Assunto do E-mail (Subject)'}</span>
                        <span className="text-[10px] text-[#868685] font-normal">{t('emails.form.subjectHint') || 'Aceita variáveis como {{instituicao}}'}</span>
                      </label>
                      <input
                        type="text"
                        value={formData.subject || ''}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] text-xs font-medium text-[#0E0F0C] focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                        placeholder={t('emails.form.subjectPlaceholder') || 'Assunto do e-mail...'}
                      />
                    </div>

                    {/* Preheader & Badge Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0E0F0C]">
                          {t('emails.form.preheaderLabel') || 'Texto de Pré-visualização (Preheader)'}
                        </label>
                        <input
                          type="text"
                          value={formData.preheader || ''}
                          onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] text-xs font-medium text-[#0E0F0C] focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                          placeholder={t('emails.form.preheaderPlaceholder') || 'Snippet visível na caixa de entrada...'}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0E0F0C]">
                          {t('emails.form.badgeTextLabel') || 'Texto do Badge Superior'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.badgeText || ''}
                            onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                            className="flex-1 px-4 py-2.5 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] text-xs font-medium text-[#0E0F0C] focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                            placeholder={t('emails.form.badgeTextPlaceholder') || 'Ex: Conta Criada'}
                          />
                          <input
                            type="color"
                            value={formData.badgeColor || '#00c868'}
                            onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                            className="w-10 h-10 p-1 rounded-2xl border border-[#E2E6DF] bg-white cursor-pointer"
                            title={t('emails.form.badgeColorTooltip') || 'Cor do badge'}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0E0F0C]">
                        {t('emails.form.headingLabel') || 'Título Principal (Heading)'}
                      </label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] text-xs font-medium text-[#0E0F0C] focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                        placeholder={t('emails.form.headingPlaceholder') || 'Título do e-mail...'}
                      />
                    </div>

                    {/* Body HTML Editor */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#0E0F0C]">
                          {t('emails.form.bodyLabel') || 'Corpo do E-mail (HTML Formatado)'}
                        </label>
                        <span className="text-[11px] text-[#868685]">
                          {t('emails.form.bodyHint') || 'Suporta tags HTML como <p>, <strong>, <div class="info-box">'}
                        </span>
                      </div>
                      <textarea
                        rows={10}
                        value={formData.bodyHtml || ''}
                        onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                        className="w-full p-4 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] font-mono text-xs text-[#0E0F0C] leading-relaxed focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                        placeholder={t('emails.form.bodyPlaceholder') || 'Conteúdo HTML do e-mail...'}
                      />
                    </div>

                    {/* CTA Button Text & URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0E0F0C]">
                          {t('emails.form.ctaTextLabel') || 'Texto do Botão Principal (CTA)'}
                        </label>
                        <input
                          type="text"
                          value={formData.ctaText || ''}
                          onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] text-xs font-medium text-[#0E0F0C] focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                          placeholder={t('emails.form.ctaTextPlaceholder') || 'Ex: Acessar Painel skoolia'}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0E0F0C]">
                          {t('emails.form.ctaUrlLabel') || 'Link de Destino (URL)'}
                        </label>
                        <input
                          type="text"
                          value={formData.ctaUrl || ''}
                          onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] text-xs font-mono text-[#0E0F0C] focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                          placeholder={t('emails.form.ctaUrlPlaceholder') || 'Ex: {{link_acesso}} ou URL completa'}
                        />
                      </div>
                    </div>

                    {/* Footer Note */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0E0F0C]">
                        {t('emails.form.footerNoteLabel') || 'Nota de Rodapé (Aviso de Segurança / Termos)'}
                      </label>
                      <input
                        type="text"
                        value={formData.footerNote || ''}
                        onChange={(e) => setFormData({ ...formData, footerNote: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] text-xs font-medium text-[#0E0F0C] focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                        placeholder={t('emails.form.footerNotePlaceholder') || 'Nota exibida antes dos direitos autorais...'}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Device Preview & Test Dispatcher Card */}
                <div className="bg-white border border-[#E2E6DF] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                  {/* Top Bar of Preview Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#008a46]" />
                      <h3 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                        {t('emails.preview.title') || 'Pré-visualização em Tempo Real'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Device switch */}
                      <div className="bg-[#F4F5F0] p-1 rounded-full flex items-center border border-[#E2E6DF]">
                        <button
                          onClick={() => setPreviewDevice('desktop')}
                          className={`p-1.5 rounded-full transition-all cursor-pointer ${
                            previewDevice === 'desktop' ? 'bg-white shadow-xs text-[#0E0F0C]' : 'text-[#868685]'
                          }`}
                          title={t('emails.preview.desktopTooltip') || 'Visualização Desktop (Computador)'}
                        >
                          <Monitor className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPreviewDevice('mobile')}
                          className={`p-1.5 rounded-full transition-all cursor-pointer ${
                            previewDevice === 'mobile' ? 'bg-white shadow-xs text-[#0E0F0C]' : 'text-[#868685]'
                          }`}
                          title={t('emails.preview.mobileTooltip') || 'Visualização Mobile (Smartphone)'}
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Mode switch */}
                      <div className="bg-[#F4F5F0] p-1 rounded-full flex items-center border border-[#E2E6DF]">
                        <button
                          onClick={() => setPreviewMode('visual')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            previewMode === 'visual' ? 'bg-white shadow-xs text-[#0E0F0C]' : 'text-[#868685]'
                          }`}
                        >
                          {t('emails.preview.visualMode') || 'Visual'}
                        </button>
                        <button
                          onClick={() => setPreviewMode('code')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            previewMode === 'code' ? 'bg-white shadow-xs text-[#0E0F0C]' : 'text-[#868685]'
                          }`}
                        >
                          {t('emails.preview.codeMode') || 'Código HTML'}
                        </button>
                      </div>

                      {/* Customize Sample Values Button */}
                      <button
                        onClick={() => setShowVariablesPanel(!showVariablesPanel)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          showVariablesPanel
                            ? 'bg-[#E8F7DC] text-[#163300] border-[#9FE870]'
                            : 'bg-white text-[#5E605D] border-[#E2E6DF] hover:bg-[#F4F5F0]'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        {t('emails.variables.testDataButton') || 'Dados de Teste'}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Sample Variables Editor */}
                  {showVariablesPanel && (
                    <div className="p-4 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] space-y-3 animate-in fade-in duration-150">
                      <div className="text-xs font-bold text-[#0E0F0C] flex items-center justify-between">
                        <span>{t('emails.variables.simulationTitle') || 'Ajustar Variáveis de Simulação:'}</span>
                        <span className="text-[11px] text-[#868685]">{t('emails.variables.simulationHint') || 'Altere para ver o preview com dados reais'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeTemplate.supportedVariables.map((v) => (
                          <div key={v.key} className="space-y-1">
                            <label className="text-[11px] font-bold text-[#5E605D]">
                              {v.label} <span className="font-mono text-[#868685]">({`{{${v.key}}}`})</span>
                            </label>
                            <input
                              type="text"
                              value={customVariables[v.key] ?? v.sampleValue}
                              onChange={(e) =>
                                setCustomVariables({
                                  ...customVariables,
                                  [v.key]: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E2E6DF] text-xs text-[#0E0F0C] focus:outline-none focus:border-[#00c868]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subject Line Bar in Preview */}
                  <div className="bg-[#F8F9F5] border border-[#E2E6DF] rounded-2xl p-3.5 flex items-center gap-3 text-xs">
                    <span className="font-bold text-[#5E605D] shrink-0">{t('emails.preview.subjectLabel') || 'Assunto:'}</span>
                    <span className="font-semibold text-[#0E0F0C] truncate font-['Outfit']">
                      {renderedPreview.subject}
                    </span>
                  </div>

                  {/* Preview Render Area */}
                  <div
                    className={`mx-auto bg-[#F4F5F0] border border-[#E2E6DF] rounded-3xl overflow-hidden p-4 sm:p-6 transition-all ${
                      previewDevice === 'mobile' ? 'max-w-[400px]' : 'w-full'
                    }`}
                  >
                    {previewMode === 'visual' ? (
                      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E6DF] overflow-hidden">
                        <iframe
                          title="Visual Email Preview"
                          srcDoc={renderedPreview.html}
                          className="w-full border-none h-[540px] block"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    ) : (
                      <pre className="p-4 bg-[#0E0F0C] text-[#9FE870] rounded-2xl text-xs font-mono overflow-x-auto h-[540px] leading-relaxed">
                        {renderedPreview.html}
                      </pre>
                    )}
                  </div>

                  {/* Direct Test Dispatch Box */}
                  <div className="pt-4 border-t border-[#E2E6DF] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-[#0E0F0C] flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#00c868]" />
                        {t('emails.preview.sendRealTest') || 'Enviar E-mail de Teste Real'}
                      </label>
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder="seu-email@gmail.com"
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] text-xs font-medium text-[#0E0F0C] focus:outline-none focus:border-[#00c868] focus:bg-white transition-all"
                      />
                    </div>

                    <button
                      onClick={handleSendTestEmail}
                      disabled={sendingTest || !testEmailAddress}
                      className="px-6 py-2.5 rounded-full bg-[#163300] text-[#9FE870] hover:bg-[#204502] text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto h-[42px]"
                    >
                      {sendingTest ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {sendingTest ? (t('emails.preview.sendingButton') || 'Enviando Teste...') : (t('emails.preview.sendButton') || 'Disparar E-mail de Teste')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Tab 2: Transactional Logs & Delivery Audit */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-[#E2E6DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E6DF]">
            <div>
              <h2 className="text-xl font-black text-[#0E0F0C] font-['Outfit']">
                {t('emails.logs.title') || 'Histórico de Disparos de E-mail'}
              </h2>
              <p className="text-xs text-[#5E605D] mt-0.5">
                {t('emails.logs.subtitle') || 'Auditoria em tempo real de e-mails transacionais enviados pelo sistema.'}
              </p>
            </div>

            {status && (
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    status.isConfigured
                      ? 'bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  {status.isConfigured ? (t('emails.logs.providerConnected') || '● Provedor Resend Conectado') : (t('emails.logs.providerSandbox') || '● Modo Simulação (Sandbox)')}
                </span>
                <span className="text-xs text-[#868685] font-semibold">
                  {t('emails.logs.senderLabel') || 'Remetente:'} <code className="text-[#0E0F0C]">{status.fromEmail}</code>
                </span>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] space-y-1">
              <span className="text-xs font-bold text-[#5E605D]">{t('emails.logs.metricSent') || 'Total Enviados com Sucesso'}</span>
              <div className="text-2xl font-black text-[#008a46] font-['Outfit']">
                {status?.totalSent ?? logs.filter((l) => l.status === 'SENT' || l.status === 'DELIVERED').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] space-y-1">
              <span className="text-xs font-bold text-[#5E605D]">{t('emails.logs.metricSimulated') || 'Simulados em Sandbox'}</span>
              <div className="text-2xl font-black text-[#0E0F0C] font-['Outfit']">
                {status?.totalSimulated ?? logs.filter((l) => l.status === 'SIMULATED').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F9F5] border border-[#E2E6DF] space-y-1">
              <span className="text-xs font-bold text-[#5E605D]">{t('emails.logs.metricFailed') || 'Falhas no Envio'}</span>
              <div className="text-2xl font-black text-red-600 font-['Outfit']">
                {status?.totalFailed ?? logs.filter((l) => l.status === 'FAILED').length}
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="border border-[#E2E6DF] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F5] border-b border-[#E2E6DF] text-[#5E605D] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">{t('emails.logs.colDateTime') || 'Data / Hora'}</th>
                    <th className="px-5 py-3.5">{t('emails.logs.colType') || 'Tipo'}</th>
                    <th className="px-5 py-3.5">{t('emails.logs.colRecipient') || 'Destinatário'}</th>
                    <th className="px-5 py-3.5">{t('emails.logs.colSubject') || 'Assunto'}</th>
                    <th className="px-5 py-3.5">{t('emails.logs.colStatus') || 'Status'}</th>
                    <th className="px-5 py-3.5">{t('emails.logs.colId') || 'ID Resend'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6DF]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAFBF8] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-[#5E605D] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full font-extrabold text-[10px] bg-[#E8F7DC] text-[#163300]">
                          {log.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#0E0F0C]">
                        {log.to}
                      </td>
                      <td className="px-5 py-3.5 text-[#2D302C] max-w-xs truncate">
                        {log.subject}
                      </td>
                      <td className="px-5 py-3.5">
                        {(log.status === 'SENT' || log.status === 'DELIVERED') && (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> {t('emails.logs.statusSent') || 'Entregue'}
                          </span>
                        )}
                        {log.status === 'SIMULATED' && (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                            {t('emails.logs.statusSimulated') || 'Simulado (Sandbox)'}
                          </span>
                        )}
                        {log.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full" title={log.errorMessage}>
                            <AlertCircle className="w-3 h-3" /> {t('emails.logs.statusFailed') || 'Falha'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#868685]">
                        {log.resendId || log.id}
                      </td>
                    </tr>
                  ))}

                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[#868685]">
                        {t('emails.logs.emptyLogs') || 'Nenhum registro de disparo encontrado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting Template to Factory Default */}
      {activeTemplate && (
        <ConfirmationModal
          isOpen={isResetConfirmOpen}
          title={t('emails.actions.restoreDefault') || 'Restaurar Modelo Padrão'}
          message={
            t('emails.actions.restoreDefaultConfirm', { name: activeTemplate.name }) ||
            `Deseja restaurar o modelo "${activeTemplate.name}" para os textos e layout padrão de fábrica? As alterações personalizadas serão sobrescritas.`
          }
          targetResource={activeTemplate.name}
          confirmLabel={t('emails.actions.confirmRestore') || 'Restaurar Padrão'}
          cancelLabel={t('common.cancel') || 'Cancelar'}
          isDestructive={true}
          onConfirm={handleExecuteResetToDefault}
          onCancel={() => setIsResetConfirmOpen(false)}
        />
      )}
    </div>
  );
};
