import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LifeBuoy,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  ShieldAlert,
  Sparkles,
  Tag,
  Kanban,
  ListFilter,
  Check,
  ChevronRight,
  Globe,
  Receipt,
  Layers,
  Shield,
  HelpCircle,
  Bot,
  Flame,
  Filter,
  Mail,
  ArrowLeft,
  X,
  Sliders,
  Bell,
  RotateCcw,
} from 'lucide-react';
import {
  SupportTicket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  detectTicketLanguage,
  SupportedTicketLanguage,
  formatTicketContent,
  appendAgentSignature,
} from '../lib/ticketSanitizer';

interface SupportViewProps {
  tickets: SupportTicket[];
  onSaveTicket: (ticket: SupportTicket, isNew?: boolean) => void;
  onAddMessage: (ticketId: string, message: TicketMessage, newStatus?: TicketStatus) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  autoOpenCreateModal?: boolean;
  initialCategory?: TicketCategory;
  initialSubject?: string;
  initialDescription?: string;
  onResetAutoOpen?: () => void;
}

const CATEGORY_ICONS: Record<TicketCategory, { icon: any; color: string; key: string }> = {
  DOMAINS_DNS: {
    icon: Globe,
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    key: 'support.categories.DOMAINS_DNS',
  },
  BILLING_LICENSES: {
    icon: Receipt,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    key: 'support.categories.BILLING_LICENSES',
  },
  CUSTOM_LICENSE_QUOTE: {
    icon: Sparkles,
    color: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
    key: 'support.categories.CUSTOM_LICENSE_QUOTE',
  },
  WORKSPACE_PROVISIONING: {
    icon: Layers,
    color: 'bg-purple-50 text-purple-800 border-purple-200',
    key: 'support.categories.WORKSPACE_PROVISIONING',
  },
  ADDITIONAL_SERVICES: {
    icon: Sparkles,
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    key: 'support.categories.ADDITIONAL_SERVICES',
  },
  SECURITY_ACCESS: {
    icon: Shield,
    color: 'bg-rose-50 text-rose-800 border-rose-200',
    key: 'support.categories.SECURITY_ACCESS',
  },
  GENERAL_QUESTION: {
    icon: HelpCircle,
    color: 'bg-slate-50 text-slate-800 border-slate-200',
    key: 'support.categories.GENERAL_QUESTION',
  },
};

const PRIORITY_CONFIG: Record<TicketPriority, { badgeClass: string; iconColor: string; key: string }> = {
  CRITICAL: {
    badgeClass: 'bg-red-100 text-red-900 border-red-300 font-black',
    iconColor: 'text-red-600',
    key: 'support.priorities.CRITICAL',
  },
  HIGH: {
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-200 font-bold',
    iconColor: 'text-orange-600',
    key: 'support.priorities.HIGH',
  },
  MEDIUM: {
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200 font-semibold',
    iconColor: 'text-amber-600',
    key: 'support.priorities.MEDIUM',
  },
  LOW: {
    badgeClass: 'bg-[#F4F5F0] text-[#5E605D] border-[#E2E6DF]',
    iconColor: 'text-slate-500',
    key: 'support.priorities.LOW',
  },
};

const STATUS_CONFIG: Record<TicketStatus, { badgeClass: string; dotClass: string; key: string }> = {
  NEW: {
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
    dotClass: 'bg-blue-500 animate-pulse',
    key: 'support.statuses.NEW',
  },
  IN_PROGRESS: {
    badgeClass: 'bg-[#E8F7DC] text-[#163300] border-[#9FE870]/60',
    dotClass: 'bg-[#163300]',
    key: 'support.statuses.IN_PROGRESS',
  },
  WAITING_USER: {
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-500',
    key: 'support.statuses.WAITING_USER',
  },
  RESOLVED: {
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-600',
    key: 'support.statuses.RESOLVED',
  },
  CLOSED: {
    badgeClass: 'bg-[#F4F5F0] text-[#5E605D] border-[#E2E6DF]',
    dotClass: 'bg-gray-400',
    key: 'support.statuses.CLOSED',
  },
};

