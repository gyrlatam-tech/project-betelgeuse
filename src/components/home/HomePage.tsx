import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Globe,
  Server,
  Sparkles,
  Users,
  Layers,
  Lock,
  Mail,
  FileText,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Headphones,
  GraduationCap,
  Briefcase,
  Menu,
  X,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Award,
  Zap,
  Sliders,
  Clock,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';
import { TermsOfServiceModal } from '../auth/TermsOfServiceModal';
import { HERO_PERSON_IMAGE } from '../../assets/images';

interface HomePageProps {
  onGoToLogin: () => void;
  onGoToContracts?: () => void;
  onGoToPrivacy?: () => void;
  onGoToTerms?: () => void;
  onGoToContact?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onGoToLogin,
  onGoToContracts,
  onGoToPrivacy,
  onGoToTerms,
  onGoToContact,
}) => {
  const { t, language } = useLanguage();
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Typewriter dynamic phrase rotation (inspired by Tropical Hub's "com relacionamento|")
  const isPt = language === 'pt';
  const isEs = language === 'es';

  const phrases = useMemo(() => {
    if (isPt) {
      return [
        'com inteligência',
        'com escala',
        'com segurança',
        'com tecnologia',
        'com Workspace',
      ];
    }
    if (isEs) {
      return [
        'con inteligencia',
        'con escala',
        'con seguridad',
        'con tecnología',
        'con Workspace',
      ];
    }
    return [
      'with intelligence',
      'with scale',
      'with security',
      'with technology',
      'with Workspace',
    ];
  }, [isPt, isEs]);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState(phrases[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setPhraseIndex(0);
    setCurrentText(phrases[0]);
    setIsDeleting(false);
  }, [phrases]);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const phrase = phrases[phraseIndex % phrases.length];

    if (!isDeleting) {
      if (currentText !== phrase) {
        timerId = setTimeout(() => {
          setCurrentText(phrase.slice(0, currentText.length + 1));
        }, 90);
      } else {
        // Phrase fully typed; pause for 2.8s before starting deletion
        timerId = setTimeout(() => {
          setIsDeleting(true);
        }, 2800);
      }
    } else {
      if (currentText.length > 0) {
        timerId = setTimeout(() => {
          setCurrentText(phrase.slice(0, currentText.length - 1));
        }, 45);
      } else {
        // Fully deleted; switch to next phrase cleanly
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timerId);
  }, [currentText, isDeleting, phraseIndex, phrases]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 120);
      }
    }
  }, []);

  const scrollToSection = (id: string) => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const strings = {
    navAbout: isPt ? 'SOBRE NÓS' : isEs ? 'SOBRE NOSOTROS' : 'ABOUT US',
    navSmartSolutions: isPt ? 'SOLUÇÕES SMART' : isEs ? 'SOLUCIONES SMART' : 'SMART SOLUTIONS',
    navWorkspace: 'GOOGLE WORKSPACE',
    navCases: isPt ? 'CASES & CONTEÚDO' : isEs ? 'CASES Y CONTENIDO' : 'CASES & CONTENT',
    navContact: isPt ? 'CONTATO' : isEs ? 'CONTACTO' : 'CONTACT',
    ctaLogin: isPt ? 'LOGIN' : isEs ? 'INICIAR SESIÓN' : 'LOGIN',
    heroLine1: isPt ? 'Inove experiências' : isEs ? 'Innova experiencias' : 'Innovate experiences',
    heroSubtitle: isPt
      ? 'Ecossistemas digitais inteligentes para negócios e instituições orientadas ao futuro.'
      : isEs
      ? 'Ecosistemas digitales inteligentes para organizaciones e instituciones orientadas al futuro.'
      : 'Intelligent digital ecosystems for future-oriented institutions and organizations.',
    heroCasesBtn: isPt ? 'CONHEÇA NOSSOS CASES' : isEs ? 'CONOZCA NUESTROS CASES' : 'EXPLORE OUR CASES',
    heroTrialBtn: isPt ? '30 DIAS GRÁTIS' : isEs ? '30 DÍAS GRATIS' : '30 DAYS FREE',

    // Hero Floating Google Workspace Badges
    badgeClassroomTitle: 'Classroom',
    badgeClassroomSub: isPt ? 'Gestão de Turmas' : isEs ? 'Gestión de Clases' : 'Class Management',
    badgeGeminiTitle: 'Gemini',
    badgeGeminiSub: isPt ? 'Inteligência Google' : isEs ? 'Inteligencia Google' : 'Google AI Engine',
    badgeGmailTitle: isPt ? 'Gmail Seguro' : isEs ? 'Gmail Seguro' : 'Secure Gmail',
    badgeGmailSub: isPt ? 'Domínio Próprio' : isEs ? 'Dominio Propio' : 'Custom Domain',
    badgeMeetTitle: 'Google Meet',
    badgeMeetSub: isPt ? 'Aulas ao Vivo' : isEs ? 'Clases en Vivo' : 'Live Video Classes',
    badgeDriveTitle: 'Drive & Docs',
    badgeDriveSub: isPt ? 'Nuvem Ilimitada' : isEs ? 'Nube Ilimitada' : 'Cloud Storage',

    // Solutions Section
    solutionsTag: isPt ? 'SOLUÇÕES SMART' : isEs ? 'SOLUCIONES SMART' : 'SMART SOLUTIONS',
    solutionsTitle: isPt
      ? 'Conectamos estratégia, dados e tecnologia'
      : isEs
      ? 'Conectamos estrategia, datos y tecnología'
      : 'Connecting strategy, data, and technology',
    solutionsSubtitle: isPt
      ? 'Desenvolvemos soluções para impulsionar a gestão de Google Workspace, garantindo produtividade para docentes, alunos e administradores com máxima governança.'
      : isEs
      ? 'Desarrollamos soluciones para impulsar la gestión de Google Workspace, garantizando productividad para docentes, alumnos y administradores con la máxima gobernanza.'
      : 'Tailored digital solutions to streamline Google Workspace management, security, and institutional scaling.',
    learnMoreBtn: isPt ? 'Conhecer Solução' : isEs ? 'Conocer Solución' : 'Learn More',

    // Methodology Section
    methodologyTag: isPt ? 'METODOLOGIA SKOOLIA' : isEs ? 'METODOLOGÍA SKOOLIA' : 'SKOOLIA METHODOLOGY',
    methodologyTitle: isPt ? 'Future-driven, feito por gente.' : isEs ? 'Future-driven, hecho por personas.' : 'Future-driven, built by people.',
    methodologySubtitle: isPt
      ? 'Aliamos inteligência tecnológica e processos estruturados com a atenção humana de engenheiros especializados para cuidar do ambiente digital da sua escola.'
      : isEs
      ? 'Combinamos inteligencia tecnológica y procesos estructurados con la atención humana de ingenieros especializados para cuidar el entorno digital de su institución.'
      : 'Combining cloud architecture, security automation, and human expertise to scale educational technology.',
    talkToConsultantBtn: isPt ? 'FALAR COM UM CONSULTOR' : isEs ? 'HABLAR CON UN CONSULTOR' : 'TALK TO A CONSULTANT',

    // Economics Section
    economyTag: isPt ? 'MODELO DE ECONOMIA & SUBSÍDIOS' : isEs ? 'MODELO DE ECONOMÍA Y SUBSIDIOS' : 'EDUCATION SUBSIDIES & COST ADVANTAGE',
    economyTitle: isPt
      ? 'Como a Skoolia reduz em até 65% seus custos com Workspace'
      : isEs
      ? 'Cómo Skoolia reduce hasta un 65% sus costos de Workspace'
      : 'How Skoolia reduces up to 65% of your Workspace expenditure',
    economySubtitle: isPt
      ? 'Acesso direto a tabelas de faturamento corporativo e elegibilidade Google for Education. Faturamento local transparente, sem surpresas cambiais e com 30 dias de isenção total.'
      : isEs
      ? 'Acceso directo a tablas de facturación corporativa y elegibilidad Google for Education. Facturación local transparente, sin sorpresas cambiarias y con 30 días de prueba gratuita sin riesgo.'
      : 'Direct eligibility for Google for Education discounted pricing tiers, local billing without FX surprises, and full 30-day initial trial.',

    pillar1Title: isPt ? 'Tarifas Subsidiadas de Revenda' : isEs ? 'Tarifas Subsidiadas de Distribuidor' : 'Direct Authorized Reseller Rates',
    pillar1Desc: isPt
      ? 'Descontos de volume consolidados repassados diretamente à sua escola. Economia média comprovada de US$ 3,60/usuário/mês em relação à tabela comercial avulsa do Google.'
      : isEs
      ? 'Descuentos por volumen consolidados transferidos directamente a su institución. Ahorro promedio comprobado de US$ 3,60/usuario/mes en comparación con la lista comercial de Google.'
      : 'Volume discounts transferred directly to your organization, saving up to $3.60/user/mo over standard retail lists.',
    pillar1MetricLabel: isPt ? 'Margem Reinvestível' : isEs ? 'Margen Reinvertible' : 'Budget Efficiency',

    pillar2Title: isPt ? '30 Dias de Isenção Completa' : isEs ? '30 Días de Prueba Gratuita' : 'Full 30-Day Zero-Risk Trial',
    pillar2Desc: isPt
      ? 'Valide o ambiente com professores e turmas piloto antes de qualquer cobrança. Sem necessidade de cartão de crédito prévio e sem multas de cancelamento.'
      : isEs
      ? 'Valide el entorno con docentes y grupos piloto antes de cualquier cobro. Sin necesidad de tarjeta de crédito previa y sin cláusulas de cancelación.'
      : 'Pilot the workspace with teachers and student groups before paying anything. Zero upfront credit card obligation.',
    pillar2MetricLabel: isPt ? 'Período de Teste' : isEs ? 'Período de Prueba' : 'Trial Window',
    pillar2MetricValue: isPt ? '30 Dias Grátis' : isEs ? '30 Días Gratis' : '30 Days Free',

    pillar3Title: isPt ? 'Suporte & Engenharia Inclusos' : isEs ? 'Soporte e Ingeniería Incluidos' : 'Included DNS & SLA Support',
    pillar3Desc: isPt
      ? 'Configuração de DNS (SPF, DKIM, DMARC), provisionamento em lote e suporte com SLA de 2 horas úteis já inclusos na subscrição, sem consultorias extras.'
      : isEs
      ? 'Configuración de DNS (SPF, DKIM, DMARC), aprovisionamiento masivo y soporte con SLA de 2 horas hábiles incluidos en la suscripción, sin costos extra.'
      : 'Turnkey DNS setup, security audits, and dedicated ticket desk with under 2-hour SLA included with zero hidden setup fees.',
    pillar3MetricLabel: isPt ? 'Custo de Setup' : isEs ? 'Costo de Configuración' : 'Setup Fee',
    pillar3MetricValue: isPt ? 'R$ 0,00' : isEs ? '$0,00' : '$0.00',

    quoteBannerTag: isPt ? 'CONSULTORIA DE CUSTOS PERSONALIZADA' : isEs ? 'CONSULTORÍA DE COSTOS PERSONALIZADA' : 'CUSTOM INSTITUTIONAL QUOTE',
    quoteBannerTitle: isPt
      ? 'Precisa de cotação para mais de 500 contas ou rede de polos?'
      : isEs
      ? '¿Necesita cotización para más de 500 cuentas o red de sedes?'
      : 'Need a customized quote for over 500 accounts or multi-campus networks?',
    quoteBannerDesc: isPt
      ? 'Nossa equipe avalia a elegibilidade para licenças Education Fundamentals e upgrades Plus.'
      : isEs
      ? 'Nuestro equipo evalúa la elegibilidad para licencias Education Fundamentals y actualizaciones Plus.'
      : 'Our certified engineers verify eligibility for Google Education Fundamentals and Plus.',

    // Cases Section
    casesTag: isPt ? 'CASES DE SUCESSO' : isEs ? 'CASOS DE ÉXITO' : 'SUCCESS STORIES',
    casesTitle: isPt ? 'Quem já inovou sua experiência' : isEs ? 'Quién ya transformó su experiencia' : 'Success Stories & Impact',
    casesSubtitle: isPt
      ? 'Resultados reais em escolas e instituições que migraram para o ecossistema Skoolia.'
      : isEs
      ? 'Resultados reales en escuelas e instituciones que migraron al ecosistema Skoolia.'
      : 'Real outcomes from schools and institutions using Skoolia.',
    case1Quote: isPt
      ? '"Migramos mais de 1.200 alunos em menos de 48 horas. A equipe de suporte resolveu nossos registros MX e SPF no mesmo dia."'
      : isEs
      ? '"Migramos más de 1.200 estudiantes en menos de 48 horas. El equipo de soporte resolvió nuestros registros MX y SPF el mismo día."'
      : '"We migrated over 1,200 student accounts seamlessly in under 48 hours. The support desk is unmatched."',
    case1Author: 'Prof. Rodrigo Mendes',
    case1Role: isPt ? 'Diretor de Tecnologia Educacional' : isEs ? 'Director de Tecnología Educativa' : 'Educational Technology Director',

    case2Quote: isPt
      ? '"A facilidade para delegar unidades organizacionais e controlar acessos de professores nos deu total conformidade com a LGPD."'
      : isEs
      ? '"La facilidad para delegar unidades organizacionales y controlar accesos de docentes nos dio total cumplimiento de normativas de privacidad."'
      : '"Granular OU delegation and automated licensing gave our administrative board complete peace of mind."',
    case2Author: 'Dra. Camila Vasconcelos',
    case2Role: isPt ? 'Coordenadora Geral & DPO' : isEs ? 'Coordinadora General y DPO' : 'General Coordinator & DPO',

    case3Quote: isPt
      ? '"Economizamos mais de 50% nos custos de licenças Google Workspace com o plano subsidiado e atendimento em português."'
      : isEs
      ? '"Ahorramos más del 50% en los costos de licencias de Google Workspace con el plan subsidiado y soporte especializado."'
      : '"Subsidized educational rates allowed us to redirect thousands of dollars back into classroom equipment."',
    case3Author: 'Marcos Antunes',
    case3Role: isPt ? 'Gestor Administrativo & Financeiro' : isEs ? 'Gestor Administrativo y Financiero' : 'Administrative & Financial Manager',

    // Partner Section
    partnerTitle: 'Google Workspace Premier Partner',
    partnerSubtitle: isPt
      ? 'Nossos consultores possuem certificações oficiais Google Cloud e Google Workspace para garantir excelência operacional e conformidade integral à LGPD.'
      : isEs
      ? 'Nuestros consultores cuentan con certificaciones oficiales de Google Cloud y Google Workspace para garantizar excelencia operativa y cumplimiento normativo integral.'
      : 'Certified Google Cloud & Google Workspace engineers providing enterprise-grade uptime and deployment security.',

    // Bottom CTA
    bottomTag: isPt ? 'PRÓXIMO PASSO' : isEs ? 'PRÓXIMO PASO' : 'NEXT STEP',
    bottomTitle: isPt ? 'Bora crescer com inteligência?' : isEs ? '¿Listo para crecer con inteligencia?' : 'Ready to grow with intelligence?',
    bottomSubtitle: isPt
      ? 'Inicie com 30 dias grátis para centralizar domínios, e-mails de alunos e professores, Google Classroom e unidades organizacionais.'
      : isEs
      ? 'Comience con 30 días gratis para centralizar dominios, correos de estudiantes y docentes, Google Classroom y unidades organizativas.'
      : 'Start your 30-day free trial to centralize domains, student accounts, and organizational units.',
    talkToSpecialistBtn: isPt ? 'FALAR COM UM ESPECIALISTA' : isEs ? 'HABLAR CON UN ESPECIALISTA' : 'TALK TO A SPECIALIST',

    // Footer
    footerTagline: isPt
      ? 'Ecossistemas inteligentes de Google Workspace para instituições de ensino.'
      : isEs
      ? 'Ecosistemas inteligentes de Google Workspace para instituciones educativas.'
      : 'Intelligent Google Workspace ecosystems for educational institutions.',
    footerTerms: isPt ? 'Termos de Uso' : isEs ? 'Términos de Uso' : 'Terms of Service',
    footerPrivacy: isPt ? 'Privacidade & LGPD' : isEs ? 'Privacidad y Normativas' : 'Privacy & LGPD',
    footerSupport: isPt ? 'Central de Suporte' : isEs ? 'Centro de Soporte' : 'Support Desk',
    footerRights: isPt ? 'Todos os direitos reservados.' : isEs ? 'Todos los derechos reservados.' : 'All rights reserved.',
  };

  const smartSolutions = [
    {
      num: '01',
      tag: isPt ? 'PROVISIONAMENTO & REVOPS' : isEs ? 'APROVISIONAMIENTO Y REVOPS' : 'PROVISIONING & REVOPS',
      title: isPt
        ? 'Gestão Inteligente de Domínios e Contas'
        : isEs
        ? 'Gestión Inteligente de Dominios y Cuentas'
        : 'Smart Domain & Account Lifecycle',
      description: isPt
        ? 'Automação para importação em lote de alunos e professores, sincronização de OUs, Google Classroom e delegação granular com conformidade total.'
        : isEs
        ? 'Automatización para importación masiva de estudiantes y docentes, sincronización de Classroom y delegación con total privacidad.'
        : 'Automated batch provisioning for faculty and students, Google Classroom sync, and granular administrative delegation.',
      icon: Users,
    },
    {
      num: '02',
      tag: isPt ? 'GOOGLE CLOUD & INFRA' : isEs ? 'GOOGLE CLOUD E INFRA' : 'GOOGLE CLOUD & INFRA',
      title: isPt
        ? 'Engenharia de DNS & Alta Disponibilidade'
        : isEs
        ? 'Ingeniería de DNS y Alta Disponibilidad'
        : 'DNS Engineering & 99.9% High Availability',
      description: isPt
        ? 'Validação instantânea e diagnósticos de MX, SPF, DKIM, DMARC e roteamento de e-mails para máxima entregabilidade e blindagem contra spoofing.'
        : isEs
        ? 'Validación instantánea y diagnóstico de registros MX, SPF, DKIM, DMARC para máxima entregabilidad y protección contra suplantación.'
        : 'Instant telemetry and diagnostics for MX, SPF, DKIM, and DMARC records to maximize inbox delivery and prevent spoofing.',
      icon: Server,
    },
    {
      num: '03',
      tag: isPt ? 'SUPORTE ESPECIALIZADO' : isEs ? 'SOPORTE ESPECIALIZADO' : 'SPECIALIZED SUPPORT',
      title: isPt
        ? 'SLA Prioritário com Especialistas Certificados'
        : isEs
        ? 'SLA Prioritario con Especialistas Certificados'
        : 'Priority SLA with Certified Google Specialists',
      description: isPt
        ? 'Canal exclusivo no console com atendimento humano direto em menos de 2 horas úteis. Central de chamados com protocolo e histórico contínuo.'
        : isEs
        ? 'Canal exclusivo en la consola con atención humana directa en menos de 2 horas hábiles. Central de tickets con protocolo y trazabilidad.'
        : 'Direct console support desk answering in under 2 business hours. Full ticket tracking, dedicated specialist triage, and escalation.',
      icon: Headphones,
    },
    {
      num: '04',
      tag: isPt ? 'DPO & SEGURANÇA' : isEs ? 'DPO Y SEGURIDAD' : 'DPO & COMPLIANCE',
      title: isPt
        ? 'Conformidade Integral LGPD & Proteção de Menores'
        : isEs
        ? 'Cumplimiento Legal LGPD y Protección de Menores'
        : 'Full LGPD Compliance & Student Data Protection',
      description: isPt
        ? 'Termos contratuais de tratamento de dados educacionais, criptografia AES-256 e TLS 1.3, autenticação de dois fatores e auditorias de conformidade.'
        : isEs
        ? 'Contratos de tratamiento de datos educativos, cifrado AES-256 y TLS 1.3, doble factor y auditorías continuas.'
        : 'Institutional data protection agreements, AES-256 and TLS 1.3 encryption, two-step verification, and educational compliance audits.',
      icon: ShieldCheck,
    },
  ];

  const methodologySteps = [
    {
      step: '01',
      title: isPt ? 'Diagnóstico & Triagem' : isEs ? 'Diagnóstico y Triaje' : 'Diagnosis & Assessment',
      desc: isPt
        ? 'Análise técnica da arquitetura atual, servidores de e-mail e planejamento de elegibilidade Google Workspace.'
        : isEs
        ? 'Análisis técnico de infraestructura, servidores de correo y verificación de elegibilidad de Google Workspace.'
        : 'Technical evaluation of existing email servers and Google Workspace educational discount verification.',
    },
    {
      step: '02',
      title: isPt ? 'Migração & Configuração DNS' : isEs ? 'Migración y DNS' : 'Migration & DNS Setup',
      desc: isPt
        ? 'Verificação do domínio institucional, configuração de registros MX/SPF/DKIM e validação sem interrupção de serviços.'
        : isEs
        ? 'Verificación del dominio, configuración de registros MX/SPF/DKIM y validación sin caída de servicios.'
        : 'Domain verification, MX/SPF/DKIM configuration, and seamless transition with zero service downtime.',
    },
    {
      step: '03',
      title: isPt ? 'Provisionamento & Ativação' : isEs ? 'Aprovisionamiento' : 'Provisioning & Onboarding',
      desc: isPt
        ? 'Criação estruturada das contas de alunos, professores e coordenação com 30 dias grátis para homologação pedagógica.'
        : isEs
        ? 'Creación estructurada de cuentas para estudiantes, docentes y directivos con 30 días gratuitos.'
        : 'Structured rollout of student and faculty accounts with 30-day free institutional onboarding.',
    },
    {
      step: '04',
      title: isPt ? 'Governança & Suporte 24/7' : isEs ? 'Gobernanza y Soporte' : 'Governance & 24/7 Care',
      desc: isPt
        ? 'Acompanhamento perpétuo, monitoramento contínuo da infraestrutura e suporte ágil com nossos consultores.'
        : isEs
        ? 'Monitoreo ininterrumpido de infraestructura y atención ágil con consultores dedicados.'
        : 'Continuous domain telemetry, SLA monitoring, and dedicated certified engineer support desk.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0E0F0C] flex flex-col selection:bg-[#9FE870] selection:text-[#163300] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION (Separated larger Logo on Left, Centered Menu, Actions on Right) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between relative">
          {/* Left: Original Skoolia Logo - Bigger, bolder and isolated on the left */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center cursor-pointer group select-none bg-transparent border-0 p-0"
            >
              <span className="text-3xl sm:text-4xl md:text-[38px] font-black text-[#163300] font-['Outfit'] tracking-tighter group-hover:opacity-90 transition-opacity">
                skoolia
              </span>
            </button>
          </div>

          {/* Center: Desktop Navigation Links (Mathematically Centered) */}
          <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 gap-5 xl:gap-8 text-[12px] xl:text-[13px] font-bold tracking-wider text-[#0E0F0C] uppercase whitespace-nowrap">
            {/* Link 1: Sobre Nós */}
            <button
              type="button"
              onClick={() => scrollToSection('metodologia')}
              className="py-2 hover:text-[#008a46] transition-colors cursor-pointer whitespace-nowrap"
            >
              {strings.navAbout}
            </button>

            {/* Link 2: Soluções Smart */}
            <button
              type="button"
              onClick={() => scrollToSection('solucoes')}
              className="py-2 hover:text-[#008a46] transition-colors cursor-pointer whitespace-nowrap"
            >
              {strings.navSmartSolutions}
            </button>

            {/* Link 3: Google Workspace */}
            <button
              type="button"
              onClick={() => scrollToSection('partner')}
              className="py-2 hover:text-[#008a46] transition-colors cursor-pointer whitespace-nowrap"
            >
              {strings.navWorkspace}
            </button>

            {/* Link 4: Cases */}
            <button
              type="button"
              onClick={() => scrollToSection('cases')}
              className="py-2 hover:text-[#008a46] transition-colors cursor-pointer whitespace-nowrap"
            >
              {strings.navCases}
            </button>

            {/* Link 5: Contato */}
            <button
              type="button"
              onClick={onGoToContact || (() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/contact');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              })}
              className="py-2 hover:text-[#008a46] transition-colors cursor-pointer whitespace-nowrap"
            >
              {strings.navContact}
            </button>
          </nav>

          {/* Right Header: CTA Button (LOGIN) + Language Selector + Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto z-10">
            <LanguageSelector variant="compact" className="scale-90 sm:scale-100 origin-right" />

            {/* Login Button in standard Skoolia Green */}
            <button
              type="button"
              id="btn-nav-login"
              onClick={onGoToLogin}
              className="inline-flex items-center justify-center h-8 sm:h-10 px-3.5 sm:px-6 rounded-lg bg-[#9FE870] hover:bg-[#8edb5f] text-[#163300] font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
            >
              <span>{strings.ctaLogin}</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer - Adjusted for flawless alignment and spacing */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white/98 backdrop-blur-xl px-4 py-4 space-y-1 shadow-2xl animate-in slide-in-from-top-2 duration-150">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                scrollToSection('metodologia');
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold tracking-wider text-slate-800 uppercase transition-colors"
            >
              {strings.navAbout}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                scrollToSection('solucoes');
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold tracking-wider text-slate-800 uppercase transition-colors"
            >
              {strings.navSmartSolutions}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                scrollToSection('partner');
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold tracking-wider text-slate-800 uppercase transition-colors"
            >
              {strings.navWorkspace}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                scrollToSection('cases');
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold tracking-wider text-slate-800 uppercase transition-colors"
            >
              {strings.navCases}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onGoToContact) {
                  onGoToContact();
                } else if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/contact');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold tracking-wider text-[#008a46] uppercase transition-colors"
            >
              {strings.navContact}
            </button>

            {/* Mobile Drawer Direct Login Action */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onGoToLogin();
                }}
                className="w-full h-11 rounded-xl bg-[#9FE870] hover:bg-[#8edb5f] text-[#163300] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center shadow-xs"
              >
                <span>{strings.ctaLogin}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. THE SIGNATURE TROPICAL HUB HERO CARD (Responsive & Mobile-Calibrated) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-3 sm:mt-8 mb-12 sm:mb-16">
        <div className="relative rounded-[24px] sm:rounded-[36px] lg:rounded-[40px] overflow-hidden bg-gradient-to-r from-[#0F2900] via-[#163300] to-[#1F4600] shadow-2xl flex items-center border border-[#163300]/20">
          {/* Ambient Lighting & Soft Background Gradients with Lime glow */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#9FE870]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-[#00c868]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Main Hero Container Grid */}
          <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 items-center gap-6 sm:gap-10 lg:gap-12 px-5 sm:px-10 lg:px-16 py-8 sm:py-12 lg:py-16">
            {/* Left Content Column (Centered on Mobile, Left-aligned on Desktop) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-white text-center lg:text-left flex flex-col items-center lg:items-start">
              {/* Main Headline with Dynamic Typewriter Effect */}
              <div className="space-y-1 w-full flex flex-col items-center lg:items-start">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-['Outfit'] tracking-tight leading-tight text-white text-center lg:text-left">
                  {strings.heroLine1}
                </h1>
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black font-['Outfit'] tracking-tight leading-tight text-white min-h-[1.3em] flex items-center justify-center lg:justify-start">
                  <span className="italic font-serif font-black text-[#9FE870]">{currentText}</span>
                  <span className="animate-blink font-light text-[#9FE870] ml-1 select-none shrink-0 opacity-90">|</span>
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-white/90 text-xs sm:text-base lg:text-lg max-w-lg leading-relaxed font-medium text-center lg:text-left">
                {strings.heroSubtitle}
              </p>

              {/* Action Buttons (Centered on mobile, full width or centered items) */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full">
                <button
                  type="button"
                  id="btn-hero-cases"
                  onClick={() => scrollToSection('cases')}
                  className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg border-2 border-white/80 text-white hover:bg-white hover:text-[#163300] font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md active:scale-95 text-center flex items-center justify-center"
                >
                  {strings.heroCasesBtn}
                </button>

                <button
                  type="button"
                  id="btn-hero-trial"
                  onClick={onGoToLogin}
                  className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg bg-[#9FE870] hover:bg-[#8edb5f] text-[#163300] font-extrabold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg active:scale-95 text-center flex items-center justify-center"
                >
                  {strings.heroTrialBtn}
                </button>
              </div>
            </div>

            {/* Right Column: Layered Persona + Workspace Badges */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              {/* Desktop Persona Presentation (Overlapping Badges) */}
              <div className="hidden lg:flex relative items-center justify-center min-h-[440px] w-full">
                {/* Person Portrait with radial edge soft blend */}
                <div className="relative w-80 lg:w-92 aspect-square rounded-full overflow-hidden shadow-2xl border-4 border-white/20">
                  <img
                    src={HERO_PERSON_IMAGE}
                    alt="Educator smiling"
                    className="w-full h-full object-cover scale-105"
                  />
                  <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#163300]/40 pointer-events-none" />
                </div>

                {/* Tool 1: Google Classroom Badge */}
                <div className="absolute top-2 -left-4 z-20">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-xl border border-white/80 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#2DA94F]/15 border border-[#2DA94F]/30 flex items-center justify-center text-[#1E7E34] shrink-0">
                      <GraduationCap className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">{strings.badgeClassroomTitle}</p>
                      <p className="text-[9px] font-medium text-slate-500">{strings.badgeClassroomSub}</p>
                    </div>
                  </div>
                </div>

                {/* Tool 2: Gemini AI */}
                <div className="absolute -top-3 right-6 z-20">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-xl border border-white/80 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1A73E8] via-[#8AB4F8] to-[#9334E6] flex items-center justify-center text-white shadow-xs shrink-0">
                      <Sparkles className="w-4 h-4 fill-white stroke-none" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] font-black text-slate-900 leading-tight">{strings.badgeGeminiTitle}</p>
                        <span className="text-[8px] font-bold px-1.5 py-0.2 bg-[#E8F0FE] text-[#1A73E8] rounded-full">AI</span>
                      </div>
                      <p className="text-[9px] font-medium text-slate-500">{strings.badgeGeminiSub}</p>
                    </div>
                  </div>
                </div>

                {/* Tool 3: Gmail Institucional */}
                <div className="absolute top-32 -right-6 z-20">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-xl border border-white/80 flex items-center gap-2.5 max-w-[200px]">
                    <div className="w-8 h-8 rounded-xl bg-[#EA4335]/15 border border-[#EA4335]/30 flex items-center justify-center text-[#D93025] shrink-0">
                      <Mail className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">{strings.badgeGmailTitle}</p>
                      <p className="text-[9px] font-medium text-slate-500 truncate">{strings.badgeGmailSub}</p>
                    </div>
                  </div>
                </div>

                {/* Tool 4: Google Meet */}
                <div className="absolute -bottom-2 left-4 z-20">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-xl border border-white/80 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00897B]/15 border border-[#00897B]/30 flex items-center justify-center text-[#00796B] shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">{strings.badgeMeetTitle}</p>
                      <p className="text-[9px] font-medium text-slate-500">{strings.badgeMeetSub}</p>
                    </div>
                  </div>
                </div>

                {/* Tool 5: Google Drive & Docs */}
                <div className="absolute -bottom-3 right-6 z-20">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-xl border border-white/80 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FBBC04]/20 border border-[#FBBC04]/40 flex items-center justify-center text-[#E37400] shrink-0">
                      <Layers className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">{strings.badgeDriveTitle}</p>
                      <p className="text-[9px] font-medium text-slate-500">{strings.badgeDriveSub}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile / Tablet Persona Presentation (Clean Grid + Contained Portrait) */}
              <div className="lg:hidden flex flex-col items-center w-full space-y-4 pt-2">
                {/* Clean Centered Portrait */}
                <div className="relative w-48 sm:w-60 aspect-square rounded-full overflow-hidden shadow-xl border-4 border-white/20">
                  <img
                    src={HERO_PERSON_IMAGE}
                    alt="Educator smiling"
                    className="w-full h-full object-cover scale-105"
                  />
                  <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#163300]/40 pointer-events-none" />
                </div>

                {/* Clean Workspace Badges Grid without absolute overlap */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  <div className="bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-md border border-white/80 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#2DA94F]/15 border border-[#2DA94F]/30 flex items-center justify-center text-[#1E7E34] shrink-0">
                      <GraduationCap className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-bold text-slate-900 leading-tight truncate">{strings.badgeClassroomTitle}</p>
                      <p className="text-[8px] text-slate-500 truncate">{strings.badgeClassroomSub}</p>
                    </div>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-md border border-white/80 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1A73E8] via-[#8AB4F8] to-[#9334E6] flex items-center justify-center text-white shrink-0">
                      <Sparkles className="w-3.5 h-3.5 fill-white stroke-none" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-black text-slate-900 leading-tight truncate">{strings.badgeGeminiTitle}</p>
                      <p className="text-[8px] text-slate-500 truncate">{strings.badgeGeminiSub}</p>
                    </div>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-md border border-white/80 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EA4335]/15 border border-[#EA4335]/30 flex items-center justify-center text-[#D93025] shrink-0">
                      <Mail className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-bold text-slate-900 leading-tight truncate">{strings.badgeGmailTitle}</p>
                      <p className="text-[8px] text-slate-500 truncate">{strings.badgeGmailSub}</p>
                    </div>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-md border border-white/80 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#00897B]/15 border border-[#00897B]/30 flex items-center justify-center text-[#00796B] shrink-0">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                      </svg>
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-bold text-slate-900 leading-tight truncate">{strings.badgeMeetTitle}</p>
                      <p className="text-[8px] text-slate-500 truncate">{strings.badgeMeetSub}</p>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-md border border-white/80 flex items-center gap-2 justify-center sm:justify-start">
                    <div className="w-7 h-7 rounded-lg bg-[#FBBC04]/20 border border-[#FBBC04]/40 flex items-center justify-center text-[#E37400] shrink-0">
                      <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-bold text-slate-900 leading-tight truncate">{strings.badgeDriveTitle}</p>
                      <p className="text-[8px] text-slate-500 truncate">{strings.badgeDriveSub}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SOLUÇÕES SMART (Feature Cards in Tropical Hub Style) */}
      {/* ========================================================================= */}
      <section id="solucoes" className="py-20 sm:py-28 bg-[#FBFBFA] border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#163300]/10 text-[#008a46] text-xs font-black tracking-wider uppercase font-mono">
              {strings.solutionsTag}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
              {strings.solutionsTitle}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              {strings.solutionsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {smartSolutions.map((sol, index) => {
              const IconComp = sol.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 hover:border-[#008a46]/50 shadow-xs hover:shadow-xl transition-all duration-200 group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black text-slate-200 font-['Outfit'] group-hover:text-[#008a46]/30 transition-colors">
                        {sol.num}
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-[#F4F5F0] group-hover:bg-[#9FE870]/25 text-[#163300] group-hover:text-[#008a46] flex items-center justify-center transition-colors">
                        <IconComp className="w-6 h-6 stroke-[2.2]" />
                      </div>
                    </div>

                    <span className="inline-block text-[11px] font-mono font-bold tracking-wider uppercase text-[#008a46]">
                      {sol.tag}
                    </span>

                    <h3 className="text-xl sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                      {sol.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {sol.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={onGoToLogin}
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 group-hover:text-[#008a46] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span>{strings.learnMoreBtn}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. METODOLOGIA: FUTURE-DRIVEN, FEITO POR GENTE */}
      {/* ========================================================================= */}
      <section id="metodologia" className="py-20 sm:py-28 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#163300]/10 text-[#163300] text-xs font-black tracking-wider uppercase font-mono">
                {strings.methodologyTag}
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight leading-[1.15]">
                {strings.methodologyTitle}
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {strings.methodologySubtitle}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onGoToContact || onGoToLogin}
                  className="px-6 py-3.5 rounded-lg bg-[#163300] hover:bg-[#1f4600] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 inline-flex items-center gap-2"
                >
                  <span>{strings.talkToConsultantBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {methodologySteps.map((stepItem, sIdx) => (
                <div
                  key={sIdx}
                  className="p-6 rounded-3xl bg-[#FBFBFA] border border-slate-200/80 hover:border-[#9FE870] shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <span className="text-2xl font-black text-[#163300] font-['Outfit'] block">
                    {stepItem.step}
                  </span>
                  <h4 className="text-base font-bold text-[#0E0F0C] font-['Outfit']">
                    {stepItem.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {stepItem.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRANSPARENCIA & ECONOMIA INSTITUCIONAL GOOGLE WORKSPACE */}
      {/* ========================================================================= */}
      <section id="economia" className="py-20 sm:py-28 bg-[#F5F6F2] border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 lg:p-14 shadow-xl border border-slate-200/80 space-y-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold tracking-wider text-[#008a46] uppercase bg-[#008a46]/10 px-3.5 py-1 rounded-full inline-block">
                {strings.economyTag}
              </span>
              <h3 className="text-2xl sm:text-4xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                {strings.economyTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                {strings.economySubtitle}
              </p>
            </div>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1 */}
              <div className="p-6 rounded-2xl bg-[#FBFBFA] border border-slate-200/70 hover:border-[#008a46]/40 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#9FE870]/20 text-[#163300] flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5 text-[#008a46]" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 font-['Outfit']">
                    {strings.pillar1Title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {strings.pillar1Desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-[#008a46] font-bold">
                  <span>{strings.pillar1MetricLabel}</span>
                  <span>-50% a -65%</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-6 rounded-2xl bg-[#FBFBFA] border border-slate-200/70 hover:border-[#008a46]/40 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#9FE870]/20 text-[#163300] flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5 text-[#008a46]" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 font-['Outfit']">
                    {strings.pillar2Title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {strings.pillar2Desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-[#008a46] font-bold">
                  <span>{strings.pillar2MetricLabel}</span>
                  <span>{strings.pillar2MetricValue}</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-6 rounded-2xl bg-[#FBFBFA] border border-slate-200/70 hover:border-[#008a46]/40 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#9FE870]/20 text-[#163300] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5 text-[#008a46]" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 font-['Outfit']">
                    {strings.pillar3Title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {strings.pillar3Desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-[#008a46] font-bold">
                  <span>{strings.pillar3MetricLabel}</span>
                  <span>{strings.pillar3MetricValue}</span>
                </div>
              </div>
            </div>

            {/* Comparison Bar */}
            <div className="p-6 rounded-2xl bg-[#163300] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-mono font-bold tracking-wider text-[#9FE870] uppercase">
                  {strings.quoteBannerTag}
                </span>
                <h5 className="text-base sm:text-lg font-bold font-['Outfit']">
                  {strings.quoteBannerTitle}
                </h5>
                <p className="text-xs text-white/80">
                  {strings.quoteBannerDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={onGoToLogin}
                className="px-6 py-3 rounded-lg bg-[#9FE870] hover:bg-[#8edb5f] text-[#163300] font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {strings.heroTrialBtn}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CASES & DEPOIMENTOS (Tropical Hub Social Proof) */}
      {/* ========================================================================= */}
      <section id="cases" className="py-20 sm:py-28 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-mono font-bold tracking-wider text-[#008a46] uppercase">
              {strings.casesTag}
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-[#0E0F0C] font-['Outfit']">
              {strings.casesTitle}
            </h3>
            <p className="text-slate-600 text-sm">
              {strings.casesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#FBFBFA] border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {'★'.repeat(5)}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  {strings.case1Quote}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-900">{strings.case1Author}</p>
                <p className="text-[11px] text-slate-500">{strings.case1Role}</p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#FBFBFA] border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {'★'.repeat(5)}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  {strings.case2Quote}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-900">{strings.case2Author}</p>
                <p className="text-[11px] text-slate-500">{strings.case2Role}</p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#FBFBFA] border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {'★'.repeat(5)}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  {strings.case3Quote}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-900">{strings.case3Author}</p>
                <p className="text-[11px] text-slate-500">{strings.case3Role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. GOOGLE PARTNER SHOWCASE */}
      {/* ========================================================================= */}
      <section id="partner" className="py-16 sm:py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-xl mx-auto flex flex-col items-center">
            <img
              src="https://images.seeklogo.com/logo-png/42/1/google-partner-logo-png_seeklogo-428155.png"
              alt="Google Partner"
              className="h-14 sm:h-16 w-auto object-contain mb-4"
              referrerPolicy="no-referrer"
            />
            <h4 className="text-lg sm:text-xl font-bold text-[#0E0F0C] font-['Outfit'] mb-2">
              {strings.partnerTitle}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {strings.partnerSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BOTTOM CTA (Forest Green Banner with Lime Highlights) */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[#163300] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9FE870]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00c868]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
          <span className="inline-block px-3.5 py-1 rounded-full bg-white/10 text-[#9FE870] text-xs font-black tracking-wider uppercase font-mono">
            {strings.bottomTag}
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black font-['Outfit'] tracking-tight leading-[1.12]">
            {strings.bottomTitle}
          </h2>

          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            {strings.bottomSubtitle}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              id="btn-bottom-login"
              onClick={onGoToLogin}
              className="px-8 py-4 rounded-lg bg-[#9FE870] text-[#163300] hover:bg-[#8edb5f] font-extrabold text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>{strings.heroTrialBtn}</span>
            </button>

            <button
              type="button"
              onClick={onGoToContact || onGoToLogin}
              className="px-8 py-4 rounded-lg border-2 border-white/80 text-white hover:bg-white/10 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{strings.talkToSpecialistBtn}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full bg-[#0E0F0C] text-white py-12 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-2xl font-black font-['Outfit'] tracking-tight text-white">
                skoolia
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              {strings.footerTagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 font-semibold">
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {strings.footerTerms}
            </button>
            <button
              type="button"
              onClick={onGoToPrivacy || (() => setIsTermsOpen(true))}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {strings.footerPrivacy}
            </button>
            <button
              type="button"
              onClick={onGoToContact}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {strings.footerSupport}
            </button>
          </div>

          <div className="text-slate-500 text-center md:text-right font-mono text-[11px]">
            © {new Date().getFullYear()} skoolia. {strings.footerRights}
          </div>
        </div>
      </footer>

      {/* Terms of Service & Privacy Modal */}
      <TermsOfServiceModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAccept={() => setIsTermsOpen(false)}
      />
    </div>
  );
};
