import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  ShieldCheck,
  Check,
  Copy,
  ArrowRight,
  ArrowLeft,
  Clock,
  HelpCircle,
  Users,
  ExternalLink,
  Globe,
  Sparkles,
  Building2,
  Send,
  CheckCircle2,
  Headphones,
  FileText,
  Lock,
  ChevronDown,
  Layers,
  Server,
  GraduationCap,
  Ticket,
  Menu,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { GoogleEducationPartnerBadge } from './auth/GoogleEducationPartnerBadge';
import type { SupportTicket, TicketCategory, TicketMessage } from '../types';
import {
  detectTicketLanguage,
  SupportedTicketLanguage,
  formatTicketContent,
} from '../lib/ticketSanitizer';

interface PublicContactPageProps {
  onNavigate: (path: string) => void;
  isUserLoggedIn?: boolean;
  onGoToLogin: () => void;
  onGoToRegister?: () => void;
  onGoToDashboard?: () => void;
  onSaveTicket?: (ticket: SupportTicket, isNew?: boolean) => void;
}

export const PublicContactPage: React.FC<PublicContactPageProps> = ({
  onNavigate,
  isUserLoggedIn = false,
  onGoToLogin,
  onGoToRegister,
  onGoToDashboard,
  onSaveTicket,
}) => {
  const { language } = useLanguage();
  const isPt = language === 'pt';
  const isEs = language === 'es';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navStrings = {
    navServices: isPt ? 'Serviços' : isEs ? 'Servicios' : 'Services',
    navInstitutions: isPt ? 'Instituições Atendidas' : isEs ? 'Instituciones' : 'Institutions',
    navSecurity: isPt ? 'Segurança & LGPD' : isEs ? 'Seguridad y Privacidad' : 'Security & LGPD',
    navPartner: isPt ? 'Google Partner' : isEs ? 'Google Partner' : 'Google Partner',
    navContact: isPt ? 'Contato' : isEs ? 'Contacto' : 'Contact',
    loginBtn: isPt ? 'Login' : isEs ? 'Iniciar Sesión' : 'Sign In',
    allRightsReserved: isPt
      ? 'Todos os direitos reservados.'
      : isEs
      ? 'Todos los derechos reservados.'
      : 'All rights reserved.',
  };

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedViaForm, setSubmittedViaForm] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const supportEmail = 'help@skoolia.net';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);

    const protocolNum = Math.floor(1000 + Math.random() * 9000);
    const protocol = `HS-${protocolNum}`;
    const newId = `tkt-hs-${protocolNum}-${Date.now()}`;
    const now = new Date().toISOString();

    const detectedLang = detectTicketLanguage(formData.message, formData.institution, (language as SupportedTicketLanguage) || 'pt');
    const ticketLang: SupportedTicketLanguage = language === 'en' || language === 'es' ? language : detectedLang;

    // Map topic to TicketCategory and formatted subject
    let category: TicketCategory = 'GENERAL_QUESTION';
    let subjectText = isPt ? 'Dúvidas Gerais' : isEs ? 'Consultas Generales' : 'General Inquiry';

    if (formData.subject === 'quote') {
      category = 'CUSTOM_LICENSE_QUOTE';
      subjectText = isPt ? 'Cotação de Licenças' : isEs ? 'Cotización de Licencias' : 'Custom License Quote';
    } else if (formData.subject === 'dns') {
      category = 'DOMAINS_DNS';
      subjectText = isPt ? 'Suporte Técnico & DNS' : isEs ? 'Soporte Técnico y DNS' : 'Technical & DNS Support';
    } else if (formData.subject === 'privacy') {
      category = 'SECURITY_ACCESS';
      subjectText = isPt ? 'Privacidade & Conformidade' : isEs ? 'Privacidad y Seguridad' : 'Privacy & Compliance';
    }

    const fullSubject = `[Contato Web] ${subjectText} - ${formData.institution.trim() || formData.name.trim()}`;

    const autoResponseMessages: Record<SupportedTicketLanguage, {
      senderName: string;
      agentRole: string;
      content: string;
    }> = {
      en: {
        senderName: 'Google Specialist Support',
        agentRole: 'Google Workspace Specialist',
        content: `Hello ${formData.name.trim() || 'Institution Contact'}! We have received your request with protocol #${protocol}. Our technical support team has been notified and is reviewing your case for your institution.`,
      },
      es: {
        senderName: 'Atención Especializada Google',
        agentRole: 'Especialista Google Workspace',
        content: `¡Hola ${formData.name.trim() || 'Contacto de la Institución'}! Hemos recibido su solicitud con protocolo #${protocol}. Nuestro equipo técnico de soporte ha sido notificado y está analizando el caso para su institución.`,
      },
      pt: {
        senderName: 'Atendimento Especializado Google',
        agentRole: 'Especialista Google Workspace',
        content: `Olá ${formData.name.trim() || 'Gestor da Instituição'}! Recebemos a sua solicitação com protocolo #${protocol}. Nosso time técnico de suporte já foi notificado e está analisando o caso para a sua instituição.`,
      },
    };

    const loc = autoResponseMessages[ticketLang] || autoResponseMessages.pt;

    const descriptionContent = `${formData.message.trim()}\n\n---\n📞 ${isPt ? 'Telefone / WhatsApp' : isEs ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'}: ${formData.phone.trim() || 'N/A'}\n🏫 ${isPt ? 'Instituição' : isEs ? 'Institución' : 'Institution'}: ${formData.institution.trim()}\n👤 ${isPt ? 'Solicitante' : isEs ? 'Solicitante' : 'Requester'}: ${formData.name.trim()} (${formData.email.trim()})`;

    const initialMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      senderName: formData.name.trim() || 'Contato da Instituição',
      senderEmail: formData.email.trim(),
      senderRole: 'USER',
      content: formatTicketContent(descriptionContent),
      timestamp: now,
    };

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
      subject: fullSubject,
      description: descriptionContent,
      category,
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      requesterName: formData.name.trim(),
      requesterEmail: formData.email.trim(),
      institutionName: formData.institution.trim() || (isPt ? 'Instituição de Ensino' : isEs ? 'Institución Educativa' : 'Educational Institution'),
      tenantId: undefined,
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

    // Save ticket in store & notify via server API
    try {
      await fetch('/api/support/create-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': ticketLang,
        },
        body: JSON.stringify({
          ticket: newTicket,
          tenantContacts: {
            primaryEmail: formData.email.trim(),
          },
          preferredLanguage: ticketLang,
          lang: ticketLang,
        }),
      });
    } catch (err) {
      console.warn('Erro ao disparar api de criação de ticket:', err);
    }

    if (onSaveTicket) {
      onSaveTicket(newTicket, true);
    }

    // Also keep local backup for public tickets
    try {
      const publicLocal = localStorage.getItem('skoolia_public_tickets');
      const list = publicLocal ? JSON.parse(publicLocal) : [];
      list.unshift(newTicket);
      localStorage.setItem('skoolia_public_tickets', JSON.stringify(list));
    } catch {
      // ignore
    }

    setSubmittedTicket(newTicket);
    setIsSubmitting(false);
    setSubmittedViaForm(true);
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      institution: '',
      email: '',
      phone: '',
      subject: 'general',
      message: '',
    });
    setSubmittedTicket(null);
    setSubmittedViaForm(false);
  };

  const departments = [
    {
      icon: Headphones,
      title: isPt
        ? 'Suporte Técnico & DNS Workspace'
        : isEs
        ? 'Soporte Técnico y DNS Workspace'
        : 'Technical & DNS Workspace Support',
      desc: isPt
        ? 'Auxílio na verificação de domínios, configuração de registros MX, SPF, DKIM, DMARC e ativação do console Google Workspace.'
        : isEs
        ? 'Asistencia en verificación de dominios, configuración de registros MX, SPF, DKIM, DMARC y activación de la consola.'
        : 'Assistance with domain verification, MX, SPF, DKIM, DMARC records setup, and Google Workspace console activation.',
      sla: isPt ? 'SLA prioritário em até 24h úteis' : isEs ? 'SLA prioritario en hasta 24h útiles' : 'Priority SLA within 24 business hours',
    },
    {
      icon: Sparkles,
      title: isPt
        ? 'Cotações & Licenciamento Customizado'
        : isEs
        ? 'Cotizaciones y Licenciamiento a Medida'
        : 'Quotes & Tailored Licensing',
      desc: isPt
        ? 'Planos institucionais sob medida para escolas e universidades que necessitam de mais de 200 contas ou condições contratuais especiais.'
        : isEs
        ? 'Planes a medida para escuelas y universidades que requieren más de 200 cuentas o acuerdos contractuales específicos.'
        : 'Tailored institutional plans for schools and universities requiring more than 200 accounts or special agreements.',
      sla: isPt ? 'Retorno comercial em até 2h úteis' : isEs ? 'Respuesta comercial en hasta 2h útiles' : 'Commercial response in under 2h',
    },
    {
      icon: Lock,
      title: isPt
        ? 'Privacidade, DPO & Conformidade LGPD'
        : isEs
        ? 'Privacidad, DPO y Cumplimiento Legal'
        : 'Privacy, DPO & Compliance',
      desc: isPt
        ? 'Canal direto com nosso Encarregado de Proteção de Dados (DPO) para termos de tratamento, segurança de menores e auditorias educacionais.'
        : isEs
        ? 'Canal directo con nuestro Oficial de Protección de Datos (DPO) para acuerdos de procesamiento de datos y auditorías.'
        : 'Direct channel with our Data Protection Officer (DPO) for data processing agreements, student safety, and audits.',
      sla: isPt ? 'Atendimento especializado' : isEs ? 'Atención especializada' : 'Specialized compliance team',
    },
    {
      icon: Layers,
      title: isPt
        ? 'Migração de Contas & Onboarding'
        : isEs
        ? 'Migración de Cuentas y Onboarding'
        : 'Account Migration & Onboarding',
      desc: isPt
        ? 'Planejamento para importação de alunos e professores a partir de cPanel, Microsoft 365, planilhas CSV ou servidores de e-mail legados.'
        : isEs
        ? 'Planificación para importar estudiantes y docentes desde cPanel, Microsoft 365, archivos CSV o servidores de correo heredados.'
        : 'Structured migration for students and faculty from cPanel, Microsoft 365, CSV files, or legacy email servers.',
      sla: isPt ? 'Planejamento guiado por especialistas' : isEs ? 'Planificación guiada por especialistas' : 'Specialist-guided onboarding',
    },
  ];

  const faqs = [
    {
      question: isPt
        ? 'Qual é o canal mais rápido para abrir um chamado técnico?'
        : isEs
        ? '¿Cuál es el canal más rápido para abrir un ticket técnico?'
        : 'What is the fastest channel to open a technical support ticket?',
      answer: isPt
        ? 'O canal mais rápido é a Central de Suporte dentro do Console Skoolia. Ao acessar sua conta, você pode abrir um ticket diretamente categorizado, o que direciona seu pedido automaticamente para os engenheiros responsáveis e permite acompanhar as respostas e alertas de e-mail em tempo real.'
        : isEs
        ? 'El canal más rápido es la Central de Soporte dentro de la Consola Skoolia. Al iniciar sesión en su cuenta, puede abrir un ticket categorizado, dirigiéndolo directamente a los ingenieros asignados y permitiéndole hacer seguimiento en tiempo real.'
        : 'The fastest channel is the Support Center inside the Skoolia Console. By signing in to your account, you can submit a categorized ticket that automatically routes to our engineers and allows you to track updates and email notifications in real time.',
    },
    {
      question: isPt
        ? 'Posso entrar em contato mesmo antes de ter uma conta criada?'
        : isEs
        ? '¿Puedo comunicarme incluso antes de tener una cuenta creada?'
        : 'Can I contact support before creating an account?',
      answer: isPt
        ? 'Sim! Você pode nos enviar uma mensagem a qualquer momento pelo e-mail help@skoolia.net ou preencher o formulário nesta página. Nossa equipe responde prontamente dúvidas pré-venda, cotações de licenças e orientações de elegibilidade do Google Workspace for Education.'
        : isEs
        ? '¡Sí! Puede enviarnos un mensaje en cualquier momento a través del correo help@skoolia.net o completando el formulario en esta página. Respondemos consultas previas, cotizaciones y orientación sobre elegibilidad de Google Workspace.'
        : 'Yes! You can email us anytime at help@skoolia.net or fill out the form on this page. Our team answers pre-sales questions, custom license quotes, and Google Workspace for Education eligibility guidelines promptly.',
    },
    {
      question: isPt
        ? 'Como funciona a solicitação de cotação para mais de 200 licenças?'
        : isEs
        ? '¿Cómo funciona la solicitud de cotización para más de 200 licencias?'
        : 'How do custom quotes for more than 200 licenses work?',
      answer: isPt
        ? 'O plano padrão inclui até 200 licenças de Google Workspace. Se a sua instituição precisa de volumes superiores (como 500, 1.000 ou mais contas para alunos, professores e equipe administrativa), basta entrar em contato informando o volume estimado. Nossa equipe comercial gera uma proposta sob medida com condições especiais para instituições educacionais.'
        : isEs
        ? 'El plan estándar incluye hasta 200 licencias. Si su institución requiere cantidades mayores (500, 1.000 o más cuentas), simplemente indíquenos la cantidad estimada. Generamos una propuesta a medida con condiciones preferenciales para instituciones educativas.'
        : 'The standard plan covers up to 200 licenses. If your institution requires larger volumes (such as 500, 1,000, or more accounts), simply share your estimated quantity. Our team will tailor a custom quote with preferential educational pricing.',
    },
    {
      question: isPt
        ? 'Qual é o horário de atendimento e os tempos médios de resposta?'
        : isEs
        ? '¿Cuál es el horario de atención y los tiempos promedio de respuesta?'
        : 'What are the operating hours and response times?',
      answer: isPt
        ? 'Nosso time de atendimento opera em dias úteis das 08h às 19h (Horário de Brasília). O tempo médio de primeira resposta para tickets no console é de menos de 2 horas úteis. Nossos sistemas de monitoramento de DNS e conectividade operam ininterruptamente (24/7/365).'
        : isEs
        ? 'Nuestro equipo opera en días hábiles de 08:00 a 19:00 (UTC-3). El tiempo promedio de primera respuesta en tickets de la consola es menor a 2 horas hábiles. La monitorización de DNS e infraestructura opera de forma ininterrumpida (24/7/365).'
        : 'Our specialist support team operates on business days from 08:00 to 19:00 (UTC-3). The average first response time for console tickets is under 2 business hours. Our DNS and infrastructure monitoring runs 24/7/365.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#0E0F0C] selection:bg-[#9FE870] selection:text-[#163300] flex flex-col justify-between">
      {/* Sticky Navigation Header matching the rest of the site */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E6DF] transition-all">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 cursor-pointer group shrink-0"
            >
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#163300] font-['Outfit'] tracking-tight group-hover:opacity-90 transition-opacity">
                skoolia
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-[#5E605D] ml-4">
              <button
                type="button"
                onClick={() => onNavigate('/#servicos')}
                className="px-3.5 py-2 rounded-lg hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
              >
                {navStrings.navServices}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/#instituicoes')}
                className="px-3.5 py-2 rounded-lg hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
              >
                {navStrings.navInstitutions}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/#seguranca')}
                className="px-3.5 py-2 rounded-lg hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
              >
                {navStrings.navSecurity}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/#partner')}
                className="px-3.5 py-2 rounded-lg hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
              >
                {navStrings.navPartner}
              </button>
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg font-bold text-[#163300] bg-[#F4F5F0] cursor-default"
              >
                {navStrings.navContact}
              </button>
            </nav>
          </div>

          {/* Right Header Controls: Language Selector + Login Action Button + Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <LanguageSelector variant="auth" />

            <button
              type="button"
              id="btn-nav-login"
              onClick={onGoToLogin}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3 sm:px-6 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 group whitespace-nowrap shrink-0"
            >
              <span>{navStrings.loginBtn}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5 shrink-0" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="md:hidden p-1.5 sm:p-2 rounded-full hover:bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] transition-colors cursor-pointer shrink-0"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <Menu className="w-5 h-5 stroke-[2.2]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E6DF] bg-white px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/#servicos');
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
            >
              {navStrings.navServices}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/#instituicoes');
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
            >
              {navStrings.navInstitutions}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/#seguranca');
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
            >
              {navStrings.navSecurity}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/#partner');
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
            >
              {navStrings.navPartner}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold text-[#163300] bg-[#F4F5F0]"
            >
              {navStrings.navContact}
            </button>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F7F9F5] to-[#FBFBFA] pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-[#E2E6DF]">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#9FE870]/15 rounded-full blur-3xl pointer-events-none -mt-20" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-[#163300]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F7DC] border border-[#9FE870]/60 text-[#163300] text-xs font-black tracking-wide font-['Outfit'] uppercase shadow-2xs">
              <Headphones className="w-3.5 h-3.5 text-[#163300]" />
              <span>
                {isPt
                  ? 'Canais Oficiais de Atendimento & Suporte'
                  : isEs
                  ? 'Canales Oficiales de Atención y Soporte'
                  : 'Official Support & Contact Channels'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight max-w-3xl mx-auto leading-[1.15]">
              {isPt
                ? 'Como podemos ajudar a sua instituição de ensino hoje?'
                : isEs
                ? '¿Cómo podemos ayudar a su institución educativa hoy?'
                : 'How can we assist your educational institution today?'}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[#5E605D] max-w-2xl mx-auto leading-relaxed">
              {isPt
                ? 'Estamos prontos para orientar gestores, TI educacional e administradores escolares. Abra um ticket com SLA priorizado no console ou envie um e-mail direto para nossa equipe técnica.'
                : isEs
                ? 'Estamos listos para orientar a directivos, TI educativa y administradores escolares. Abra un ticket con SLA prioritario en la consola o envíenos un correo directo.'
                : 'Ready to assist school directors, education IT specialists, and workspace administrators. Open a prioritized ticket in the console or contact our technical team directly.'}
            </p>
          </div>
        </section>

        {/* Unified Primary Contact Block */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-20">
          <div className="bg-[#163300] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#9FE870]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#9FE870]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Console Support & Features */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9FE870] text-[#163300] text-xs font-black uppercase tracking-wider font-['Outfit'] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isPt ? 'Canal Oficial de Atendimento' : isEs ? 'Canal Oficial de Atención' : 'Official Support Channel'}</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight text-white">
                    {isPt
                      ? 'Central de Chamados & Atendimento Técnico'
                      : isEs
                      ? 'Central de Tickets y Soporte Técnico'
                      : 'Support Ticket Desk & Direct Inquiries'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#E2E6DF]/85 leading-relaxed">
                    {isPt
                      ? 'Histórico centralizado, notificações automáticas por e-mail, respostas diretas de especialistas Google Partner e controle completo de status em tempo real.'
                      : isEs
                      ? 'Historial centralizado, notificaciones automáticas por correo, respuestas de especialistas Google Partner y control de estado en tiempo real.'
                      : 'Centralized ticket history, instant email notifications, certified Google Partner responses, and real-time SLA tracking.'}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs text-[#E2E6DF]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9FE870] shrink-0" />
                    <span>{isPt ? 'Triagem técnica automatizada por categoria de chamado' : isEs ? 'Clasificación técnica por categoría de ticket' : 'Categorized technical triage'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9FE870] shrink-0" />
                    <span>{isPt ? 'Histórico perpétuo de mensagens e protocolos' : isEs ? 'Historial continuo de mensajes y protocolos' : 'Full history of replies and protocols'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9FE870] shrink-0" />
                    <span>{isPt ? 'SLA prioritário de atendimento em até 8 horas úteis' : isEs ? 'SLA prioritario en hasta 8 horas hábiles' : 'Priority SLA within 8 business hours'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Direct Email & Info Card */}
              <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/15 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#9FE870] uppercase tracking-wider font-['Outfit']">
                    {isPt ? 'E-mail Oficial de Suporte' : isEs ? 'Correo Oficial de Soporte' : 'Official Support Inbox'}
                  </span>
                  <Mail className="w-4 h-4 text-[#9FE870]" />
                </div>

                <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-3">
                  <span className="font-mono font-bold text-sm text-white select-all truncate">
                    help@skoolia.net
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="h-8 px-3 rounded-full bg-white hover:bg-[#F4F5F0] text-[#163300] font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{isPt ? 'Copiado!' : isEs ? '¡Copiado!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#163300]" />
                        <span>{isPt ? 'Copiar' : isEs ? 'Copiar' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 text-[11px] text-[#E2E6DF]/85 pt-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#9FE870] shrink-0" />
                    <span>{isPt ? 'Tempo de resposta médio: menos de 2 horas úteis' : isEs ? 'Tiempo promedio de respuesta: menos de 2 horas hábiles' : 'Average response time: under 2 business hours'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-[#9FE870] shrink-0" />
                    <span>{isPt ? 'Atendimento fluente em Português, Espanhol e Inglês' : isEs ? 'Atención en Español, Portugués e Inglés' : 'Support in English, Portuguese, and Spanish'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Quick Contact Form & Info Grid */}
        <section className="bg-white border-y border-[#E2E6DF] py-16 sm:py-20 mt-12 sm:mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-start">
              {/* Left Column: Form Description & Guarantee */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F5F0] text-[#163300] text-xs font-bold font-['Outfit'] border border-[#E2E6DF]">
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPt ? 'Mensagem Direta' : isEs ? 'Mensaje Directo' : 'Direct Inquiries'}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                  {isPt
                    ? 'Abrir Chamado Técnico ou Solicitar Atendimento'
                    : isEs
                    ? 'Abrir Ticket Técnico o Solicitar Atención'
                    : 'Open Support Ticket or Request Assistance'}
                </h2>

                <p className="text-xs sm:text-sm text-[#5E605D] leading-relaxed">
                  {isPt
                    ? 'Preencha os dados abaixo para registrar um chamado direto na nossa central de atendimento. Nossa equipe de especialistas e o SuperAdmin receberão seu pedido com protocolo imediato.'
                    : isEs
                    ? 'Complete los datos a continuación para registrar un ticket directamente en nuestra central. Nuestro equipo de soporte y el SuperAdmin recibirán su solicitud con protocolo inmediato.'
                    : 'Fill in the details below to open a direct support ticket in our console. Our specialist team and SuperAdmin will receive your request with an immediate tracking protocol.'}
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="p-4 rounded-2xl bg-[#F7F9F5] border border-[#E2E6DF] space-y-1">
                    <span className="text-xs font-bold text-[#0E0F0C] block font-['Outfit']">
                      {isPt ? 'Horários de Operação da Equipe' : isEs ? 'Horarios de Operación' : 'Team Business Hours'}
                    </span>
                    <p className="text-xs text-[#5E605D] leading-relaxed">
                      {isPt
                        ? 'Segunda a Sexta: 08:00 às 19:00 (BRT / UTC-3).'
                        : isEs
                        ? 'Lunes a Viernes: 08:00 a 19:00 (UTC-3).'
                        : 'Monday to Friday: 08:00 to 19:00 (UTC-3).'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F7F9F5] border border-[#E2E6DF] space-y-1">
                    <span className="text-xs font-bold text-[#0E0F0C] block font-['Outfit']">
                      {isPt ? 'Disponibilidade de Monitoramento de DNS' : isEs ? 'Monitorización de DNS' : 'DNS Monitoring Availability'}
                    </span>
                    <p className="text-xs text-[#5E605D] leading-relaxed">
                      {isPt
                        ? 'Monitoramento ininterrupto 24/7/365 para entrega de e-mails institucionais e resolução de nomes.'
                        : isEs
                        ? 'Monitoreo continuo 24/7/365 para entrega de correos y resolución de dominios.'
                        : 'Continuous 24/7/365 telemetry for educational domain delivery and MX resolution.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <GoogleEducationPartnerBadge size="sm" />
                </div>
              </div>

              {/* Right Column: Contact Form */}
              <div className="lg:col-span-7 bg-[#FBFBFA] rounded-3xl p-6 sm:p-8 border border-[#E2E6DF] shadow-xs">
                {submittedViaForm && submittedTicket ? (
                  <div className="py-8 px-2 sm:px-4 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-3xl bg-[#E8F7DC] text-[#163300] flex items-center justify-center mx-auto shadow-xs border border-[#9FE870]/60">
                      <CheckCircle2 className="w-8 h-8 text-[#008a46]" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#163300] text-[#9FE870] text-xs font-black font-['Outfit'] tracking-wide shadow-2xs">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>{submittedTicket.protocol}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] text-[#0E0F0C] tracking-tight">
                        {isPt
                          ? 'Chamado Aberto com Sucesso!'
                          : isEs
                          ? '¡Ticket Abierto con Éxito!'
                          : 'Support Ticket Opened Successfully!'}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5E605D] max-w-md mx-auto leading-relaxed">
                        {isPt
                          ? 'Seu chamado foi registrado na Central de Atendimento Skoolia e encaminhado para o SuperAdmin e equipe técnica.'
                          : isEs
                          ? 'Su ticket fue registrado en la Central de Atención Skoolia y enviado al SuperAdmin y equipo técnico.'
                          : 'Your ticket has been registered in the Skoolia Support Center and routed to the SuperAdmin and technical team.'}
                      </p>
                    </div>

                    {/* Ticket Summary Card */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2E6DF] text-left space-y-2.5 max-w-md mx-auto shadow-2xs text-xs">
                      <div className="flex items-center justify-between border-b border-[#F4F5F0] pb-2">
                        <span className="text-[#868685] font-medium">{isPt ? 'Protocolo:' : isEs ? 'Protocolo:' : 'Protocol:'}</span>
                        <span className="font-mono font-bold text-[#163300]">{submittedTicket.protocol}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#F4F5F0] pb-2">
                        <span className="text-[#868685] font-medium">{isPt ? 'Instituição:' : isEs ? 'Institución:' : 'Institution:'}</span>
                        <span className="font-bold text-[#0E0F0C] truncate max-w-[220px]">{submittedTicket.institutionName}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#F4F5F0] pb-2">
                        <span className="text-[#868685] font-medium">{isPt ? 'Solicitante:' : isEs ? 'Solicitante:' : 'Requester:'}</span>
                        <span className="font-semibold text-[#0E0F0C]">{submittedTicket.requesterName}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#F4F5F0] pb-2">
                        <span className="text-[#868685] font-medium">{isPt ? 'E-mail de Retorno:' : isEs ? 'Correo de Contacto:' : 'Notification Email:'}</span>
                        <span className="font-semibold text-[#008a46]">{submittedTicket.requesterEmail}</span>
                      </div>
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[#868685] font-medium">{isPt ? 'Tempo de Resposta (SLA):' : isEs ? 'Tiempo de Respuesta (SLA):' : 'Response SLA:'}</span>
                        <span className="inline-flex items-center gap-1 font-bold text-[#163300] bg-[#E8F7DC] px-2 py-0.5 rounded-full text-[11px]">
                          <Clock className="w-3 h-3 text-[#163300]" />
                          {isPt ? 'Até 8 horas úteis' : isEs ? 'Hasta 8 horas hábiles' : 'Within 8 business hours'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#163300] hover:bg-[#204700] text-[#9FE870] font-bold text-xs cursor-pointer shadow-xs transition-all active:scale-98"
                      >
                        {isPt ? 'Abrir Outro Chamado' : isEs ? 'Abrir Otro Ticket' : 'Open Another Ticket'}
                      </button>
                      <button
                        type="button"
                        onClick={onGoToLogin}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white hover:bg-[#F4F5F0] text-[#0E0F0C] font-bold text-xs border border-[#D4DACF] cursor-pointer shadow-2xs transition-all active:scale-98"
                      >
                        {isPt ? 'Acessar Central / Login' : isEs ? 'Acceder al Portal / Iniciar Sesión' : 'Go to Console / Sign In'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0E0F0C] font-['Outfit'] block">
                          {isPt ? 'Seu Nome *' : isEs ? 'Su Nombre *' : 'Your Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={isPt ? 'Ex: Prof. Carlos Silva' : isEs ? 'Ej: Carlos Silva' : 'E.g., Dr. John Doe'}
                          className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#E2E6DF] focus:border-[#9FE870] rounded-xl outline-hidden text-[#0E0F0C] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0E0F0C] font-['Outfit'] block">
                          {isPt ? 'Instituição de Ensino *' : isEs ? 'Institución Educativa *' : 'School / Institution *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.institution}
                          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                          placeholder={isPt ? 'Ex: Colégio São Bento' : isEs ? 'Ej: Colegio San Benito' : 'E.g., Horizon Academy'}
                          className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#E2E6DF] focus:border-[#9FE870] rounded-xl outline-hidden text-[#0E0F0C] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0E0F0C] font-['Outfit'] block">
                          {isPt ? 'E-mail para Retorno *' : isEs ? 'Correo de Contacto *' : 'Work Email *'}
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={isPt ? 'admin@escola.edu.br' : isEs ? 'admin@colegio.edu' : 'admin@school.edu'}
                          className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#E2E6DF] focus:border-[#9FE870] rounded-xl outline-hidden text-[#0E0F0C] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0E0F0C] font-['Outfit'] block">
                          {isPt ? 'Telefone / WhatsApp' : isEs ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'}
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={isPt ? '+55 (11) 99999-9999' : isEs ? '+34 600 000 000' : '+1 (555) 000-0000'}
                          className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#E2E6DF] focus:border-[#9FE870] rounded-xl outline-hidden text-[#0E0F0C] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0E0F0C] font-['Outfit'] block">
                        {isPt ? 'Assunto Principal *' : isEs ? 'Asunto Principal *' : 'Topic *'}
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#E2E6DF] focus:border-[#9FE870] rounded-xl outline-hidden text-[#0E0F0C] font-medium cursor-pointer transition-all"
                      >
                        <option value="general">
                          {isPt ? 'Dúvidas Gerais / Atendimento' : isEs ? 'Consultas Generales' : 'General Inquiry'}
                        </option>
                        <option value="quote">
                          {isPt ? 'Cotação de Licenças (Acima de 200 contas)' : isEs ? 'Cotización de Licencias (> 200 cuentas)' : 'Custom License Quote (> 200 accounts)'}
                        </option>
                        <option value="dns">
                          {isPt ? 'Suporte Técnico, DNS ou Domínios' : isEs ? 'Soporte Técnico o Dominios DNS' : 'Technical DNS & Domain Support'}
                        </option>
                        <option value="privacy">
                          {isPt ? 'Privacidade, DPO ou Conformidade LGPD' : isEs ? 'Privacidad o Cumplimiento Legal' : 'Privacy & Compliance (LGPD/DPO)'}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0E0F0C] font-['Outfit'] block">
                        {isPt ? 'Detalhes da Mensagem *' : isEs ? 'Mensaje Detallado *' : 'Message *'}
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={
                          isPt
                            ? 'Conte-nos sobre a sua escola, número de alunos e qual orientação técnica você precisa...'
                            : isEs
                            ? 'Cuéntenos sobre su institución, cantidad de alumnos y la asistencia requerida...'
                            : 'Tell us about your school, student volume, and technical questions...'
                        }
                        className="w-full p-4 text-xs sm:text-sm bg-white border border-[#E2E6DF] focus:border-[#9FE870] rounded-xl outline-hidden text-[#0E0F0C] resize-none transition-all leading-relaxed"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 px-6 rounded-full bg-[#163300] hover:bg-[#204700] disabled:bg-[#163300]/60 text-[#9FE870] font-black text-xs sm:text-sm transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
                            <span>{isPt ? 'Abrindo Chamado...' : isEs ? 'Abriendo Ticket...' : 'Opening Ticket...'}</span>
                          </>
                        ) : (
                          <>
                            <Ticket className="w-4 h-4 text-[#9FE870]" />
                            <span>{isPt ? 'Abrir Chamado de Atendimento' : isEs ? 'Abrir Ticket de Atención' : 'Open Support Ticket'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Specialized Help Departments */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
              {isPt
                ? 'Departamentos Especializados de Atendimento'
                : isEs
                ? 'Departamentos Especializados de Atención'
                : 'Specialized Support Departments'}
            </h2>
            <p className="text-xs sm:text-sm text-[#5E605D] leading-relaxed">
              {isPt
                ? 'Cada solicitação enviada para nossa equipe é encaminhada diretamente ao especialista de domínio correspondente.'
                : isEs
                ? 'Cada solicitud se canaliza directamente hacia el especialista en la materia correspondiente.'
                : 'Every request sent to our team is routed directly to the appropriate domain specialist.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {departments.map((dept, idx) => {
              const Icon = dept.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-[#E2E6DF] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#E8F7DC] text-[#163300] flex items-center justify-center shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-['Outfit'] font-black text-base text-[#0E0F0C] leading-snug">
                      {dept.title}
                    </h3>
                    <p className="text-xs text-[#5E605D] leading-relaxed">
                      {dept.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#E2E6DF] text-[11px] font-bold text-[#163300] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#008a46] shrink-0" />
                    <span>{dept.sla}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Frequently Asked Inquiries (FAQ) */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
              {isPt
                ? 'Dúvidas Frequentes sobre Atendimento'
                : isEs
                ? 'Preguntas Frecuentes sobre Soporte'
                : 'Frequently Asked Questions'}
            </h2>
            <p className="text-xs sm:text-sm text-[#5E605D]">
              {isPt
                ? 'Respostas rápidas para as principais dúvidas de gestores escolares'
                : isEs
                ? 'Respuestas directas a las consultas más habituales'
                : 'Quick answers for educational administrators and IT leaders'}
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#E2E6DF] bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-['Outfit'] font-bold text-sm sm:text-base text-[#0E0F0C] hover:bg-[#F9FAF7] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#5E605D] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-[#5E605D] leading-relaxed border-t border-[#F0F2EB] pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Banner Call to Action */}
        <section className="bg-gradient-to-r from-[#163300] to-[#1F4500] text-white py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-['Outfit'] tracking-tight">
              {isPt
                ? 'Pronto para ativar o Google Workspace na sua escola?'
                : isEs
                ? '¿Listo para activar Google Workspace en su escuela?'
                : 'Ready to enable Google Workspace for your school?'}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#E2E6DF] max-w-2xl mx-auto leading-relaxed">
              {isPt
                ? 'Cadastre-se agora mesmo e receba até 200 contas Standard sem custo de implantação, com suporte técnico e validação de domínio inclusos.'
                : isEs
                ? 'Regístrese hoy mismo y obtenga hasta 200 cuentas Standard sin costo de implementación, con soporte técnico y validación DNS.'
                : 'Sign up now and receive up to 200 Standard accounts with zero setup fee, including technical support and DNS domain validation.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onGoToRegister || onGoToLogin}
                className="w-full sm:w-auto h-12 px-7 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] font-black text-xs sm:text-sm transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isPt ? 'Criar Conta Institucional Gratuita' : isEs ? 'Crear Cuenta Institucional Gratis' : 'Create Free School Account'}</span>
                <ArrowRight className="w-4 h-4 text-[#163300]" />
              </button>
              <button
                type="button"
                onClick={onGoToLogin}
                className="w-full sm:w-auto h-12 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isPt ? 'Já possuo conta (Entrar)' : isEs ? 'Ya tengo cuenta (Acceder)' : 'Already have an account (Sign In)'}</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer matching HomePage & site standards */}
      <footer className="w-full bg-[#F4F5F0] border-t border-[#E2E6DF] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 text-xs text-[#5E605D]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left">
          {/* Brand & Address (Centered on mobile, left-aligned on desktop) */}
          <div className="flex flex-col items-center md:items-start gap-1.5 w-full md:w-auto">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
              <span className="text-2xl font-black text-[#163300] font-['Outfit'] tracking-tight">
                skoolia
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-[#0E0F0C]">
                © {new Date().getFullYear()} InternetByMOL LLC.
              </span>
              <span className="text-[#868685]">{navStrings.allRightsReserved}</span>
            </div>
            <p className="text-[11px] text-[#868685] text-center md:text-left">
              3101 North Central Avenue, Phoenix, 85012, {isPt ? 'Estados Unidos' : isEs ? 'Estados Unidos' : 'United States'}
            </p>
          </div>

          {/* Navigation, Legal Links & Support Actions (Centered on mobile, right-aligned on desktop) */}
          <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-3 sm:gap-x-4 gap-y-2 text-xs">
              <a
                href="/legal/privacy/terms"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/legal/privacy/terms');
                }}
                className="text-[#5E605D] hover:text-[#0E0F0C] hover:underline cursor-pointer transition-colors"
              >
                {isPt ? 'Política de Privacidade' : isEs ? 'Política de Privacidad' : 'Privacy Policy'}
              </a>

              <span className="text-[#D5D8D0]">•</span>

              <a
                href="/legal/terms"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/legal/terms');
                }}
                className="text-[#5E605D] hover:text-[#0E0F0C] hover:underline cursor-pointer transition-colors"
              >
                {isPt ? 'Termos de Serviço' : isEs ? 'Términos de Servicio' : 'Terms of Service'}
              </a>

              <span className="text-[#D5D8D0]">•</span>

              <a
                href="/contracts"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contracts');
                }}
                className="text-[#5E605D] hover:text-[#0E0F0C] hover:underline cursor-pointer transition-colors"
              >
                {isPt ? 'Contratos' : isEs ? 'Contratos' : 'Contracts'}
              </a>

              <span className="text-[#D5D8D0]">•</span>

              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[#5E605D] hover:text-[#0E0F0C] hover:underline cursor-pointer transition-colors font-medium text-[#163300] font-bold"
              >
                {isPt ? 'Contato & Suporte' : isEs ? 'Contacto y Soporte' : 'Contact & Support'}
              </a>
            </div>

            {/* Support Email */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-[11px] sm:text-xs">
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
        </div>
      </footer>
    </div>
  );
};