export const SupportView: React.FC<SupportViewProps> = ({
  tickets,
  onSaveTicket,
  onAddMessage,
  onUpdateTicketStatus,
  autoOpenCreateModal,
  initialCategory,
  initialSubject,
  initialDescription,
  onResetAutoOpen,
}) => {
  const { user, institution, isSuperAdmin } = useAuth();
  const { t, language } = useLanguage();

  const getCategoryLabel = (category: TicketCategory) => {
    const config = CATEGORY_ICONS[category];
    return config ? t(config.key as any) : category;
  };

  const getPriorityLabel = (priority: TicketPriority) => {
    const config = PRIORITY_CONFIG[priority];
    return config ? t(config.key as any) : priority;
  };

  const getStatusLabel = (status: TicketStatus) => {
    const config = STATUS_CONFIG[status];
    return config ? t(config.key as any) : status;
  };

  // Filters & View State
  const [viewMode, setViewMode] = useState<'LIST' | 'PIPELINE'>('LIST');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');

  // Modal / Detail States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // New Ticket Form State (Tenant does NOT choose Priority or SLA; defined by support team)
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('DOMAINS_DNS');
  const [newDescription, setNewDescription] = useState('');
  const [newContactEmail, setNewContactEmail] = useState(
    institution?.technicalContactEmail || user?.email || ''
  );
  const [newContactName, setNewContactName] = useState(
    institution?.technicalContactName || user?.displayName || t('support.createModal.defaultManagerName')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomQuotePrefill, setIsCustomQuotePrefill] = useState(false);

  // Keep contact name updated if using localized fallback and language changed
  useEffect(() => {
    if (!institution?.technicalContactName && !user?.displayName) {
      setNewContactName(t('support.createModal.defaultManagerName'));
    }
  }, [language, institution?.technicalContactName, user?.displayName, t]);

  // Auto-open create modal if requested by external navigation (e.g. from CustomLicenseQuoteCard)
  useEffect(() => {
    if (autoOpenCreateModal) {
      if (initialCategory) {
        setNewCategory(initialCategory);
        if (initialCategory === 'CUSTOM_LICENSE_QUOTE') {
          setIsCustomQuotePrefill(true);
        }
      }
      if (initialSubject) setNewSubject(initialSubject);
      if (initialDescription) setNewDescription(initialDescription);
      setIsCreateModalOpen(true);
      if (onResetAutoOpen) onResetAutoOpen();
    }
  }, [autoOpenCreateModal, initialCategory, initialSubject, initialDescription, onResetAutoOpen]);

  // If the user changes language while custom quote prefill is active, update texts to match language
  useEffect(() => {
    if (isCustomQuotePrefill && newCategory === 'CUSTOM_LICENSE_QUOTE') {
      setNewSubject(t('support.customQuote.ticketSubject'));
      setNewDescription(t('support.customQuote.defaultDescription'));
    }
  }, [language, isCustomQuotePrefill, newCategory, t]);

  // Detail reply message input
  const [replyText, setReplyText] = useState('');
  const [replyRole, setReplyRole] = useState<'USER' | 'SUPPORT_AGENT'>(
    isSuperAdmin ? 'SUPPORT_AGENT' : 'USER'
  );
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [emailNotificationStatus, setEmailNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    setReplyRole(isSuperAdmin ? 'SUPPORT_AGENT' : 'USER');
  }, [isSuperAdmin]);

  // Check URL query param ?ticket=... to auto-open ticket directly (e.g. from email alert link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketParam = params.get('ticket');
    if (ticketParam && tickets.length > 0) {
      const match = tickets.find(
        (t) =>
          t.protocol.toLowerCase() === ticketParam.toLowerCase() ||
          t.id.toLowerCase() === ticketParam.toLowerCase()
      );
      if (match) {
        setSelectedTicketId(match.id);
      }
    }
  }, [tickets]);

  // Compute tickets awaiting SuperAdmin technical response
  const pendingSuperAdminReplyTickets = useMemo(() => {
    if (!isSuperAdmin) return [];
    return tickets.filter((t) => {
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
      if (t.status === 'NEW') return true;
      if (t.messages && t.messages.length > 0) {
        const lastMsg = t.messages[t.messages.length - 1];
        return lastMsg.senderRole !== 'SUPPORT_AGENT';
      }
      return true;
    });
  }, [tickets, isSuperAdmin]);

  const resolveTicketInstName = (t: SupportTicket): string => {
    if (
      t.institutionName &&
      t.institutionName !== 'Instituição Educacional' &&
      t.institutionName !== 'Instituição de Ensino'
    ) {
      return t.institutionName;
    }
    if (
      t.requesterName &&
      t.requesterName !== 'Administrador Institucional' &&
      !t.requesterName.includes('@')
    ) {
      return t.requesterName;
    }
    if (
      institution?.institutionName &&
      institution.institutionName !== 'Instituição Educacional' &&
      institution.institutionName !== 'Instituição de Ensino' &&
      institution.institutionName !== 'skoolia Global Administration'
    ) {
      return institution.institutionName;
    }
    return t.institutionName || 'Instituição';
  };

  const getCleanSubject = (t: SupportTicket): string => {
    let sub = t.subject || '';
    const inst = resolveTicketInstName(t);
    if (sub.includes('Instituição Educacional')) {
      sub = sub.replace(/\s*-\s*Instituição Educacional/gi, ` - ${inst}`);
    }
    return sub;
  };

  // Active selected ticket
  const selectedTicket = useMemo(() => {
    return tickets.find((ticket) => ticket.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  // Filtered tickets list
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ticket.protocol.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.description.toLowerCase().includes(q) ||
        ticket.requesterName.toLowerCase().includes(q) ||
        ticket.requesterEmail.toLowerCase().includes(q);

      // Status
      const matchesStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'OPEN' && (ticket.status === 'NEW' || ticket.status === 'IN_PROGRESS' || ticket.status === 'WAITING_USER')) ||
        ticket.status === selectedStatusFilter;

      // Category
      const matchesCategory =
        selectedCategoryFilter === 'ALL' || ticket.category === selectedCategoryFilter;

      // Priority
      const matchesPriority =
        selectedPriorityFilter === 'ALL' || ticket.priority === selectedPriorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [tickets, searchQuery, selectedStatusFilter, selectedCategoryFilter, selectedPriorityFilter]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = tickets.length;
    const openCount = tickets.filter(
      (ticket) => ticket.status === 'NEW' || ticket.status === 'IN_PROGRESS' || ticket.status === 'WAITING_USER'
    ).length;
    const inProgressCount = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length;
    const waitingUserCount = tickets.filter((ticket) => ticket.status === 'WAITING_USER').length;
    const resolvedCount = tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length;
    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 100;

    return {
      total,
      openCount,
      inProgressCount,
      waitingUserCount,
      resolvedCount,
      resolutionRate,
    };
  }, [tickets]);

  // Handle Create Ticket (Priority is set to default 'MEDIUM' and triaged by Support team)
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    setIsSubmitting(true);

    const protocolNum = Math.floor(1000 + Math.random() * 9000);
    const protocol = `HS-${protocolNum}`;
    const newId = `tkt-hs-${protocolNum}-${Date.now()}`;
    const now = new Date().toISOString();

    // Resolve ticket language accurately:
    // 1. If explicit app language is English or Spanish, use that.
    // 2. If app language is Portuguese, detect if the ticket was written in English or Spanish.
    const detectedLang = detectTicketLanguage(newSubject, newDescription, (language as SupportedTicketLanguage) || 'pt');
    const ticketLang: SupportedTicketLanguage =
      language === 'en' || language === 'es' ? language : detectedLang;

    const autoResponseMessages: Record<SupportedTicketLanguage, {
      senderName: string;
      agentRole: string;
      content: string;
      defaultRequesterName: string;
      defaultInstName: string;
    }> = {
      en: {
        senderName: 'Google Specialist Support',
        agentRole: 'Google Workspace Specialist',
        content: `Hello ${newContactName.trim() || 'Institution Contact'}! We have received your request with protocol #${protocol}. Our technical support team has been notified and is reviewing your case for your institution.`,
        defaultRequesterName: 'Institution Contact',
        defaultInstName: 'Educational Institution',
      },
      es: {
        senderName: 'Atención Especializada Google',
        agentRole: 'Especialista Google Workspace',
        content: `¡Hola ${newContactName.trim() || 'Contacto de la Institución'}! Hemos recibido su solicitud con protocolo #${protocol}. Nuestro equipo técnico de soporte ha sido notificado y está analizando el caso para su institución.`,
        defaultRequesterName: 'Contacto de la Institución',
        defaultInstName: 'Institución Educativa',
      },
      pt: {
        senderName: 'Atendimento Especializado Google',
        agentRole: 'Especialista Google Workspace',
        content: `Olá ${newContactName.trim() || 'Gestor da Instituição'}! Recebemos a sua solicitação com protocolo #${protocol}. Nosso time técnico de suporte já foi notificado e está analisando o caso para a sua instituição.`,
        defaultRequesterName: 'Gestor da Instituição',
        defaultInstName: 'Instituição de Ensino',
      },
    };

    const loc = autoResponseMessages[ticketLang] || autoResponseMessages.pt;

    const initialMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      senderName: newContactName.trim() || loc.defaultRequesterName,
      senderEmail: newContactEmail.trim() || user?.email || '',
      senderRole: 'USER',
      content: formatTicketContent(newDescription.trim()),
      timestamp: now,
    };

    // Automated triage response message (Support Specialist)
    const autoResponse: TicketMessage = {
      id: `msg-auto-${Date.now() + 1}`,
      senderName: loc.senderName,
      senderEmail: 'suporte@skoolia.net',
      senderRole: 'SUPPORT_AGENT',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      content: loc.content,
      timestamp: new Date(Date.now() + 1000).toISOString(),
    };

    const newTicket: SupportTicket = {
      id: newId,
      protocol,
      subject: newSubject.trim(),
      description: newDescription.trim(),
      category: newCategory,
      priority: 'MEDIUM', // Initial triage priority (managed by support team)
      status: 'IN_PROGRESS',
      requesterName: newContactName.trim() || loc.defaultRequesterName,
      requesterEmail: newContactEmail.trim() || user?.email || '',
      institutionName:
        (institution?.institutionName &&
        institution.institutionName !== 'Instituição Educacional' &&
        institution.institutionName !== 'Instituição de Ensino' &&
        institution.institutionName !== 'skoolia Global Administration'
          ? institution.institutionName
          : null) ||
        (user?.displayName && !user.displayName.includes('@') ? user.displayName : null) ||
        institution?.institutionName ||
        loc.defaultInstName,
      tenantId: institution?.ownerUid || user?.uid,
      assignedAgent: {
        name: 'Mariana Costa',
        role: loc.agentRole,
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      },
      createdAt: now,
      updatedAt: now,
      slaTargetHours: 8,
      preferredLanguage: ticketLang,
      messages: [initialMessage, autoResponse],
    };

    onSaveTicket(newTicket, true);

    // Disparar notificações de e-mail exclusivamente para o contato de login do tenant e responsável técnico
    try {
      fetch('/api/support/notify-ticket-opened', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': ticketLang,
        },
        body: JSON.stringify({
          ticket: newTicket,
          tenantContacts: {
            loginContactEmail: user?.email || institution?.primaryContactEmail,
            technicalEmail: institution?.technicalContactEmail,
          },
          preferredLanguage: ticketLang,
          lang: ticketLang,
        }),
      }).catch((err) => console.warn('Aviso ao enviar notificação de abertura:', err));
    } catch (e) {
      console.warn('Erro ao disparar api de notificação:', e);
    }

    // Reset Form
    setNewSubject('');
    setNewDescription('');
    setIsSubmitting(false);
    setIsCreateModalOpen(false);
    setSelectedTicketId(newTicket.id);
  };

  // Handle Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSendingReply(true);

    const isAgent = Boolean(isSuperAdmin && replyRole === 'SUPPORT_AGENT');
    const ticketTargetLang: SupportedTicketLanguage =
      (selectedTicket.preferredLanguage as SupportedTicketLanguage) ||
      detectTicketLanguage(selectedTicket.subject, selectedTicket.description, (language as SupportedTicketLanguage) || 'pt') ||
      'pt';

    const defaultAgentName =
      ticketTargetLang === 'en'
        ? 'Mariana Costa (Specialist Support)'
        : ticketTargetLang === 'es'
        ? 'Mariana Costa (Soporte Especializado)'
        : 'Mariana Costa (Suporte Especializado)';

    const defaultRequesterName =
      ticketTargetLang === 'en'
        ? 'Institution Manager'
        : ticketTargetLang === 'es'
        ? 'Gestor de la Institución'
        : 'Gestor da Instituição';

    let messageContent = formatTicketContent(replyText.trim());
    if (isAgent) {
      messageContent = appendAgentSignature(messageContent, ticketTargetLang);
    }

    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      senderName: isAgent
        ? selectedTicket.assignedAgent?.name || defaultAgentName
        : institution?.technicalContactName || user?.displayName || defaultRequesterName,
      senderEmail: isAgent
        ? 'suporte@skoolia.net'
        : user?.email || institution?.technicalContactEmail || '',
      senderRole: isAgent ? 'SUPPORT_AGENT' : 'USER',
      avatarUrl: isAgent
        ? selectedTicket.assignedAgent?.avatarUrl ||
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
        : undefined,
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    const nextStatus = isAgent ? 'WAITING_USER' : 'IN_PROGRESS';
    onAddMessage(selectedTicket.id, newMsg, nextStatus);

    // Disparar notificações de e-mail exclusivamente para o contato do cliente/tenant (gyrlatam@gmail.com não recebe respostas)
    try {
      const clientEmail =
        user?.email && user.email.toLowerCase() !== 'gyrlatam@gmail.com'
          ? user.email
          : institution?.primaryContactEmail && institution.primaryContactEmail.toLowerCase() !== 'gyrlatam@gmail.com'
          ? institution.primaryContactEmail
          : selectedTicket.requesterEmail && selectedTicket.requesterEmail.toLowerCase() !== 'gyrlatam@gmail.com'
          ? selectedTicket.requesterEmail
          : undefined;

      const techEmail =
        institution?.technicalContactEmail && institution.technicalContactEmail.toLowerCase() !== 'gyrlatam@gmail.com'
          ? institution.technicalContactEmail
          : undefined;

      fetch('/api/support/notify-ticket-replied', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': ticketTargetLang,
        },
        body: JSON.stringify({
          ticket: {
            ...selectedTicket,
            status: nextStatus,
            preferredLanguage: ticketTargetLang,
          },
          message: newMsg,
          tenantContacts: {
            loginContactEmail: clientEmail,
            primaryEmail: clientEmail,
            technicalEmail: techEmail,
          },
          preferredLanguage: ticketTargetLang,
          lang: ticketTargetLang,
        }),
      }).catch((err) => console.warn('Aviso ao enviar notificação de resposta:', err));
    } catch (e) {
      console.warn('Erro ao disparar api de notificação de resposta:', e);
    }

    setReplyText('');
    setIsSendingReply(false);
    setEmailNotificationStatus(t('support.modal.emailSentNotice'));
    setTimeout(() => setEmailNotificationStatus(null), 4000);
  };

  // Handle support team changing priority
  const handleUpdatePriority = (priority: TicketPriority) => {
    if (!selectedTicket) return;
    const updated: SupportTicket = {
      ...selectedTicket,
      priority,
      updatedAt: new Date().toISOString(),
    };
    onSaveTicket(updated, false);
  };

  // Handle SuperAdmin reopening a closed or resolved ticket
  const handleReopenTicket = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const defaultAgentName =
      language === 'pt'
        ? 'Especialista Skoolia'
        : language === 'es'
        ? 'Especialista Skoolia'
        : 'Skoolia Specialist';

    const reopenMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      senderName: ticket.assignedAgent?.name || defaultAgentName,
      senderEmail: 'suporte@skoolia.net',
      senderRole: 'SUPPORT_AGENT',
      avatarUrl:
        ticket.assignedAgent?.avatarUrl ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      content:
        language === 'pt'
          ? '🔄 Chamado reaberto pela equipe técnica de suporte. O atendimento foi retomado e novas mensagens podem ser enviadas.'
          : language === 'es'
          ? '🔄 Ticket reabierto por el equipo técnico de soporte. La atención ha sido retomada y se pueden enviar nuevos mensajes.'
          : '🔄 Ticket reopened by the technical support team. Support has been resumed and new messages can now be sent.',
      timestamp: new Date().toISOString(),
    };

    onUpdateTicketStatus(ticketId, 'IN_PROGRESS');
    onAddMessage(ticketId, reopenMsg, 'IN_PROGRESS');
  };

  return (
    <div id="support-view" className="space-y-6 animate-fadeIn pb-12">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#163300] via-[#1F4502] to-[#163300] text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#9FE870]/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight">
              {t('support.heroTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#E2E6DF]/85 leading-relaxed">
              {t('support.heroSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="new-ticket-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] font-black text-sm cursor-pointer shadow-md transition-all active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('support.newTicketBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E2E6DF] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-bold shrink-0">
            <LifeBuoy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0E0F0C] font-['Outfit']">{metrics.total}</div>
            <div className="text-xs text-[#5E605D] font-medium">{t('support.kpiTotal')}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E2E6DF] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-900 font-['Outfit']">{metrics.openCount}</div>
            <div className="text-xs text-[#5E605D] font-medium">{t('support.kpiOpen')}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E2E6DF] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <AlertCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-900 font-['Outfit']">{metrics.waitingUserCount}</div>
            <div className="text-xs text-[#5E605D] font-medium">{t('support.kpiWaitingUser')}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E2E6DF] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-900 font-['Outfit']">{metrics.resolutionRate}%</div>
            <div className="text-xs text-[#5E605D] font-medium">{t('support.kpiResolutionRate')}</div>
          </div>
        </div>
      </div>

      {/* SuperAdmin Notice: New Tickets Awaiting Team Response */}
      {isSuperAdmin && pendingSuperAdminReplyTickets.length > 0 && (
        <div
          id="superadmin-new-tickets-alert"
          className="bg-[#163300] text-white p-5 rounded-3xl border border-[#9FE870]/40 shadow-md relative overflow-hidden transition-all"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#9FE870] text-[#163300] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Bell className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#9FE870]/20 text-[#9FE870] border border-[#9FE870]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c868] animate-pulse" />
                    {t('support.superAdminAlert.badge') || 'Equipe de Suporte'}
                  </span>
                  <span className="text-xs text-white/70 font-mono">
                    {pendingSuperAdminReplyTickets.length} {pendingSuperAdminReplyTickets.length === 1 ? 'chamado aguardando' : 'chamados aguardando'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-1">
                  {t('support.superAdminAlert.title') || 'Novos Chamados de Clientes Aguardando Resposta'}
                </h4>
                <p className="text-xs text-white/80 mt-0.5 max-w-2xl">
                  {t('support.superAdminAlert.desc', { count: pendingSuperAdminReplyTickets.length }) ||
                    `Existem ${pendingSuperAdminReplyTickets.length} chamado(s) aberto(s) por instituições aguardando retorno da equipe técnica.`}
                </p>
              </div>
            </div>

            {/* Quick action button to reply directly */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-reply-first-pending-ticket"
                onClick={() => setSelectedTicketId(pendingSuperAdminReplyTickets[0].id)}
                className="px-4 py-2 rounded-full bg-[#9FE870] hover:bg-[#8fd860] text-[#163300] text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('support.superAdminAlert.actionReply') || 'Responder Agora'}</span>
              </button>
            </div>
          </div>

          {/* Quick Ticket Selector Chips */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-white/60 font-semibold shrink-0">Chamados pendentes:</span>
            {pendingSuperAdminReplyTickets.map((pkt) => (
              <button
                key={pkt.id}
                type="button"
                onClick={() => setSelectedTicketId(pkt.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition-all cursor-pointer shrink-0"
              >
                <span className="font-mono font-bold text-[#9FE870]">#{pkt.protocol}</span>
                <span className="truncate max-w-[140px] font-semibold">{resolveTicketInstName(pkt)}</span>
                <span className="text-[10px] text-white/70 max-w-[180px] truncate">({getCleanSubject(pkt)})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#E2E6DF] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('support.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#F4F5F0] border border-transparent focus:border-[#9FE870] focus:bg-white rounded-full outline-hidden transition-all text-[#0E0F0C] placeholder-[#868685]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#868685] hover:text-[#0E0F0C] cursor-pointer"
              >
                {t('common.clear')}
              </button>
            )}
          </div>

          {/* Filter Pills & View Switcher */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            {/* Category Dropdown */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              aria-label="Filtrar por Categoria"
              className="text-xs px-3 py-2 rounded-full border border-[#E2E6DF] bg-[#F4F5F0] text-[#0E0F0C] font-semibold cursor-pointer outline-hidden focus:border-[#9FE870]"
            >
              <option value="ALL">{t('support.allCategories')}</option>
              <option value="DOMAINS_DNS">{t('support.categories.DOMAINS_DNS')}</option>
              <option value="BILLING_LICENSES">{t('support.categories.BILLING_LICENSES')}</option>
              <option value="CUSTOM_LICENSE_QUOTE">{t('support.categories.CUSTOM_LICENSE_QUOTE')}</option>
              <option value="WORKSPACE_PROVISIONING">{t('support.categories.WORKSPACE_PROVISIONING')}</option>
              <option value="ADDITIONAL_SERVICES">{t('support.categories.ADDITIONAL_SERVICES')}</option>
              <option value="SECURITY_ACCESS">{t('support.categories.SECURITY_ACCESS')}</option>
              <option value="GENERAL_QUESTION">{t('support.categories.GENERAL_QUESTION')}</option>
            </select>

            {/* Priority Dropdown (SuperAdmin only) */}
            {isSuperAdmin && (
              <select
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                aria-label="Filtrar por Prioridade"
                className="text-xs px-3 py-2 rounded-full border border-[#E2E6DF] bg-[#F4F5F0] text-[#0E0F0C] font-semibold cursor-pointer outline-hidden focus:border-[#9FE870]"
              >
                <option value="ALL">{t('support.allPriorities')}</option>
                <option value="CRITICAL">{t('support.priorities.CRITICAL')}</option>
                <option value="HIGH">{t('support.priorities.HIGH')}</option>
                <option value="MEDIUM">{t('support.priorities.MEDIUM')}</option>
                <option value="LOW">{t('support.priorities.LOW')}</option>
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F4F5F0] p-1 rounded-full border border-[#E2E6DF]">
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 px-3 transition-all cursor-pointer ${
                  viewMode === 'LIST'
                    ? 'bg-white text-[#163300] shadow-xs'
                    : 'text-[#5E605D] hover:text-[#0E0F0C]'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>{t('support.viewList')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('PIPELINE')}
                className={`p-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 px-3 transition-all cursor-pointer ${
                  viewMode === 'PIPELINE'
                    ? 'bg-white text-[#163300] shadow-xs'
                    : 'text-[#5E605D] hover:text-[#0E0F0C]'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>{t('support.viewPipeline')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#E2E6DF]">
          {[
            { id: 'ALL', label: t('support.statusTabs.all'), count: tickets.length },
            { id: 'OPEN', label: t('support.statusTabs.open'), count: metrics.openCount },
            { id: 'IN_PROGRESS', label: t('support.statusTabs.inProgress'), count: metrics.inProgressCount },
            { id: 'WAITING_USER', label: t('support.statusTabs.waitingUser'), count: metrics.waitingUserCount },
            { id: 'RESOLVED', label: t('support.statusTabs.resolved'), count: metrics.resolvedCount },
          ].map((tab) => {
            const isActive = selectedStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#163300] text-[#9FE870]'
                    : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#EAECE6]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#9FE870] text-[#163300]' : 'bg-[#E2E6DF] text-[#0E0F0C]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: List View OR Pipeline View */}
      {viewMode === 'LIST' ? (
        <div className="bg-white rounded-3xl border border-[#E2E6DF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E6DF] bg-[#F4F5F0]/60 text-[#5E605D] text-[11px] font-black uppercase tracking-wider font-['Outfit']">
                  <th className="py-3.5 px-5">{t('support.table.protocolSubject')}</th>
                  <th className="py-3.5 px-4">{t('support.table.category')}</th>
                  {isSuperAdmin && <th className="py-3.5 px-4">{t('support.table.priority')}</th>}
                  <th className="py-3.5 px-4">{t('support.table.status')}</th>
                  <th className="py-3.5 px-4">{t('support.table.specialist')}</th>
                  <th className="py-3.5 px-4">{t('support.table.messages')}</th>
                  <th className="py-3.5 px-5 text-right">{t('support.table.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6DF] text-xs text-[#0E0F0C]">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => {
                    const categoryInfo = CATEGORY_ICONS[ticket.category] || CATEGORY_ICONS.GENERAL_QUESTION;
                    const priorityInfo = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
                    const statusInfo = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.IN_PROGRESS;
                    const CatIcon = categoryInfo.icon;

                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className="hover:bg-[#F9FAF8] transition-colors cursor-pointer group"
                      >
                        {/* Protocol & Subject */}
                        <td className="py-4 px-5">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-['Outfit']">
                              {ticket.protocol.replace('HS-', '#')}
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-bold text-[#0E0F0C] group-hover:text-[#163300] transition-colors line-clamp-1">
                                {getCleanSubject(ticket)}
                              </div>
                              <div className="text-[11px] text-[#868685] line-clamp-1">
                                {ticket.requesterName} • {resolveTicketInstName(ticket)} • {new Date(ticket.createdAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US')} {language === 'pt' ? 'às' : language === 'es' ? 'a las' : 'at'}{' '}
                                {new Date(ticket.createdAt).toLocaleTimeString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${categoryInfo.color}`}
                          >
                            <CatIcon className="w-3 h-3" />
                            <span>{getCategoryLabel(ticket.category)}</span>
                          </span>
                        </td>

                        {/* Priority (SuperAdmin only) */}
                        {isSuperAdmin && (
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border w-fit ${priorityInfo.badgeClass}`}
                            >
                              {ticket.priority === 'CRITICAL' && <Flame className="w-3 h-3 text-red-600" />}
                              <span>{getPriorityLabel(ticket.priority)}</span>
                            </span>
                          </td>
                        )}

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                            <span>{getStatusLabel(ticket.status)}</span>
                          </span>
                        </td>

                        {/* Assigned Agent */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {ticket.assignedAgent ? (
                            <div className="flex items-center gap-2">
                              {ticket.assignedAgent.avatarUrl ? (
                                <img
                                  src={ticket.assignedAgent.avatarUrl}
                                  alt={ticket.assignedAgent.name}
                                  className="w-6 h-6 rounded-full object-cover border border-[#E2E6DF]"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#163300] text-[#9FE870] flex items-center justify-center text-[10px] font-bold">
                                  {ticket.assignedAgent.name[0]}
                                </div>
                              )}
                              <span className="text-xs font-semibold text-[#0E0F0C]">
                                {ticket.assignedAgent.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#868685] italic">{t('support.modal.triageInProgress')}</span>
                          )}
                        </td>

                        {/* Messages count */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 text-xs text-[#5E605D] font-medium bg-[#F4F5F0] px-2.5 py-1 rounded-full">
                            <MessageSquare className="w-3 h-3 text-[#163300]" />
                            <span>{ticket.messages.length}</span>
                          </div>
                        </td>

                        {/* Action CTA */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            {isSuperAdmin && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopenTicket(ticket.id);
                                }}
                                title={t('support.modal.reopenTicketBtn')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#163300] text-[#9FE870] hover:bg-[#204500] transition-colors cursor-pointer shadow-2xs active:scale-98"
                              >
                                <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                                <span>{t('support.modal.reopenTicketBtn')}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicketId(ticket.id);
                              }}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#E8F7DC] text-[#163300] hover:bg-[#9FE870] transition-colors cursor-pointer"
                            >
                              <span>{t('support.table.viewHistory')}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isSuperAdmin ? 7 : 6} className="py-12 text-center text-[#868685]">
                      <LifeBuoy className="w-10 h-10 mx-auto text-[#CBD3C5] mb-2" />
                      <p className="font-bold text-[#0E0F0C]">{t('support.table.emptyTitle')}</p>
                      <p className="text-xs text-[#868685] mt-1">
                        {t('support.table.emptyDesc')}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Pipeline / Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { id: 'NEW', title: t('support.statuses.NEW'), color: 'border-blue-300 bg-blue-50/40 text-blue-900' },
            { id: 'IN_PROGRESS', title: t('support.statuses.IN_PROGRESS'), color: 'border-[#9FE870] bg-[#E8F7DC]/30 text-[#163300]' },
            { id: 'WAITING_USER', title: t('support.statuses.WAITING_USER'), color: 'border-amber-300 bg-amber-50/40 text-amber-900' },
            { id: 'RESOLVED', title: t('support.statuses.RESOLVED'), color: 'border-emerald-300 bg-emerald-50/40 text-emerald-900' },
          ].map((column) => {
            const columnTickets = filteredTickets.filter((ticket) => {
              if (column.id === 'RESOLVED') return ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
              return ticket.status === column.id;
            });

            return (
              <div
                key={column.id}
                className="bg-white rounded-3xl p-4 border border-[#E2E6DF] shadow-xs flex flex-col min-h-[450px]"
              >
                {/* Column Header */}
                <div className={`p-3 rounded-2xl border mb-3 flex items-center justify-between font-['Outfit'] ${column.color}`}>
                  <span className="font-black text-xs">{column.title}</span>
                  <span className="w-5 h-5 rounded-full bg-white text-[#0E0F0C] flex items-center justify-center text-[10px] font-black shadow-2xs">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {columnTickets.map((ticket) => {
                    const priorityInfo = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className="bg-[#F9FAF8] hover:bg-white p-4 rounded-2xl border border-[#E2E6DF] hover:border-[#163300] transition-all cursor-pointer space-y-3 shadow-2xs group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-[#163300] font-['Outfit'] bg-[#E8F7DC] px-2 py-0.5 rounded-md">
                            {ticket.protocol}
                          </span>
                          {isSuperAdmin && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityInfo.badgeClass}`}>
                              {getPriorityLabel(ticket.priority)}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-[#0E0F0C] group-hover:text-[#163300] transition-colors leading-snug line-clamp-2">
                          {ticket.subject}
                        </h4>

                        <div className="text-[11px] text-[#5E605D] line-clamp-2 leading-relaxed">
                          {ticket.description}
                        </div>

                        <div className="pt-2 border-t border-[#E2E6DF] flex items-center justify-between text-[11px] text-[#868685]">
                          <span>{ticket.requesterName}</span>
                          <span className="flex items-center gap-1 font-semibold text-[#0E0F0C]">
                            <MessageSquare className="w-3 h-3 text-[#163300]" />
                            {ticket.messages.length}
                          </span>
                        </div>

                        {isSuperAdmin && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReopenTicket(ticket.id);
                            }}
                            className="w-full mt-2 py-1.5 px-3 rounded-xl bg-[#163300] hover:bg-[#204500] text-[#9FE870] font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs active:scale-98"
                          >
                            <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                            <span>{t('support.modal.reopenTicketBtn')}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {columnTickets.length === 0 && (
                    <div className="p-6 text-center text-xs text-[#868685] italic border border-dashed border-[#E2E6DF] rounded-2xl">
                      {t('support.emptyStage')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL-SCREEN Support Ticket Workspace Modal */}
      {selectedTicket && createPortal(
        <div className="fixed inset-0 z-[100] bg-[#F4F5F0] flex flex-col w-full h-full overflow-hidden animate-fadeIn" role="dialog" aria-modal="true">
          {/* Top Bar Navigation & Header */}
          <header className="bg-white border-b border-[#E2E6DF] px-4 sm:px-6 lg:px-8 py-3 shrink-0 shadow-xs z-20">
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(null)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#163300] font-bold text-xs cursor-pointer border border-[#E2E6DF] transition-all shrink-0 group shadow-2xs"
                  title={t('support.modal.backBtn')}
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  <span className="font-['Outfit']">{t('support.title') || 'Chamados'}</span>
                </button>

                <span className="text-[#CBD3C5] font-light text-sm shrink-0">/</span>

                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-black px-2.5 py-1 rounded-md bg-[#163300] text-[#9FE870] font-['Outfit'] shrink-0">
                    {selectedTicket.protocol}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                      STATUS_CONFIG[selectedTicket.status]?.badgeClass || ''
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedTicket.status]?.dotClass || ''}`} />
                    <span>{getStatusLabel(selectedTicket.status)}</span>
                  </span>

                  {/* Priority Badge (SuperAdmin only) */}
                  {isSuperAdmin && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border shrink-0 ${
                        PRIORITY_CONFIG[selectedTicket.priority]?.badgeClass || ''
                      }`}
                    >
                      {selectedTicket.priority === 'CRITICAL' && <Flame className="w-3 h-3 text-red-600" />}
                      <span>{getPriorityLabel(selectedTicket.priority)}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {isSuperAdmin && (selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                  <button
                    type="button"
                    onClick={() => handleReopenTicket(selectedTicket.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#163300] hover:bg-[#204500] text-[#9FE870] font-bold text-xs cursor-pointer shadow-xs transition-all active:scale-98"
                  >
                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('support.modal.reopenTicketBtn')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(null)}
                  aria-label={t('support.modal.closeScreen')}
                  className="w-8 h-8 rounded-full bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#0E0F0C] flex items-center justify-center cursor-pointer border border-[#E2E6DF] transition-all ml-0.5 shrink-0"
                  title={t('support.modal.closeScreen')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Full Screen Body Grid */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Main Pane: Conversation Stream & Reply Input */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-white border-r border-[#E2E6DF]">
              {/* Ticket Subject Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-[#E2E6DF] bg-[#F9FAF8]/60 shrink-0">
                <h2 className="text-xl sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                  {getCleanSubject(selectedTicket)}
                </h2>
                <div className="text-xs text-[#5E605D] flex items-center gap-3 flex-wrap mt-1.5">
                  <span>
                    {t('support.modal.requester')} <strong className="text-[#0E0F0C]">{selectedTicket.requesterName}</strong> ({selectedTicket.requesterEmail})
                  </span>
                  <span>•</span>
                  <span>
                    {t('support.modal.institution')} <strong className="text-[#0E0F0C]">{resolveTicketInstName(selectedTicket)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {t('support.modal.openedAt')}{' '}
                    {new Date(selectedTicket.createdAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Message Feed Area */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 bg-[#FAFAF7]">
                <div className="text-xs font-black uppercase tracking-wider text-[#868685] font-['Outfit'] flex items-center justify-between pb-2 border-b border-[#E2E6DF]">
                  <span>{t('support.modal.historyTitle')}</span>
                  <span>{t('support.modal.messagesCount', { count: selectedTicket.messages.length })}</span>
                </div>

                <div className="space-y-4 max-w-4xl mx-auto">
                  {selectedTicket.messages.map((msg) => {
                    const isAgent = msg.senderRole === 'SUPPORT_AGENT';
                    const isSystem = msg.senderRole === 'SYSTEM';

                    if (isSystem) {
                      return (
                        <div
                          key={msg.id}
                          className="p-3.5 bg-[#F4F5F0] rounded-2xl text-center text-xs text-[#5E605D] italic border border-[#E2E6DF]"
                        >
                          {msg.content}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3.5 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}
                      >
                        {/* Avatar */}
                        {isAgent ? (
                          msg.avatarUrl ? (
                            <img
                              src={msg.avatarUrl}
                              alt={msg.senderName}
                              className="w-9 h-9 rounded-full object-cover border-2 border-[#9FE870] shrink-0 mt-1 shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#163300] text-[#9FE870] flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                              S
                            </div>
                          )
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#E8F7DC] text-[#163300] border-2 border-[#9FE870] flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                            <User className="w-4 h-4" />
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-5 text-xs space-y-2 shadow-xs ${
                            isAgent
                              ? 'bg-white text-[#0E0F0C] rounded-tl-xs border border-[#E2E6DF]'
                              : 'bg-[#163300] text-white rounded-tr-xs'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-between gap-4 text-[11px] pb-1.5 border-b ${
                              isAgent ? 'border-[#E2E6DF] text-[#5E605D]' : 'border-white/20 text-[#E2E6DF]'
                            }`}
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              {msg.senderName}
                              {isAgent && (
                                <span className="text-[9px] bg-[#E8F7DC] text-[#163300] px-2 py-0.5 rounded-full font-bold uppercase">
                                  {t('support.modal.teamBadge')}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] opacity-80">
                              {new Date(msg.timestamp).toLocaleTimeString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap text-xs sm:text-[13px]">{formatTicketContent(msg.content)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Section: Both SuperAdmin and Tenant can send messages while ticket is open */}
              {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' ? (
                <div className="p-4 sm:p-6 bg-white border-t border-[#E2E6DF] shrink-0">
                  <form onSubmit={handleSendReply} className="max-w-4xl mx-auto space-y-3">
                    {/* SuperAdmin Role Indicator */}
                    {isSuperAdmin && (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 p-1 bg-[#F4F5F0] rounded-xl border border-[#E2E6DF]">
                          <button
                            type="button"
                            onClick={() => setReplyRole('SUPPORT_AGENT')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              replyRole === 'SUPPORT_AGENT'
                                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                                : 'text-[#5E605D] hover:text-[#0E0F0C]'
                            }`}
                          >
                            {t('support.modal.replyAsSpecialist')}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <textarea
                        rows={3}
                        placeholder={
                          isSuperAdmin && replyRole === 'SUPPORT_AGENT'
                            ? t('support.modal.agentPlaceholder')
                            : t('support.modal.userPlaceholder')
                        }
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full p-4 text-xs sm:text-sm bg-[#F9FAF8] border border-[#E2E6DF] focus:border-[#9FE870] focus:bg-white rounded-2xl outline-hidden resize-none transition-all text-[#0E0F0C] leading-relaxed"
                      />
                    </div>

                    {emailNotificationStatus && (
                      <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold">{emailNotificationStatus}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={!replyText.trim() || isSendingReply}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] disabled:bg-gray-200 text-[#163300] disabled:text-gray-400 font-black text-xs sm:text-sm cursor-pointer shadow-xs transition-all active:scale-98"
                      >
                        <Send className="w-4 h-4 stroke-[2.5]" />
                        <span>
                          {isSendingReply
                            ? t('support.modal.sending')
                            : isSuperAdmin && replyRole === 'SUPPORT_AGENT'
                            ? t('support.modal.replyBtn')
                            : t('support.modal.sendBtn')}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-4 sm:p-6 bg-white border-t border-[#E2E6DF] shrink-0">
                  <div className="max-w-4xl mx-auto p-4 bg-[#E8F7DC]/60 rounded-2xl border border-[#9FE870]/60 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-[#2E4A1E]">
                        <span className="font-bold text-[#163300] block">{t('support.modal.resolvedTitle')}</span>
                        {isSuperAdmin ? t('support.modal.reopenNotice') : t('support.modal.resolvedDesc')}
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleReopenTicket(selectedTicket.id)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#163300] hover:bg-[#204500] text-[#9FE870] font-black text-xs cursor-pointer shadow-xs transition-all active:scale-98 shrink-0 ml-auto"
                      >
                        <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                        <span>{t('support.modal.reopenTicketBtn')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </main>

            {/* Right Sidebar: Details, Priority Management (SuperAdmin only) & Status Actions */}
            <aside className="w-full lg:w-96 p-6 overflow-y-auto space-y-5 bg-[#F9FAF8] shrink-0 border-l border-[#E2E6DF]">
              {/* Ticket Details Box */}
              <div className="bg-white p-5 rounded-3xl border border-[#E2E6DF] space-y-4 shadow-2xs">
                <div className="text-xs font-black uppercase tracking-wider text-[#0E0F0C] font-['Outfit']">
                  {t('support.modal.detailsTitle')}
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#868685] block text-[10px] uppercase font-bold">{t('support.modal.assignedTo')}</span>
                    {selectedTicket.assignedAgent ? (
                      <div className="flex items-center gap-2.5 mt-1.5">
                        {selectedTicket.assignedAgent.avatarUrl && (
                          <img
                            src={selectedTicket.assignedAgent.avatarUrl}
                            alt={selectedTicket.assignedAgent.name}
                            className="w-7 h-7 rounded-full object-cover border border-[#E2E6DF]"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div>
                          <div className="font-bold text-[#0E0F0C]">{selectedTicket.assignedAgent.name}</div>
                          <div className="text-[10px] text-[#5E605D]">{selectedTicket.assignedAgent.role}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="font-semibold text-[#0E0F0C]">{t('support.modal.triageInProgress')}</span>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-[#E2E6DF]">
                    <span className="text-[#868685] block text-[10px] uppercase font-bold">{t('support.modal.categoryLabel')}</span>
                    <span className="font-bold text-[#0E0F0C] block mt-0.5">
                      {getCategoryLabel(selectedTicket.category)}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-[#E2E6DF]">
                    <span className="text-[#868685] block text-[10px] uppercase font-bold">{t('support.modal.tenantLabel')}</span>
                    <span className="font-semibold text-[#0E0F0C] block mt-0.5">
                      {resolveTicketInstName(selectedTicket)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Priority Management Box (SuperAdmin ONLY) */}
              {isSuperAdmin && (
                <div className="bg-white p-5 rounded-3xl border border-[#E2E6DF] space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black uppercase tracking-wider text-[#0E0F0C] font-['Outfit'] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#163300]" />
                      <span>{t('support.modal.priorityTitle')}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#5E605D] leading-relaxed">
                    {t('support.modal.priorityDesc')}
                  </p>

                  {/* Priority Selection Pills */}
                  <div className="grid grid-cols-2 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map((p) => {
                      const isSelected = selectedTicket.priority === p;
                      const pInfo = PRIORITY_CONFIG[p];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleUpdatePriority(p)}
                          className={`p-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? `${pInfo.badgeClass} ring-2 ring-[#163300]/20 shadow-xs`
                              : 'bg-[#F9FAF8] text-[#5E605D] border-[#E2E6DF] hover:bg-white hover:text-[#0E0F0C]'
                          }`}
                        >
                          {p === 'CRITICAL' && <Flame className="w-3 h-3 text-red-600" />}
                          <span>{getPriorityLabel(p)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Quick Actions */}
              <div className="bg-white p-5 rounded-3xl border border-[#E2E6DF] space-y-3 shadow-2xs">
                <div className="text-xs font-black uppercase tracking-wider text-[#0E0F0C] font-['Outfit']">
                  {t('support.modal.statusTitle')}
                </div>

                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' ? (
                  isSuperAdmin ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateTicketStatus(selectedTicket.id, 'RESOLVED');
                        }}
                        className="w-full py-3 px-4 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{t('support.modal.markResolvedBtn')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateTicketStatus(selectedTicket.id, 'CLOSED');
                        }}
                        className="w-full py-2.5 px-4 rounded-full bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#5E605D] hover:text-[#0E0F0C] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 border border-[#E2E6DF]"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{t('support.modal.closeTicketBtn')}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/60 rounded-2xl text-xs flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-[#163300] shrink-0" />
                      <div>
                        <span className="font-bold block">{t('support.modal.inAnalysisTitle')}</span>
                        <span className="text-[11px] text-[#2E4A1E]">
                          {t('support.modal.inAnalysisDesc')}
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block">{t('support.modal.finalizedTitle')}</span>
                        <span className="text-[11px] text-emerald-800">
                          {t('support.modal.finalizedDesc')}
                        </span>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleReopenTicket(selectedTicket.id)}
                        className="w-full py-3 px-4 rounded-full bg-[#163300] hover:bg-[#204500] text-[#9FE870] font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98"
                      >
                        <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                        <span>{t('support.modal.reopenTicketBtn')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>,
        document.body
      )}

      {/* Create Ticket Modal (Spacious modal, tenant only fills Subject, Category, Description and Contacts) */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-[#E2E6DF] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 sm:p-7 bg-[#163300] text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#9FE870] text-[#163300] flex items-center justify-center font-bold shadow-xs">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight">{t('support.createModal.title')}</h3>
                  <p className="text-xs text-[#E2E6DF]/80 mt-0.5">
                    {t('support.createModal.subtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTicketSubmit} className="p-6 sm:p-8 space-y-5">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0E0F0C] font-['Outfit'] block">
                  {t('support.createModal.subjectLabel')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('support.createModal.subjectPlaceholder')}
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm bg-[#F4F5F0] border border-[#E2E6DF] focus:border-[#9FE870] focus:bg-white rounded-2xl outline-hidden text-[#0E0F0C] transition-all"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0E0F0C] font-['Outfit'] block">
                  {t('support.createModal.categoryLabel')}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                  className="w-full px-4 py-3 text-xs sm:text-sm bg-[#F4F5F0] border border-[#E2E6DF] focus:border-[#9FE870] focus:bg-white rounded-2xl outline-hidden text-[#0E0F0C] font-medium cursor-pointer transition-all"
                >
                  <option value="DOMAINS_DNS">{t('support.categories.DOMAINS_DNS')}</option>
                  <option value="BILLING_LICENSES">{t('support.categories.BILLING_LICENSES')}</option>
                  <option value="CUSTOM_LICENSE_QUOTE">{t('support.categories.CUSTOM_LICENSE_QUOTE')}</option>
                  <option value="WORKSPACE_PROVISIONING">{t('support.categories.WORKSPACE_PROVISIONING')}</option>
                  <option value="ADDITIONAL_SERVICES">{t('support.categories.ADDITIONAL_SERVICES')}</option>
                  <option value="SECURITY_ACCESS">{t('support.categories.SECURITY_ACCESS')}</option>
                  <option value="GENERAL_QUESTION">{t('support.categories.GENERAL_QUESTION')}</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0E0F0C] font-['Outfit'] block">
                  {t('support.createModal.descLabel')}
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder={t('support.createModal.descPlaceholder')}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-4 text-xs sm:text-sm bg-[#F4F5F0] border border-[#E2E6DF] focus:border-[#9FE870] focus:bg-white rounded-2xl outline-hidden text-[#0E0F0C] resize-none transition-all leading-relaxed"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E2E6DF]">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5E605D] block">
                    {t('support.createModal.requesterNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-[#F4F5F0] border border-[#E2E6DF] focus:border-[#9FE870] focus:bg-white rounded-xl outline-hidden text-[#0E0F0C] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5E605D] block">
                    {t('support.createModal.requesterEmailLabel')}
                  </label>
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-[#F4F5F0] border border-[#E2E6DF] focus:border-[#9FE870] focus:bg-white rounded-xl outline-hidden text-[#0E0F0C] transition-all"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#E2E6DF]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2.5 rounded-full border border-[#E2E6DF] text-[#0E0F0C] hover:bg-[#F4F5F0] font-bold text-xs sm:text-sm cursor-pointer transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newSubject.trim() || !newDescription.trim()}
                  className="px-7 py-2.5 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] disabled:bg-gray-200 text-[#163300] disabled:text-gray-400 font-black text-xs sm:text-sm cursor-pointer shadow-xs transition-all active:scale-98"
                >
                  {isSubmitting ? t('support.createModal.submitting') : t('support.createModal.submitBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
