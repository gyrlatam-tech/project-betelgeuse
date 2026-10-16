import { Resend } from 'resend';
import type { EmailLogEntry, EmailTemplate, EmailTemplateType, EmailServiceStatus } from '../src/types';
import {
  LOCALIZED_EMAIL_TEMPLATES,
  LOCALIZED_TEMPLATE_METADATA,
  LOCALIZED_VARIABLE_LABELS,
  normalizeEmailLanguage,
  type EmailLocale,
} from './emailLocales.ts';
import { cleanTicketText, formatTicketContent } from './ticketSanitizer.ts';

// In-memory log of sent emails for UI visibility and audits
const emailLogs: EmailLogEntry[] = [];
let liveLogsCache: { timestamp: number; data: EmailLogEntry[] } | null = null;
const CACHE_TTL_MS = 15000; // 15 seconds

export function invalidateEmailLogsCache(): void {
  liveLogsCache = null;
}

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  if (!resendInstance) {
    try {
      resendInstance = new Resend(apiKey.trim());
    } catch (e: any) {
      console.warn('[Resend] Failed to initialize client:', e.message);
      return null;
    }
  }
  return resendInstance;
}

function getFromAddress(): string {
  const envFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!envFrom) {
    return 'Skoolia Workspace <info@updates.skoolia.net>';
  }
  // If formatted as "Name <email@domain>" or just "email@domain", preserve the email but enforce the sender name
  const match = envFrom.match(/<([^>]+)>/);
  const emailOnly = match ? match[1].trim() : envFrom;
  return `Skoolia Workspace <${emailOnly}>`;
}

function getAppUrl(): string {
  const envUrl = process.env.APP_URL?.trim();
  if (envUrl && !/skoolia\.com/i.test(envUrl)) {
    if (envUrl.includes('skoolia.net')) {
      return envUrl.endsWith('/login') ? envUrl : `${envUrl.replace(/\/$/, '')}/login`;
    }
    return envUrl;
  }
  return 'https://skoolia.net/login';
}

/**
 * Ensures all action button URLs strictly resolve to skoolia.net/login instead of skoolia.com,
 * preserving any search query parameters or auth tokens.
 */
export function sanitizeActionUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return 'https://skoolia.net/login';
  }
  const clean = url.trim();
  if (!clean) {
    return 'https://skoolia.net/login';
  }

  if (/skoolia\.com/i.test(clean)) {
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const parsed = new URL(clean);
        const search = parsed.search || '';
        const hash = parsed.hash || '';
        return `https://skoolia.net/login${search}${hash}`;
      } else {
        const searchIndex = clean.indexOf('?');
        const query = searchIndex !== -1 ? clean.slice(searchIndex) : '';
        return `https://skoolia.net/login${query}`;
      }
    } catch (_) {
      return 'https://skoolia.net/login';
    }
  }

  return clean;
}

/**
 * Modern Base Responsive HTML Email Layout with clean skoolia brand identity
 */
export function renderBaseEmailTemplate({
  title,
  preheader,
  badgeText,
  badgeColor = '#00c868',
  bodyContent,
  ctaText,
  ctaUrl,
  footerNote,
  lang,
}: {
  title: string;
  preheader?: string;
  badgeText?: string;
  badgeColor?: string;
  bodyContent: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
  lang?: string;
}): string {
  const normLang = normalizeEmailLanguage(lang);
  const htmlLang = normLang === 'es' ? 'es' : normLang === 'en' ? 'en' : 'pt-BR';
  const defaultFooterNote = normLang === 'en'
    ? 'This is an official transactional email for Google Workspace management.'
    : normLang === 'es'
    ? 'Este es un correo transaccional oficial para la gestión de Google Workspace.'
    : 'Este é um e-mail transacional oficial para gestão do Google Workspace.';
  const defaultCopyright = normLang === 'en'
    ? `© ${new Date().getFullYear()} InternetByMOL LLC. All rights reserved.`
    : normLang === 'es'
    ? `© ${new Date().getFullYear()} InternetByMOL LLC. Todos los derechos reservados.`
    : `© ${new Date().getFullYear()} InternetByMOL LLC. Todos os direitos reservados.`;

  // Sanitize action button URL: Ensure all action buttons point to skoolia.net/login instead of skoolia.com
  const safeCtaUrl = sanitizeActionUrl(ctaUrl);
  // Also sanitize any rogue skoolia.com in bodyContent links
  const safeBodyContent = (bodyContent || '').replace(
    /href=["']https?:\/\/(?:www\.)?skoolia\.com[^"']*["']/gi,
    'href="https://skoolia.net/login"'
  );

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
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
      -moz-osx-font-smoothing: grayscale;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F4F5F0;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      border: 1px solid #E2E6DF;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }
    .header {
      background-color: #ffffff;
      padding: 32px 36px 20px 36px;
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
      padding: 36px;
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
      border-radius: 16px;
      padding: 18px 22px;
      margin: 22px 0;
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
      margin: 32px 0 16px 0;
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
      transition: background-color 0.2s ease;
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
      padding: 24px 36px;
      border-top: 1px solid #F0F2EB;
      text-align: center;
      font-size: 12px;
      color: #868685;
      line-height: 1.6;
    }
    .footer-links {
      margin-top: 8px;
      color: #5E605D;
    }
    .footer-links a {
      color: #008a46;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
    ${preheader || title}
  </div>
  <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <!-- Header Bar -->
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

          <!-- Main Content -->
          <tr>
            <td class="content">
              ${
                badgeText
                  ? `<div class="badge" style="background-color: ${badgeColor}18; color: ${badgeColor === '#00c868' ? '#008a46' : badgeColor}; border: 1px solid ${badgeColor}35;">${badgeText}</div>`
                  : ''
              }
              <h1 class="title">${title}</h1>
              
              ${safeBodyContent}

              ${
                ctaText && safeCtaUrl
                  ? `
                <div class="cta-container">
                  <a href="${safeCtaUrl}" target="_blank" class="cta-button">
                    ${ctaText}
                  </a>
                </div>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              <p style="margin: 0 0 10px 0; color: #5E605D; font-size: 11.5px; line-height: 1.5;">
                ${footerNote || defaultFooterNote}
              </p>
              <div style="margin: 12px 0; padding-top: 12px; border-top: 1px solid #E2E6DF; color: #4B4D49; font-size: 11px; line-height: 1.6;">
                <strong style="color: #0E0F0C; font-size: 11.5px;">InternetByMOL LLC</strong><br>
                3101 North Central Avenue<br>
                Phoenix, 85012<br>
                ${normLang === 'en' ? 'United States' : 'Estados Unidos'}<br>
                <span style="color: #868685;">Email:</span> <a href="mailto:help@skoolia.net" style="color: #008a46; text-decoration: none; font-weight: 600;">help@skoolia.net</a>
              </div>
              <div class="footer-links" style="margin-top: 8px; font-size: 11px; color: #868685;">
                ${defaultCopyright}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * DEFAULT EMAIL TEMPLATES REPOSITORY
 */
export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl_account_created',
    type: 'ACCOUNT_CREATED',
    name: 'Boas-vindas e Criação de Conta',
    description: 'Enviado ao administrador ou usuário quando uma nova conta é criada na instituição.',
    category: 'Onboarding',
    subject: 'Boas-vindas à skoolia - Conta criada para {{instituicao}}',
    preheader: 'Sua conta institucional para {{instituicao}} está pronta para acesso com a Conta Google.',
    badgeText: 'Conta Criada',
    badgeColor: '#00c868',
    title: 'Boas-vindas à plataforma skoolia',
    bodyHtml: `<p>Olá, <strong>{{nome}}</strong>!</p>
<p>Sua conta institucional na plataforma <strong>skoolia</strong> foi criada com sucesso. Você agora tem acesso ao painel de administração e provisionamento do Google Workspace.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Instituição:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">E-mail de Acesso:</span>
    <span class="info-value">{{email}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Perfil de Acesso:</span>
    <span class="info-value" style="color: #008a46;">{{cargo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Método de Acesso:</span>
    <span class="info-value" style="font-family: inherit;">Conta Google (Google Sign-In)</span>
  </div>
</div>

<p><strong>Como acessar sua conta:</strong></p>
<p>O acesso à plataforma é integrado diretamente à sua <strong>Conta Google</strong>. Basta clicar no botão <strong>"Entrar com o Google"</strong> utilizando o e-mail autorizado acima.</p>

<p><strong>Próximos passos recomendados:</strong></p>
<ol style="padding-left: 20px; margin: 12px 0;">
  <li>Acesse o painel clicando no botão abaixo e entre com sua Conta Google.</li>
  <li>Cadastre o domínio educacional oficial de sua instituição.</li>
  <li>Aguarde a validação técnica e verificação DNS.</li>
  <li>Faça a importação em lote de alunos e professores.</li>
</ol>`,
    ctaText: 'Acessar com o Google',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'O acesso é autenticado e protegido diretamente pela infraestrutura de segurança do Google Workspace.',
    supportedVariables: [
      { key: 'nome', label: 'Nome do Usuário', description: 'Nome completo do administrador ou usuário', sampleValue: 'Prof. Carlos Mendes' },
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da instituição de ensino', sampleValue: 'Colégio Santa Maria' },
      { key: 'email', label: 'E-mail do Usuário', description: 'Endereço de e-mail institucional Google', sampleValue: 'carlos.mendes@santamaria.edu.br' },
      { key: 'cargo', label: 'Perfil / Cargo', description: 'Papel do usuário no sistema', sampleValue: 'Administrador Institucional' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL para login no sistema', sampleValue: 'https://skoolia.net/login' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_domain_registered',
    type: 'DOMAIN_REGISTERED',
    name: 'Domínio Cadastrado / Em Homologação',
    description: 'Enviado ao administrador quando um novo domínio educacional é submetido para análise.',
    category: 'Domínios',
    subject: 'Domínio {{dominio}} cadastrado - Aguardando Homologação',
    preheader: 'O domínio {{dominio}} foi submetido para homologação no Google Workspace.',
    badgeText: 'Análise de Domínio',
    badgeColor: '#f59e0b',
    title: 'Domínio Cadastrado para Homologação',
    bodyHtml: `<p>Informamos que o domínio educacional <strong>{{dominio}}</strong> foi cadastrado na plataforma skoolia para a instituição <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Domínio:</span>
    <span class="info-value">{{dominio}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Instituição:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Status Atual:</span>
    <span class="info-value" style="color: #f59e0b; font-family: inherit;">Pendente de Homologação</span>
  </div>
  <div class="info-item">
    <span class="info-label">Solicitado por:</span>
    <span class="info-value">{{solicitante}}</span>
  </div>
</div>

<p>Nossa equipe técnica especializada foi notificada para validar o domínio e gerar o registro TXT de verificação oficial do Google Workspace. Você receberá um novo e-mail assim que a homologação for concluída.</p>`,
    ctaText: 'Ver Status do Domínio',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'A análise técnica costuma levar poucos minutos em horário comercial.',
    supportedVariables: [
      { key: 'dominio', label: 'Nome do Domínio', description: 'Domínio registrado', sampleValue: 'colegiosantamaria.edu.br' },
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da escola/faculdade', sampleValue: 'Colégio Santa Maria' },
      { key: 'solicitante', label: 'E-mail do Solicitante', description: 'Quem solicitou o cadastro', sampleValue: 'admin@colegiosantamaria.edu.br' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL de acesso ao sistema', sampleValue: 'https://skoolia.net/login' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_domain_approved',
    type: 'DOMAIN_APPROVED',
    name: 'Domínio Aprovado / Configuração TXT DNS',
    description: 'Enviado quando o domínio educacional é aprovado e é emitido o token TXT do Google Workspace.',
    category: 'Domínios',
    subject: '✅ Domínio {{dominio}} aprovado! Configure o registro TXT',
    preheader: 'Configure o registro TXT DNS para ativar {{dominio}} no Google Workspace.',
    badgeText: 'Domínio Aprovado',
    badgeColor: '#00c868',
    title: 'Domínio Aprovado - Ação Necessária no DNS',
    bodyHtml: `<p>Ótima notícia! O domínio <strong>{{dominio}}</strong> da instituição <strong>{{instituicao}}</strong> foi aprovado e liberado para ativação no Google Workspace.</p>

<p>Para concluir a ativação oficial e começar a criar contas de e-mail institucionais, adicione o seguinte registro TXT na zona de DNS do seu provedor (ex: Registro.br, Cloudflare, GoDaddy):</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Tipo de Registro:</span>
    <span class="info-value">TXT</span>
  </div>
  <div class="info-item">
    <span class="info-label">Nome da Entrada / Host:</span>
    <span class="info-value">@ (ou {{dominio}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">TTL Recomendado:</span>
    <span class="info-value">3600 (1 hora)</span>
  </div>
</div>

<p><strong>Valor do Registro TXT (Token de Verificação Google):</strong></p>
<div class="token-box">{{token_txt}}</div>

<p>Após inserir o registro DNS, clique no botão abaixo para testar a propagação e ativar as licenças educacionais.</p>`,
    ctaText: 'Verificar Propagação DNS',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'A propagação DNS pode levar de alguns minutos até algumas horas dependendo do seu provedor.',
    supportedVariables: [
      { key: 'dominio', label: 'Nome do Domínio', description: 'Domínio educacional aprovado', sampleValue: 'colegiosantamaria.edu.br' },
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da instituição', sampleValue: 'Colégio Santa Maria' },
      { key: 'token_txt', label: 'Token TXT do Google', description: 'Token gerado pelo Google Site Verification API', sampleValue: 'google-site-verification=rW9L9mK1N8pQ4zS2xY6wE8tV0bA1c3d' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL de acesso ao sistema', sampleValue: 'https://skoolia.net/login' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_domain_verified',
    type: 'DOMAIN_VERIFIED',
    name: 'Domínio Ativado e Verificado',
    description: 'Enviado quando o DNS é propagado e o domínio está 100% ativo para criação de contas.',
    category: 'Domínios',
    subject: '🎉 Domínio {{dominio}} verificado com sucesso no Google Workspace!',
    preheader: 'Seu domínio {{dominio}} está 100% ativo e pronto para criação de contas.',
    badgeText: 'Domínio Ativo',
    badgeColor: '#00c868',
    title: 'Domínio Verificado e Operacional',
    bodyHtml: `<p>Parabéns, <strong>{{nome}}</strong>!</p>
<p>O domínio <strong>{{dominio}}</strong> foi verificado com sucesso no Google Workspace. A Unidade Organizacional (OU) correspondente foi provisionada e as licenças Google Workspace estão liberadas.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Domínio:</span>
    <span class="info-value" style="color: #008a46;">{{dominio}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Instituição:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Status Google Admin:</span>
    <span class="info-value" style="color: #00c868; font-family: inherit;">VERIFICADO / ATIVO</span>
  </div>
  <div class="info-item">
    <span class="info-label">Licenças Liberadas:</span>
    <span class="info-value" style="font-family: inherit;">Ilimitadas (Fundamentals)</span>
  </div>
</div>

<p>Você já pode importar listas de alunos e professores ou criar usuários individuais diretamente pelo painel.</p>`,
    ctaText: 'Criar Contas no Domínio',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'As contas criadas já terão acesso imediato ao Gmail, Google Drive, Classroom e Google Meet.',
    supportedVariables: [
      { key: 'nome', label: 'Nome do Administrador', description: 'Nome do responsável', sampleValue: 'Prof. Carlos Mendes' },
      { key: 'dominio', label: 'Nome do Domínio', description: 'Domínio verificado', sampleValue: 'colegiosantamaria.edu.br' },
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da instituição', sampleValue: 'Colégio Santa Maria' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL de acesso ao sistema', sampleValue: 'https://skoolia.net/login' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_password_reset',
    type: 'PASSWORD_RESET',
    name: 'Redefinição de Senha',
    description: 'Enviado quando um usuário solicita a recuperação ou redefinição de sua senha.',
    category: 'Segurança',
    subject: 'Redefinição de senha da sua conta skoolia',
    preheader: 'Link seguro para redefinição de senha da sua conta skoolia.',
    badgeText: 'Segurança da Conta',
    badgeColor: '#00c868',
    title: 'Redefinição de Senha',
    bodyHtml: `<p>Olá, <strong>{{nome}}</strong>,</p>
<p>Recebemos uma solicitação para redefinir a senha da sua conta de acesso institucional (<strong>{{email}}</strong>).</p>

<p>Clique no botão abaixo para escolher uma nova senha de acesso segura:</p>`,
    ctaText: 'Redefinir Minha Senha',
    ctaUrl: '{{link_redefinicao}}',
    footerNote: 'Se você não solicitou a redefinição de senha, desconsidere esta mensagem. Sua conta permanece segura.',
    supportedVariables: [
      { key: 'nome', label: 'Nome do Usuário', description: 'Nome de quem solicitou o reset', sampleValue: 'Carlos Mendes' },
      { key: 'email', label: 'E-mail do Usuário', description: 'Endereço de e-mail da conta', sampleValue: 'carlos.mendes@santamaria.edu.br' },
      { key: 'link_redefinicao', label: 'Link Seguro de Reset', description: 'Link com token OOB de redefinição', sampleValue: 'https://skoolia.net/login?mode=resetPassword' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_workspace_password_reset',
    type: 'WORKSPACE_PASSWORD_RESET',
    name: 'Senha de Acesso Google Workspace',
    description: 'Enviado ao e-mail de recuperação do usuário quando o administrador redefine a senha de acesso ao Workspace.',
    category: 'Segurança',
    subject: 'Sua nova senha de acesso ao Google Workspace ({{email}})',
    preheader: 'Sua senha temporária de acesso ao Google Workspace foi gerada pelo administrador.',
    badgeText: 'Acesso Google Workspace',
    badgeColor: '#008a46',
    title: 'Sua Nova Senha Temporária',
    bodyHtml: `<p>Olá, <strong>{{nome}}</strong>,</p>
<p>Uma nova senha temporária de acesso à sua conta institucional do <strong>Google Workspace</strong> foi gerada pelo administrador da sua instituição:</p>

<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
  <div style="margin-bottom: 12px;">
    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block;">Conta Google Workspace:</span>
    <span style="font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">{{email}}</span>
  </div>
  <div>
    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block;">Nova Senha Temporária:</span>
    <span style="display: inline-block; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 14px; font-size: 16px; font-weight: 700; color: #008a46; font-family: monospace; letter-spacing: 1px; margin-top: 4px;">{{senha_temporaria}}</span>
  </div>
</div>

<p style="color: #475569; font-size: 13px; line-height: 1.6;">
  <strong>Importante:</strong> Ao realizar seu primeiro login em <strong>accounts.google.com</strong> com esta senha temporária, o Google exigirá obrigatoriamente que você defina a sua própria senha pessoal e definitiva.
</p>`,
    ctaText: 'Acessar o Google Workspace',
    ctaUrl: 'https://accounts.google.com',
    footerNote: 'Esta credencial temporária foi enviada para o seu e-mail de recuperação cadastrado. Se você não solicitou esta redefinição, contate imediatamente o suporte da sua instituição.',
    supportedVariables: [
      { key: 'nome', label: 'Nome do Usuário', description: 'Nome do titular da conta', sampleValue: 'Carlos Mendes' },
      { key: 'email', label: 'E-mail Google Workspace', description: 'Conta institucional principal', sampleValue: 'carlos@santamaria.edu.br' },
      { key: 'senha_temporaria', label: 'Senha Temporária', description: 'Nova senha gerada para o primeiro login', sampleValue: 'Pass@9382!2026' },
      { key: 'link_acesso', label: 'Link de Acesso Google', description: 'URL de login do Google Workspace', sampleValue: 'https://accounts.google.com' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_tenant_status',
    type: 'TENANT_STATUS',
    name: 'Alteração de Status da Instituição',
    description: 'Enviado ao administrador quando a instituição é ativada, suspensa ou reativada.',
    category: 'Administração',
    subject: 'Aviso: Instituição {{instituicao}} teve o status atualizado para {{status}}',
    preheader: 'A instituição {{instituicao}} está agora com status: {{status}}.',
    badgeText: 'Status da Conta',
    badgeColor: '#00c868',
    title: 'Atualização de Status da Instituição',
    bodyHtml: `<p>Prezado(a) Administrador(a),</p>
<p>Informamos que o status da instituição <strong>{{instituicao}}</strong> na plataforma skoolia foi atualizado para: <strong>{{status}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Instituição:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Novo Status:</span>
    <span class="info-value" style="font-family: inherit;">{{status}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Data da Alteração:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Motivo / Detalhes:</span>
    <span class="info-value" style="font-family: inherit;">{{motivo}}</span>
  </div>
</div>

<p>Caso tenha dúvidas ou precise de suporte, entre em contato com nosso time de atendimento.</p>`,
    ctaText: 'Acessar Painel skoolia',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'Em caso de dúvidas sobre políticas de uso, consulte nossos termos de serviço.',
    supportedVariables: [
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da instituição de ensino', sampleValue: 'Colégio Santa Maria' },
      { key: 'status', label: 'Novo Status', description: 'Status atual (Ativa / Suspensa)', sampleValue: 'Ativa' },
      { key: 'motivo', label: 'Motivo', description: 'Justificativa do status', sampleValue: 'Renovação do plano anual confirmada' },
      { key: 'data', label: 'Data', description: 'Data da alteração', sampleValue: '31/08/2026' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL de acesso ao sistema', sampleValue: 'https://skoolia.net/login' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_invoice',
    type: 'INVOICE',
    name: 'Comprovante de Fatura e Pagamento',
    description: 'Enviado para todos os contatos da instituição (login do tenant, responsável financeiro, técnico e institucional) com o comprovante e fatura oficial de pagamento.',
    category: 'Faturamento',
    subject: 'Comprovante de Fatura #{{fatura_num}} - skoolia ({{valor}})',
    preheader: 'Fatura #{{fatura_num}} no valor de {{valor}} processada com sucesso.',
    badgeText: 'Fatura Paga',
    badgeColor: '#00c868',
    title: 'Comprovante de Fatura',
    bodyHtml: `<p>Olá, <strong>{{nome}}</strong>,</p>
<p>Confirmamos o processamento da sua fatura referente aos serviços contratados na plataforma <strong>skoolia</strong> para a instituição <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Número da Fatura:</span>
    <span class="info-value">#{{fatura_num}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Plano Contratado:</span>
    <span class="info-value" style="font-family: inherit;">{{plano}} ({{ciclo}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Valor Total:</span>
    <span class="info-value" style="color: #008a46; font-size: 16px;">{{valor}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Status do Pagamento:</span>
    <span class="info-value" style="color: #00c868; font-family: inherit;">PAGO / APROVADO</span>
  </div>
  <div class="info-item">
    <span class="info-label">Forma de Pagamento:</span>
    <span class="info-value" style="font-family: inherit;">{{metodo_pagamento}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Data de Emissão:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="font-size: 13px; color: #5E605D;">
  Esta fatura garante a renovação do seu licenciamento e capacidade de provisionamento ilimitado de contas educacionais. Você pode visualizar o histórico completo de recibos a qualquer momento na aba <strong>Faturamento</strong>.
</p>`,
    ctaText: 'Ver Faturas no Painel',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'Documento auxiliar de quitação de serviços digitais skoolia.',
    supportedVariables: [
      { key: 'nome', label: 'Nome do Cliente / Responsável', description: 'Nome do contato financeiro', sampleValue: 'Dra. Mariana Costa' },
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da escola', sampleValue: 'Colégio Santa Maria' },
      { key: 'fatura_num', label: 'Número da Fatura', description: 'Identificador único da fatura', sampleValue: 'SK-2026-0891' },
      { key: 'plano', label: 'Nome do Plano', description: 'Plano contratado', sampleValue: 'skoolia Pro Unlimited' },
      { key: 'ciclo', label: 'Ciclo de Cobrança', description: 'Anual ou Mensal', sampleValue: 'Anual' },
      { key: 'valor', label: 'Valor Formatado', description: 'Valor em moeda local', sampleValue: 'R$ 1.188,00' },
      { key: 'metodo_pagamento', label: 'Forma de Pagamento', description: 'Cartão ou Pix', sampleValue: 'Cartão de Crédito •••• 4242' },
      { key: 'data', label: 'Data da Fatura', description: 'Data de pagamento', sampleValue: '31/08/2026' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL de acesso ao sistema', sampleValue: 'https://skoolia.net/login' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_trial_welcome',
    type: 'TRIAL_WELCOME',
    name: 'Boas-vindas ao Período Trial (30 Dias)',
    description: 'Enviado aos novos clientes no início do período de teste gratuito de 30 dias com licenças ilimitadas.',
    category: 'Onboarding',
    subject: 'Seu período de teste de 30 dias na skoolia começou!',
    preheader: 'Aproveite 30 dias de licenças ilimitadas e provisionamento no Google Workspace.',
    badgeText: 'Trial Ativado',
    badgeColor: '#00c868',
    title: 'Trial com Licenças Ilimitadas Liberado',
    bodyHtml: `<p>Olá, <strong>{{nome}}</strong>!</p>
<p>Seu período de degustação de 30 dias da plataforma <strong>skoolia</strong> para a instituição <strong>{{instituicao}}</strong> já está ativo.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Instituição:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Duração do Trial:</span>
    <span class="info-value" style="color: #008a46; font-family: inherit;">30 Dias Gratuitos</span>
  </div>
  <div class="info-item">
    <span class="info-label">Licenças Disponíveis:</span>
    <span class="info-value" style="color: #008a46; font-family: inherit;">Ilimitadas (Alunos e Professores)</span>
  </div>
  <div class="info-item">
    <span class="info-label">Término do Trial:</span>
    <span class="info-value" style="font-family: inherit;">{{data_expiracao}}</span>
  </div>
</div>

<p>Durante o período de teste você pode cadastrar e verificar seu domínio oficial, importar contas de alunos e testar todos os fluxos de segurança sem restrições ou cobrança imediata.</p>`,
    ctaText: 'Começar a Configurar',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'Nenhuma cobrança automática será realizada antes do término do seu período de testes.',
    supportedVariables: [
      { key: 'nome', label: 'Nome do Responsável', description: 'Nome do usuário administrador', sampleValue: 'Prof. Carlos Mendes' },
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da instituição', sampleValue: 'Colégio Santa Maria' },
      { key: 'data_expiracao', label: 'Data de Término', description: 'Data final do período trial', sampleValue: '30/09/2026' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL de acesso ao sistema', sampleValue: 'https://skoolia.net/login' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_ticket_opened',
    type: 'TICKET_OPENED',
    name: 'Abertura de Chamado de Suporte',
    description: 'Enviado exclusivamente para o contato de login do tenant e o responsável técnico quando um novo ticket é aberto.',
    category: 'Suporte',
    subject: '[Suporte #{{protocolo}}] Chamado Aberto: {{assunto}}',
    preheader: 'Seu chamado #{{protocolo}} foi recebido e está na fila prioritária de atendimento.',
    badgeText: 'Chamado Aberto',
    badgeColor: '#00c868',
    title: 'Chamado de Suporte Registrado',
    bodyHtml: `<p>Olá!</p>
<p>Confirmamos a abertura do chamado de suporte para a instituição <strong>{{instituicao}}</strong>. Nossa equipe técnica já foi notificada para análise.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Protocolo:</span>
    <span class="info-value" style="color: #008a46; font-size: 15px;">#{{protocolo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Assunto:</span>
    <span class="info-value" style="font-family: inherit;">{{assunto}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Categoria:</span>
    <span class="info-value" style="font-family: inherit;">{{categoria}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Prioridade:</span>
    <span class="info-value" style="font-family: inherit;">{{prioridade}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Solicitante:</span>
    <span class="info-value" style="font-family: inherit;">{{solicitante}} ({{email_solicitante}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Data de Registro:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="margin-top: 16px; font-weight: 600; color: #0E0F0C;">Descrição do Chamado:</p>
<div style="background-color: #F4F5F0; border-left: 3px solid #00c868; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #373A36; white-space: pre-wrap; margin-bottom: 20px;">{{descricao}}</div>`,
    ctaText: 'Acompanhar Chamado no Painel',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'Central de Atendimento e Suporte.',
    supportedVariables: [
      { key: 'protocolo', label: 'Protocolo', description: 'Código do chamado', sampleValue: 'HS-4081' },
      { key: 'assunto', label: 'Assunto', description: 'Assunto do ticket', sampleValue: 'Validação de DNS e Registro MX' },
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da instituição de ensino', sampleValue: 'Colégio Santa Maria' },
      { key: 'categoria', label: 'Categoria', description: 'Tipo do serviço', sampleValue: 'Domínios & DNS' },
      { key: 'prioridade', label: 'Prioridade', description: 'Nível de criticidade (definido pelo suporte)', sampleValue: 'Média' },
      { key: 'solicitante', label: 'Nome do Solicitante', description: 'Quem abriu o chamado', sampleValue: 'Coordenação de TI' },
      { key: 'email_solicitante', label: 'E-mail do Solicitante', description: 'E-mail de contato', sampleValue: 'suporte@colegio.edu.br' },
      { key: 'descricao', label: 'Descrição Completa', description: 'Texto inicial do chamado', sampleValue: 'Solicitamos apoio para verificação dos registros TXT de SPF e DKIM.' },
      { key: 'data', label: 'Data', description: 'Data de abertura', sampleValue: '31/08/2026' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL de acesso ao sistema', sampleValue: 'https://skoolia.net/login' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_ticket_replied',
    type: 'TICKET_REPLIED',
    name: 'Nova Resposta no Chamado de Suporte',
    description: 'Enviado exclusivamente para o contato de login do tenant e o responsável técnico sempre que nossa equipe ou especialista responde a um ticket.',
    category: 'Suporte',
    subject: '[Suporte #{{protocolo}}] Nova Resposta: {{assunto}}',
    preheader: 'O especialista {{autor_resposta}} enviou uma resposta no chamado #{{protocolo}}.',
    badgeText: 'Resposta de Suporte',
    badgeColor: '#3b82f6',
    title: 'Nova Resposta no seu Chamado',
    bodyHtml: `<p>Olá!</p>
<p>Há uma nova interação no chamado <strong>#{{protocolo}}</strong> da instituição <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Protocolo:</span>
    <span class="info-value" style="color: #008a46; font-size: 15px;">#{{protocolo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Assunto:</span>
    <span class="info-value" style="font-family: inherit;">{{assunto}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Respondido por:</span>
    <span class="info-value" style="font-family: inherit;">{{autor_resposta}} ({{cargo_autor}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Status Atual:</span>
    <span class="info-value" style="font-family: inherit; color: #163300; font-weight: 800;">{{status}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Data da Mensagem:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="margin-top: 16px; font-weight: 600; color: #0E0F0C;">Conteúdo da Mensagem:</p>
<div style="background-color: #F4F5F0; border-left: 3px solid #3b82f6; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #373A36; white-space: pre-wrap; margin-bottom: 20px;">{{mensagem}}</div>`,
    ctaText: 'Responder no Console',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'Atendimento Especializado Google Workspace.',
    supportedVariables: [
      { key: 'protocolo', label: 'Protocolo', description: 'Código do chamado', sampleValue: 'HS-4081' },
      { key: 'assunto', label: 'Assunto', description: 'Assunto do ticket', sampleValue: 'Validação de DNS e Registro MX' },
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da instituição de ensino', sampleValue: 'Colégio Santa Maria' },
      { key: 'autor_resposta', label: 'Nome do Atendente', description: 'Quem respondeu', sampleValue: 'Mariana Costa' },
      { key: 'cargo_autor', label: 'Cargo do Atendente', description: 'Função do atendente', sampleValue: 'Especialista Google Workspace' },
      { key: 'mensagem', label: 'Texto da Resposta', description: 'Conteúdo da mensagem', sampleValue: 'Analisamos a zona DNS e os registros MX já foram propagados com sucesso.' },
      { key: 'status', label: 'Status do Chamado', description: 'Status atual', sampleValue: 'Em Atendimento' },
      { key: 'data', label: 'Data', description: 'Data da resposta', sampleValue: '31/08/2026' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL de acesso ao sistema', sampleValue: 'https://skoolia.net/login' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_superadmin_new_ticket',
    type: 'SUPERADMIN_NEW_TICKET',
    name: 'Aviso de Novo Chamado (Equipe Técnica)',
    description: 'Enviado à equipe de suporte sempre que um novo ticket de suporte é criado por uma instituição para resposta rápida.',
    category: 'Suporte',
    subject: '[Novo Chamado #{{protocolo}}] {{instituicao}}: {{assunto}}',
    preheader: 'Novo chamado aberto pela instituição {{instituicao}} aguardando resposta da equipe.',
    badgeText: 'Equipe Técnica',
    badgeColor: '#163300',
    title: 'Novo Chamado Aguardando Resposta',
    bodyHtml: `<p>Olá, <strong>Equipe Técnica</strong>!</p>
<p>Um novo chamado de suporte foi aberto na plataforma e requer atenção da equipe técnica para responder à instituição <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Protocolo:</span>
    <span class="info-value" style="color: #163300; font-size: 15px; font-weight: 800;">#{{protocolo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Instituição:</span>
    <span class="info-value" style="font-family: inherit; font-weight: 700;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Assunto:</span>
    <span class="info-value" style="font-family: inherit;">{{assunto}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Categoria:</span>
    <span class="info-value" style="font-family: inherit;">{{categoria}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Prioridade:</span>
    <span class="info-value" style="font-family: inherit; font-weight: 700;">{{prioridade}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Solicitante:</span>
    <span class="info-value" style="font-family: inherit;">{{solicitante}} ({{email_solicitante}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">SLA Alvo:</span>
    <span class="info-value" style="font-family: inherit;">{{sla}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Data de Abertura:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="margin-top: 16px; font-weight: 600; color: #0E0F0C;">Descrição enviada pelo Cliente:</p>
<div style="background-color: #F4F5F0; border-left: 3px solid #163300; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #373A36; white-space: pre-wrap; margin-bottom: 20px;">{{descricao}}</div>

<p style="font-size: 13px; color: #5E605D;">
  Acesse o chamado no console para enviar a resposta técnica diretamente ao cliente.
</p>`,
    ctaText: 'Responder ao Chamado',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'Alerta prioritário automático para Administradores da Plataforma.',
    supportedVariables: [
      { key: 'protocolo', label: 'Protocolo', description: 'Código do chamado', sampleValue: 'HS-4081' },
      { key: 'assunto', label: 'Assunto', description: 'Assunto do ticket', sampleValue: 'Validação de DNS e Registro MX' },
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da instituição de ensino', sampleValue: 'Colégio Santa Maria' },
      { key: 'categoria', label: 'Categoria', description: 'Tipo do serviço', sampleValue: 'Domínios & DNS' },
      { key: 'prioridade', label: 'Prioridade', description: 'Nível de criticidade (definido pelo suporte)', sampleValue: 'Média' },
      { key: 'solicitante', label: 'Nome do Solicitante', description: 'Quem abriu o chamado', sampleValue: 'Coordenação de TI' },
      { key: 'email_solicitante', label: 'E-mail do Solicitante', description: 'E-mail de contato', sampleValue: 'suporte@colegio.edu.br' },
      { key: 'descricao', label: 'Descrição Completa', description: 'Texto inicial do chamado', sampleValue: 'Solicitamos apoio para verificação dos registros TXT de SPF e DKIM.' },
      { key: 'sla', label: 'SLA Alvo', description: 'Prazo estimado para atendimento', sampleValue: 'Até 8h' },
      { key: 'data', label: 'Data', description: 'Data de abertura', sampleValue: '31/08/2026' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL de acesso ao painel de suporte', sampleValue: 'https://skoolia.net/?tab=support' },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_superadmin_new_tenant',
    type: 'SUPERADMIN_NEW_TENANT',
    name: 'Aviso de Novo Tenant Cadastrado (SuperAdmin)',
    description: 'Enviado exclusivamente ao SuperAdmin (gyrlatam@gmail.com) via Resend toda vez que uma instituição/tenant se registra no sistema.',
    category: 'SuperAdmin',
    subject: '[Novo Tenant] {{instituicao}} acabou de se registrar no sistema',
    preheader: 'Nova instituição cadastrada: {{instituicao}} | Admin: {{admin_nome}} ({{admin_email}})',
    badgeText: 'SuperAdmin • Novo Tenant',
    badgeColor: '#163300',
    title: 'Nova Instituição Registrada no Sistema',
    bodyHtml: `<p>Olá, <strong>SuperAdmin</strong>!</p>
<p>Uma nova instituição concluiu o registro na plataforma e foi cadastrada com sucesso. Seguem os dados essenciais para acompanhamento:</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Nome da Instituição:</span>
    <span class="info-value" style="color: #163300; font-size: 15px; font-weight: 800;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Administrador Responsável:</span>
    <span class="info-value" style="font-weight: 700;">{{admin_nome}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">E-mail de Contato:</span>
    <span class="info-value">{{admin_email}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Telefone / WhatsApp:</span>
    <span class="info-value">{{telefone}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">País / Região:</span>
    <span class="info-value">{{pais}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Modalidade / Plano:</span>
    <span class="info-value" style="color: #008a46; font-weight: 700;">{{plano}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">ID do Tenant:</span>
    <span class="info-value" style="font-family: monospace;">{{tenant_id}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Data e Hora do Registro:</span>
    <span class="info-value">{{data_registro}}</span>
  </div>
</div>

<p style="font-size: 13px; color: #5E605D; margin-top: 16px;">
  Você pode gerenciar este novo tenant, verificar os domínios e configurar licenças diretamente pelo console do SuperAdmin.
</p>`,
    ctaText: 'Gerenciar no Painel SuperAdmin',
    ctaUrl: '{{link_acesso}}',
    footerNote: 'Notificação automática enviada via Resend para o SuperAdmin do sistema.',
    supportedVariables: [
      { key: 'instituicao', label: 'Nome da Instituição', description: 'Nome da instituição de ensino', sampleValue: 'Colégio Futuro Digital' },
      { key: 'admin_nome', label: 'Nome do Administrador', description: 'Nome do responsável pelo cadastro', sampleValue: 'Carlos Eduardo Silva' },
      { key: 'admin_email', label: 'E-mail do Administrador', description: 'E-mail principal do administrador', sampleValue: 'admin@futurodigital.edu.br' },
      { key: 'telefone', label: 'Telefone / WhatsApp', description: 'Telefone informado', sampleValue: '+55 11 98765-4321' },
      { key: 'pais', label: 'País / Região', description: 'País de origem', sampleValue: 'Brasil' },
      { key: 'plano', label: 'Modalidade / Plano', description: 'Plano inicial ou período de testes', sampleValue: 'Degustação (30 Dias)' },
      { key: 'tenant_id', label: 'ID do Tenant', description: 'Identificador do tenant gerado pelo sistema', sampleValue: 'tenant-1727140000000' },
      { key: 'data_registro', label: 'Data do Registro', description: 'Data e horário em que se inscreveu', sampleValue: '23/09/2026, 19:45' },
      { key: 'link_acesso', label: 'Link de Acesso', description: 'URL para o console do SuperAdmin', sampleValue: 'https://skoolia.net/login?tab=tenants' },
    ],
    updatedAt: new Date().toISOString(),
  },
];

// Active in-memory templates store initialized from defaults
const emailTemplatesMap = new Map<string, EmailTemplate>(
  DEFAULT_EMAIL_TEMPLATES.map((t) => [t.id, { ...t }])
);

// Stores customized overrides strictly per template ID and locale (e.g. 'tmpl_account_created:en')
const customizedTemplatesByLocale = new Map<string, Partial<EmailTemplate>>();

/**
 * Get all available email templates with localized content
 */
export function getEmailTemplates(lang: string = 'pt'): EmailTemplate[] {
  const normLang = normalizeEmailLanguage(lang);
  return Array.from(emailTemplatesMap.values()).map((base) => {
    return getEmailTemplateById(base.id, normLang) || base;
  });
}

/**
 * Get single template by ID or Type with localized content
 */
export function getEmailTemplateById(idOrType: string, lang: string = 'pt'): EmailTemplate | null {
  const normLang = normalizeEmailLanguage(lang);
  const varDict = LOCALIZED_VARIABLE_LABELS[normLang];
  const metaDict = LOCALIZED_TEMPLATE_METADATA[normLang];

  let baseTmpl: EmailTemplate | undefined = emailTemplatesMap.get(idOrType);
  if (!baseTmpl) {
    for (const tmpl of emailTemplatesMap.values()) {
      if (tmpl.type === idOrType) {
        baseTmpl = tmpl;
        break;
      }
    }
  }
  if (!baseTmpl) return null;

  const localized = LOCALIZED_EMAIL_TEMPLATES[normLang]?.[baseTmpl.type];
  const meta = metaDict?.[baseTmpl.type];
  const supportedVariables = baseTmpl.supportedVariables?.map((v) => {
    const locVar = varDict?.[v.key];
    return locVar ? { ...v, label: locVar.label, description: locVar.description } : v;
  });

  const customKey = `${baseTmpl.id}:${normLang}`;
  const customForLocale = customizedTemplatesByLocale.get(customKey);
  const isCustomized = Boolean(customForLocale);

  return {
    ...baseTmpl,
    ...(localized || {}),
    ...(customForLocale || {}),
    name: customForLocale?.name || meta?.name || baseTmpl.name,
    description: customForLocale?.description || meta?.description || baseTmpl.description,
    category: meta?.category || baseTmpl.category,
    supportedVariables: supportedVariables || baseTmpl.supportedVariables,
    isCustomized,
  };
}

/**
 * Update an existing email template for a specific locale
 */
export function updateEmailTemplate(
  id: string,
  updates: Partial<Omit<EmailTemplate, 'id' | 'type' | 'supportedVariables'>>,
  lang: string = 'pt'
): EmailTemplate | null {
  const existing = emailTemplatesMap.get(id);
  if (!existing) return null;

  const normLang = normalizeEmailLanguage(lang);
  const cleanedUpdates = { ...updates };
  if (cleanedUpdates.ctaUrl) {
    cleanedUpdates.ctaUrl = sanitizeActionUrl(cleanedUpdates.ctaUrl);
  }

  const customKey = `${existing.id}:${normLang}`;
  const currentCustom = customizedTemplatesByLocale.get(customKey) || {};
  customizedTemplatesByLocale.set(customKey, {
    ...currentCustom,
    ...cleanedUpdates,
    updatedAt: new Date().toISOString(),
  });

  return getEmailTemplateById(existing.id, normLang);
}

/**
 * Reset template to default for a specific locale
 */
export function resetEmailTemplate(id: string, lang: string = 'pt'): EmailTemplate | null {
  const defaultTmpl = DEFAULT_EMAIL_TEMPLATES.find((t) => t.id === id);
  if (!defaultTmpl) return null;

  const normLang = normalizeEmailLanguage(lang);
  customizedTemplatesByLocale.delete(`${defaultTmpl.id}:${normLang}`);

  return getEmailTemplateById(defaultTmpl.id, normLang);
}

/**
 * Interpolate template variables {{key}}
 */
export function interpolateVariables(text: string, variables: Record<string, string>): string {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Render complete HTML for an email template given key-value variables
 */
export function renderEmailWithTemplate(
  template: EmailTemplate,
  variables: Record<string, string>,
  lang: string = 'pt'
): { html: string; text: string; subject: string } {
  // Enforce skoolia.net/login for any skoolia.com variable
  const safeVariables: Record<string, string> = { ...variables };
  for (const [k, v] of Object.entries(safeVariables)) {
    if (typeof v === 'string' && /skoolia\.com/i.test(v)) {
      safeVariables[k] = sanitizeActionUrl(v);
    }
  }

  const subject = interpolateVariables(template.subject, safeVariables);
  const preheader = interpolateVariables(template.preheader, safeVariables);
  const title = interpolateVariables(template.title, safeVariables);
  const badgeText = interpolateVariables(template.badgeText, safeVariables);
  const bodyContent = interpolateVariables(template.bodyHtml, safeVariables);
  const ctaText = interpolateVariables(template.ctaText, safeVariables);
  let ctaUrl = interpolateVariables(template.ctaUrl, safeVariables);
  ctaUrl = sanitizeActionUrl(ctaUrl);

  const footerNote = interpolateVariables(template.footerNote, safeVariables);

  const html = renderBaseEmailTemplate({
    title,
    preheader,
    badgeText,
    badgeColor: template.badgeColor || '#00c868',
    bodyContent,
    ctaText,
    ctaUrl,
    footerNote,
    lang,
  });

  const normLang = normalizeEmailLanguage(lang);
  const countryName = normLang === 'en' ? 'United States' : 'Estados Unidos';
  const copyright = normLang === 'en'
    ? `© ${new Date().getFullYear()} InternetByMOL LLC. All rights reserved.`
    : normLang === 'es'
    ? `© ${new Date().getFullYear()} InternetByMOL LLC. Todos los derechos reservados.`
    : `© ${new Date().getFullYear()} InternetByMOL LLC. Todos os direitos reservados.`;
  const plainText = `${title}\n\n${bodyContent.replace(/<[^>]*>?/gm, '')}\n\n${ctaText ? `${ctaText}: ${ctaUrl}\n\n` : ''}---\nInternetByMOL LLC\n3101 North Central Avenue\nPhoenix, 85012\n${countryName}\nhelp@skoolia.net\n${copyright}`;

  return { html, text: plainText, subject };
}

/**
 * Generic Sender with Logging & Sandbox Fallback
 */
export async function sendEmailCore({
  type,
  to,
  subject,
  html,
  text,
}: {
  type: EmailTemplateType;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; resendId?: string; error?: string }> {
  const recipients = Array.isArray(to) ? to : [to];
  const resend = getResendClient();
  const from = getFromAddress();

  const cleanedSubject = cleanTicketText(subject);
  const cleanedHtml = cleanTicketText(html);
  const cleanedText = cleanTicketText(text);

  if (!resend) {
    console.log(`[Resend Email SIMULATED] (${type}) to: ${recipients.join(', ')} | Subject: ${cleanedSubject}`);
    const entry: EmailLogEntry = {
      id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      to: recipients.join(', '),
      subject: cleanedSubject,
      status: 'SIMULATED',
    };
    emailLogs.unshift(entry);
    if (emailLogs.length > 50) emailLogs.pop();
    return { success: true, resendId: entry.id };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject: cleanedSubject,
      html: cleanedHtml,
      text: cleanedText,
    });

    if (error) {
      console.warn(`[Resend Error] Failed sending ${type} email:`, error);
      const entry: EmailLogEntry = {
        id: `email-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type,
        to: recipients.join(', '),
        subject: cleanedSubject,
        status: 'FAILED',
        errorMessage: error.message,
      };
      emailLogs.unshift(entry);
      return { success: false, error: error.message };
    }

    console.log(`[Resend SUCCESS] Sent ${type} email id: ${data?.id} to ${recipients.join(', ')}`);
    const entry: EmailLogEntry = {
      id: data?.id || `resend-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      to: recipients.join(', '),
      subject,
      status: 'SENT',
      resendId: data?.id,
    };
    emailLogs.unshift(entry);
    if (emailLogs.length > 50) emailLogs.pop();
    return { success: true, resendId: data?.id };
  } catch (err: any) {
    console.error(`[Resend Exception]`, err);
    const entry: EmailLogEntry = {
      id: `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      to: recipients.join(', '),
      subject,
      status: 'FAILED',
      errorMessage: err?.message || 'Unknown error',
    };
    emailLogs.unshift(entry);
    return { success: false, error: err?.message };
  }
}

// ==========================================
// 1. CRIAÇÃO DE CONTA (ACCOUNT CREATED)
// ==========================================
export async function sendAccountCreatedEmail({
  to,
  adminName,
  institutionName,
  adminEmail,
  temporaryPassword,
  role,
  preferredLanguage = 'pt',
}: {
  to: string;
  adminName: string;
  institutionName: string;
  adminEmail: string;
  temporaryPassword?: string;
  role?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const defaultRole = normLang === 'en'
    ? 'Institutional Administrator'
    : normLang === 'es'
    ? 'Administrador Institucional'
    : 'Administrador Institucional';
  const appUrl = getAppUrl();
  const template = getEmailTemplateById('ACCOUNT_CREATED', normLang) || DEFAULT_EMAIL_TEMPLATES[0];

  const variables: Record<string, string> = {
    nome: adminName,
    instituicao: institutionName,
    email: adminEmail,
    cargo: role || defaultRole,
    link_acesso: appUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'ACCOUNT_CREATED',
    to,
    subject,
    html,
    text,
  });
}

// ==========================================
// 2. CADASTRO DE DOMÍNIO (DOMAIN REGISTERED)
// ==========================================
export async function sendDomainRegisteredEmail({
  to,
  domainName,
  institutionName,
  submittedByEmail,
  preferredLanguage = 'pt',
}: {
  to: string;
  domainName: string;
  institutionName: string;
  submittedByEmail: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const appUrl = getAppUrl();
  const template = getEmailTemplateById('DOMAIN_REGISTERED', normLang) || DEFAULT_EMAIL_TEMPLATES[1];

  const variables: Record<string, string> = {
    dominio: domainName,
    instituicao: institutionName,
    solicitante: submittedByEmail,
    link_acesso: appUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'DOMAIN_REGISTERED',
    to,
    subject,
    html,
    text,
  });
}

// ==========================================
// 3. APROVAÇÃO DE DOMÍNIO PELO SUPERADMIN
// ==========================================
export async function sendDomainApprovedEmail({
  to,
  domainName,
  institutionName,
  txtToken,
  adminNotes,
  preferredLanguage = 'pt',
}: {
  to: string;
  domainName: string;
  institutionName: string;
  txtToken: string;
  adminNotes?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const appUrl = getAppUrl();
  const template = getEmailTemplateById('DOMAIN_APPROVED', normLang) || DEFAULT_EMAIL_TEMPLATES[2];

  const variables: Record<string, string> = {
    dominio: domainName,
    instituicao: institutionName,
    token_txt: txtToken,
    link_acesso: appUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'DOMAIN_APPROVED',
    to,
    subject,
    html,
    text,
  });
}

// ==========================================
// 4. VERIFICAÇÃO DE DOMÍNIO CONCLUÍDA
// ==========================================
export async function sendDomainVerifiedEmail({
  to,
  adminName,
  domainName,
  institutionName,
  preferredLanguage = 'pt',
}: {
  to: string;
  adminName: string;
  domainName: string;
  institutionName: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const appUrl = getAppUrl();
  const template = getEmailTemplateById('DOMAIN_VERIFIED', normLang) || DEFAULT_EMAIL_TEMPLATES[3];

  const variables: Record<string, string> = {
    nome: adminName,
    dominio: domainName,
    instituicao: institutionName,
    link_acesso: appUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'DOMAIN_VERIFIED',
    to,
    subject,
    html,
    text,
  });
}

// ==========================================
// 5. RESET DE SENHA (PASSWORD RESET)
// ==========================================
export async function sendPasswordResetEmail({
  to,
  userName,
  userEmail,
  tempPassword,
  resetLink,
  firebaseDirectLink,
  preferredLanguage = 'pt',
}: {
  to: string;
  userName: string;
  userEmail: string;
  tempPassword?: string;
  resetLink?: string;
  firebaseDirectLink?: string;
  oobCode?: string;
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  requestedBy?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const appUrl = getAppUrl();
  const finalCtaUrl = resetLink || firebaseDirectLink || `${appUrl}?mode=resetPassword&email=${encodeURIComponent(userEmail)}`;
  const template = getEmailTemplateById('PASSWORD_RESET', normLang) || DEFAULT_EMAIL_TEMPLATES[4];

  const variables: Record<string, string> = {
    nome: userName,
    email: userEmail,
    link_redefinicao: finalCtaUrl,
    link_acesso: appUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'PASSWORD_RESET',
    to,
    subject,
    html,
    text,
  });
}

// ==========================================
// 5.1 SENHA TEMPORÁRIA DO GOOGLE WORKSPACE
// ==========================================
export async function sendWorkspacePasswordResetEmail({
  recoveryEmail,
  userName,
  workspaceEmail,
  tempPassword,
  requestedBy,
  preferredLanguage = 'pt',
}: {
  recoveryEmail: string;
  userName: string;
  workspaceEmail: string;
  tempPassword: string;
  requestedBy?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const defaultRequestedBy = requestedBy || (normLang === 'en' ? 'Institutional Administrator' : normLang === 'es' ? 'Administrador Institucional' : 'Administrador Institucional');
  const template =
    getEmailTemplateById('WORKSPACE_PASSWORD_RESET', normLang) ||
    DEFAULT_EMAIL_TEMPLATES.find((t) => t.type === 'WORKSPACE_PASSWORD_RESET') ||
    DEFAULT_EMAIL_TEMPLATES[4];

  const variables: Record<string, string> = {
    nome: userName,
    email: workspaceEmail,
    email_workspace: workspaceEmail,
    senha_temporaria: tempPassword,
    link_acesso: 'https://accounts.google.com',
    solicitante: defaultRequestedBy,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'WORKSPACE_PASSWORD_RESET',
    to: recoveryEmail,
    subject,
    html,
    text,
  });
}

// ==========================================
// 6. BLOQUEIO E DESBLOQUEIO DE TENANTS
// ==========================================
export async function sendTenantStatusChangedEmail({
  to,
  tenantName,
  status,
  reason,
  contactSupportEmail = 'suporte@skoolia.net',
  preferredLanguage = 'pt',
}: {
  to: string;
  tenantName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  reason?: string;
  contactSupportEmail?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const appUrl = getAppUrl();
  const isSuspended = status === 'SUSPENDED' || status === 'BLOCKED';
  const statusLabel = isSuspended
    ? (normLang === 'en' ? 'Suspended' : normLang === 'es' ? 'Suspendida' : 'Suspensa')
    : (normLang === 'en' ? 'Active' : normLang === 'es' ? 'Activa' : 'Ativa');
  const defaultReason = reason || (normLang === 'en' ? 'Plan subscription or registration update' : normLang === 'es' ? 'Actualización de plan o registro' : 'Atualização cadastral do plano');
  const template = getEmailTemplateById('TENANT_STATUS', normLang) || DEFAULT_EMAIL_TEMPLATES[5];
  const dateLocale = normLang === 'en' ? 'en-US' : normLang === 'es' ? 'es-ES' : 'pt-BR';

  const variables: Record<string, string> = {
    instituicao: tenantName,
    status: statusLabel,
    motivo: defaultReason,
    data: new Date().toLocaleDateString(dateLocale),
    link_acesso: appUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'TENANT_STATUS',
    to,
    subject,
    html,
    text,
  });
}

// ==========================================
// 7. INFORMAÇÕES DE FATURA (INVOICE & BILLING)
// ==========================================
export async function sendInvoiceEmail({
  to,
  customerName,
  institutionName = 'Instituição de Ensino',
  invoiceNumber,
  amount,
  currency = 'USD',
  planName,
  paymentMethod = 'Cartão de Crédito',
  billingCycle = 'MONTHLY',
  date,
  invoicePdfUrl,
  hostedInvoiceUrl,
  preferredLanguage = 'pt',
}: {
  to: string | string[];
  customerName: string;
  institutionName?: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  planName: string;
  paymentMethod?: string;
  billingCycle?: 'MONTHLY' | 'ANNUAL';
  receiptId?: string;
  date?: string;
  taxId?: string;
  invoicePdfUrl?: string;
  hostedInvoiceUrl?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const dateLocale = normLang === 'en' ? 'en-US' : normLang === 'es' ? 'es-ES' : 'pt-BR';
  const appUrl = getAppUrl();
  const formattedAmount = new Intl.NumberFormat(dateLocale, {
    style: 'currency',
    currency: currency.toUpperCase() === 'BRL' ? 'BRL' : currency.toUpperCase() === 'EUR' ? 'EUR' : 'USD',
  }).format(amount);

  const cycleText = billingCycle === 'ANNUAL'
    ? (normLang === 'en' ? 'Annual' : normLang === 'es' ? 'Anual' : 'Anual')
    : (normLang === 'en' ? 'Monthly' : normLang === 'es' ? 'Mensual' : 'Mensal');

  const paymentMethodText = normLang === 'en' && paymentMethod.includes('Cartão')
    ? 'Credit Card'
    : normLang === 'es' && paymentMethod.includes('Cartão')
    ? 'Tarjeta de Crédito'
    : paymentMethod;

  const template = getEmailTemplateById('INVOICE', normLang) || DEFAULT_EMAIL_TEMPLATES[6];

  const primaryCtaUrl = invoicePdfUrl || hostedInvoiceUrl || `${appUrl}?tab=billing`;

  const variables: Record<string, string> = {
    nome: customerName,
    instituicao: institutionName,
    fatura_num: invoiceNumber,
    plano: planName,
    ciclo: cycleText,
    valor: formattedAmount,
    metodo_pagamento: paymentMethodText,
    data: date || new Date().toLocaleDateString(dateLocale),
    link_acesso: primaryCtaUrl,
    link_fatura_pdf: invoicePdfUrl || primaryCtaUrl,
    link_fatura_stripe: hostedInvoiceUrl || primaryCtaUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'INVOICE',
    to,
    subject,
    html,
    text,
  });
}

// ==========================================
// 8. BOAS-VINDAS AO TRIAL
// ==========================================
export async function sendTrialWelcomeEmail({
  to,
  adminName,
  institutionName,
  trialEndDate,
  preferredLanguage = 'pt',
}: {
  to: string;
  adminName: string;
  institutionName: string;
  trialEndDate?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const dateLocale = normLang === 'en' ? 'en-US' : normLang === 'es' ? 'es-ES' : 'pt-BR';
  const appUrl = getAppUrl();
  const template = getEmailTemplateById('TRIAL_WELCOME', normLang) || DEFAULT_EMAIL_TEMPLATES[7];

  const formattedDate = trialEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(dateLocale);

  const variables: Record<string, string> = {
    nome: adminName,
    instituicao: institutionName,
    data_expiracao: formattedDate,
    link_acesso: appUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'TRIAL_WELCOME',
    to,
    subject,
    html,
    text,
  });
}

// ==========================================
// 9. ABERTURA DE TICKET DE SUPORTE
// ==========================================
export async function sendTicketOpenedEmail({
  to,
  protocol,
  subject: ticketSubject,
  category,
  priority,
  requesterName,
  requesterEmail,
  institutionName = 'Instituição de Ensino',
  description,
  sla,
  date,
  preferredLanguage = 'pt',
}: {
  to: string | string[];
  protocol: string;
  subject: string;
  category: string;
  priority: string;
  requesterName: string;
  requesterEmail: string;
  institutionName?: string;
  description: string;
  sla?: string;
  date?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const dateLocale = normLang === 'en' ? 'en-US' : normLang === 'es' ? 'es-ES' : 'pt-BR';
  const appUrl = getAppUrl();
  const template =
    getEmailTemplateById('TICKET_OPENED', normLang) ||
    DEFAULT_EMAIL_TEMPLATES.find((t) => t.type === 'TICKET_OPENED') ||
    DEFAULT_EMAIL_TEMPLATES[9];

  const formattedHtmlDesc = formatTicketContent(cleanTicketText(description))
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n\n/g, '<br /><br />')
    .replace(/\n/g, '<br />');

  const variables: Record<string, string> = {
    protocolo: protocol,
    assunto: ticketSubject,
    categoria: category,
    prioridade: priority,
    solicitante: requesterName,
    email_solicitante: requesterEmail,
    instituicao: institutionName,
    descricao: formattedHtmlDesc,
    sla: sla || (normLang === 'en' ? 'Up to 8h' : normLang === 'es' ? 'Hasta 8h' : 'Até 8h'),
    data: date || new Date().toLocaleDateString(dateLocale),
    link_acesso: appUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'TICKET_OPENED',
    to,
    subject,
    html,
    text,
  });
}

// ==========================================
// 10. RESPOSTA EM TICKET DE SUPORTE
// ==========================================
export async function sendTicketRepliedEmail({
  to,
  protocol,
  subject: ticketSubject,
  senderName,
  senderRole,
  messageContent,
  status,
  institutionName = 'Instituição de Ensino',
  date,
  preferredLanguage = 'pt',
}: {
  to: string | string[];
  protocol: string;
  subject: string;
  senderName: string;
  senderRole: string;
  messageContent: string;
  status: string;
  institutionName?: string;
  date?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const dateLocale = normLang === 'en' ? 'en-US' : normLang === 'es' ? 'es-ES' : 'pt-BR';
  const appUrl = getAppUrl();
  const template =
    getEmailTemplateById('TICKET_REPLIED', normLang) ||
    DEFAULT_EMAIL_TEMPLATES.find((t) => t.type === 'TICKET_REPLIED') ||
    DEFAULT_EMAIL_TEMPLATES[10];

  const formattedContent = formatTicketContent(cleanTicketText(messageContent))
    .replace(/\n*Best regards,?\s*Skoolia Support Team\s*$/i, '')
    // Strip trailing plain-text signature so it doesn't get duplicated above the HTML signature card
    .replace(/\n*--\s*\n*(Equipe de Suporte|skoolia Support Team|Equipo de Soporte)[\s\S]*?(GMT-5\)?)/i, '')
    .trim();

  // Convert newlines to HTML <br /> for robust cross-client email rendering
  const formattedHtmlContent = formattedContent
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n\n/g, '<br /><br />')
    .replace(/\n/g, '<br />');

  // Official HTML Support Team signature matching user design (Image 2)
  const signatureHtml = `
<table cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #E2E6DF; font-family: 'Outfit', 'Inter', Arial, sans-serif; width: 100%;">
  <tr>
    <td style="vertical-align: middle; padding-right: 14px; width: 80px;">
      <span style="font-size: 24px; font-weight: 900; color: #163300; letter-spacing: -0.5px; font-family: 'Outfit', Arial, sans-serif;">skoolia</span>
    </td>
    <td style="width: 2px; background-color: #163300; height: 50px; padding: 0;"></td>
    <td style="vertical-align: middle; padding-left: 14px; font-size: 12px; line-height: 1.4; color: #0E0F0C;">
      <div style="font-weight: 700; color: #0E0F0C; font-size: 12.5px;">skoolia Support Team</div>
      <div style="color: #5E605D; font-size: 11px;">We're here to help.</div>
      <div style="margin-top: 3px;">
        <a href="mailto:support@skoolia.net" style="color: #0E0F0C; font-weight: 700; text-decoration: none;">support@skoolia.net</a>
      </div>
      <div style="margin-top: 2px; color: #0E0F0C; font-size: 11px; font-weight: 700;">
        skoolia.net <span style="color: #868685;">&middot;</span> Help Center
      </div>
    </td>
  </tr>
  <tr>
    <td colspan="3" style="padding-top: 8px; font-size: 10px; color: #868685;">
      Support hours: Mon–Fri, 8:00 AM–6:00 PM (GMT-5)
    </td>
  </tr>
</table>`;

  const finalHtmlMessage = `${formattedHtmlContent}${signatureHtml}`;

  const variables: Record<string, string> = {
    protocolo: protocol,
    assunto: ticketSubject,
    autor_resposta: senderName,
    cargo_autor: senderRole,
    mensagem: finalHtmlMessage,
    status,
    instituicao: institutionName,
    data: date || new Date().toLocaleDateString(dateLocale),
    link_acesso: appUrl,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  // gyrlatam@gmail.com recebe exclusivamente o alerta de superadmin na abertura de novos tickets
  const filteredRecipients = (Array.isArray(to) ? to : [to])
    .filter((addr) => typeof addr === 'string' && addr.trim().toLowerCase() !== 'gyrlatam@gmail.com');

  if (filteredRecipients.length === 0) {
    return {
      success: true,
      data: { id: `replied_skip_${Date.now()}` },
      note: 'Envio suprimido pois gyrlatam@gmail.com recebe apenas novos tickets.',
    };
  }

  return sendEmailCore({
    type: 'TICKET_REPLIED',
    to: filteredRecipients,
    subject,
    html,
    text,
  });
}

// ==========================================
// 11. AVISO DE NOVO TICKET PARA O SUPERADMIN
// ==========================================
export async function sendSuperAdminNewTicketEmail({
  to,
  protocol,
  subject: ticketSubject,
  category,
  priority,
  requesterName,
  requesterEmail,
  institutionName = 'Instituição de Ensino',
  description,
  sla,
  date,
  preferredLanguage = 'pt',
}: {
  to?: string | string[];
  protocol: string;
  subject: string;
  category: string;
  priority: string;
  requesterName: string;
  requesterEmail: string;
  institutionName?: string;
  description: string;
  sla?: string;
  date?: string;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const dateLocale = normLang === 'en' ? 'en-US' : normLang === 'es' ? 'es-ES' : 'pt-BR';
  const appUrl = getAppUrl();
  const template =
    getEmailTemplateById('SUPERADMIN_NEW_TICKET', normLang) ||
    DEFAULT_EMAIL_TEMPLATES.find((t) => t.type === 'SUPERADMIN_NEW_TICKET') ||
    DEFAULT_EMAIL_TEMPLATES[11];

  const defaultSuperAdminEmail =
    process.env.SUPERADMIN_NOTIFICATION_EMAIL || process.env.SUPERADMIN_EMAIL || 'gyrlatam@gmail.com';
  const rawRecipients = Array.isArray(to) ? to : to ? [to] : [defaultSuperAdminEmail];
  const recipients = rawRecipients.filter(
    (e): e is string => typeof e === 'string' && e.includes('@') && e.toLowerCase().trim() !== 'superadmin@skoolia.com'
  );
  if (recipients.length === 0) {
    recipients.push(defaultSuperAdminEmail);
  }

  const directTicketLink = `${appUrl}/?tab=support&ticket=${encodeURIComponent(protocol)}`;

  const variables: Record<string, string> = {
    protocolo: protocol,
    assunto: ticketSubject,
    categoria: category,
    prioridade: priority,
    solicitante: requesterName,
    email_solicitante: requesterEmail,
    instituicao: institutionName,
    descricao: description,
    sla: sla || (normLang === 'en' ? 'Up to 8h' : normLang === 'es' ? 'Hasta 8h' : 'Até 8h'),
    data: date || new Date().toLocaleDateString(dateLocale),
    link_acesso: directTicketLink,
    cta_url: directTicketLink,
  };

  const { html, text, subject } = renderEmailWithTemplate(template, variables, normLang);

  return sendEmailCore({
    type: 'SUPERADMIN_NEW_TICKET',
    to: recipients,
    subject,
    html,
    text,
  });
}

// In-memory deduplication cache for SuperAdmin new tenant alerts (15 minutes window)
const superAdminTenantNotificationCache = new Map<string, number>();

function isTenantNotificationDuplicate(dedupeKey: string): boolean {
  if (!dedupeKey) return false;
  const now = Date.now();
  const maxAge = 15 * 60 * 1000; // 15 minutes window
  for (const [key, timestamp] of superAdminTenantNotificationCache.entries()) {
    if (now - timestamp > maxAge) {
      superAdminTenantNotificationCache.delete(key);
    }
  }
  const cleanKey = dedupeKey.toLowerCase().trim();
  const lastSent = superAdminTenantNotificationCache.get(cleanKey);
  if (lastSent && now - lastSent < maxAge) {
    return true;
  }
  superAdminTenantNotificationCache.set(cleanKey, now);
  return false;
}

/**
 * Send Notification Email via Resend to SuperAdmin (gyrlatam@gmail.com) whenever a new tenant registers
 */
export async function sendSuperAdminNewTenantEmail({
  to = 'gyrlatam@gmail.com',
  institutionName,
  adminName,
  adminEmail,
  phone,
  country,
  plan,
  tenantId,
  date,
  preferredLanguage = 'pt',
}: {
  to?: string | string[];
  institutionName: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
  country?: string;
  plan?: string;
  tenantId?: string;
  date?: string;
  preferredLanguage?: string;
}) {
  const cleanAdminEmail = (adminEmail || '').toLowerCase().trim();
  const cleanTenantId = (tenantId || '').trim();

  // If the registering email is the SuperAdmin account itself, skip alert
  if (cleanAdminEmail === 'gyrlatam@gmail.com') {
    return { success: true, skipped: true, reason: 'SUPERADMIN_SELF_ACCOUNT' };
  }

  // Deduplication check: prevent multiple duplicate emails for the same tenant
  const dedupeKey = cleanTenantId || cleanAdminEmail;
  if (dedupeKey && isTenantNotificationDuplicate(dedupeKey)) {
    console.log(`[Resend Deduplication] Suppressed duplicate SuperAdmin new tenant alert for: ${dedupeKey}`);
    return { success: true, skipped: true, reason: 'DUPLICATE_SUPPRESSED' };
  }

  // Also lock the secondary key if available
  if (cleanAdminEmail && dedupeKey !== cleanAdminEmail) {
    isTenantNotificationDuplicate(cleanAdminEmail);
  }

  const normLang = normalizeEmailLanguage(preferredLanguage);
  const dateLocale = normLang === 'en' ? 'en-US' : normLang === 'es' ? 'es-ES' : 'pt-BR';
  const appUrl = getAppUrl();
  const template =
    getEmailTemplateById('SUPERADMIN_NEW_TENANT', normLang) ||
    DEFAULT_EMAIL_TEMPLATES.find((t) => t.type === 'SUPERADMIN_NEW_TENANT');

  const defaultSuperAdminEmail =
    process.env.SUPERADMIN_NOTIFICATION_EMAIL || process.env.SUPERADMIN_EMAIL || 'gyrlatam@gmail.com';
  const rawRecipients = Array.isArray(to) ? to : to ? [to] : [defaultSuperAdminEmail];
  const recipients = rawRecipients.filter(
    (e): e is string => typeof e === 'string' && e.includes('@')
  );
  if (recipients.length === 0) {
    recipients.push(defaultSuperAdminEmail);
  }

  const directTenantLink = `${appUrl}/?tab=tenants`;
  const now = new Date();
  const formattedDate =
    date ||
    now.toLocaleString(dateLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const variables: Record<string, string> = {
    instituicao: institutionName || 'Nova Organização',
    admin_nome: adminName || 'Administrador',
    admin_email: adminEmail,
    telefone: phone || (normLang === 'en' ? 'Not informed' : normLang === 'es' ? 'No informado' : 'Não informado'),
    pais: country || (normLang === 'en' ? 'Global' : 'Brasil'),
    plano: plan || (normLang === 'en' ? 'Trial (30 Days)' : normLang === 'es' ? 'Prueba (30 Días)' : 'Degustação (30 Dias)'),
    tenant_id: tenantId || 'tenant-auto',
    data_registro: formattedDate,
    link_acesso: directTenantLink,
    cta_url: directTenantLink,
  };

  const { html, text, subject } = template
    ? renderEmailWithTemplate(template, variables, normLang)
    : {
        html: `<p>Nova instituição registrada: <strong>${institutionName}</strong> (${adminEmail})</p>`,
        text: `Nova instituição registrada: ${institutionName} (${adminEmail})`,
        subject: `[Novo Tenant] ${institutionName} acabou de se registrar no sistema`,
      };

  return sendEmailCore({
    type: 'SUPERADMIN_NEW_TENANT',
    to: recipients,
    subject,
    html,
    text,
  });
}

/**
 * Send Test Email from SuperAdmin
 */
export async function sendTestEmail({
  templateId,
  toEmail,
  customVariables,
  preferredLanguage = 'pt',
}: {
  templateId: string;
  toEmail: string;
  customVariables?: Record<string, string>;
  preferredLanguage?: string;
}) {
  const normLang = normalizeEmailLanguage(preferredLanguage);
  const template = getEmailTemplateById(templateId, normLang);
  if (!template) {
    throw new Error('Modelo de e-mail não encontrado.');
  }

  const sampleVars: Record<string, string> = {};
  template.supportedVariables.forEach((v) => {
    sampleVars[v.key] = v.sampleValue;
  });

  const mergedVars = { ...sampleVars, ...(customVariables || {}) };
  const { html, text, subject } = renderEmailWithTemplate(template, mergedVars, normLang);

  const prefix = normLang === 'en' ? '[TEST]' : normLang === 'es' ? '[PRUEBA]' : '[TESTE]';
  return sendEmailCore({
    type: template.type,
    to: toEmail,
    subject: `${prefix} ${subject}`,
    html,
    text,
  });
}

/**
 * Get email system logs and status
 */
export function getEmailServiceLogs(): EmailLogEntry[] {
  return emailLogs;
}

export async function fetchLiveEmailLogs(): Promise<EmailLogEntry[]> {
  const now = Date.now();
  if (liveLogsCache && now - liveLogsCache.timestamp < CACHE_TTL_MS) {
    return liveLogsCache.data;
  }

  const resend = getResendClient();
  if (!resend) {
    return emailLogs;
  }

  try {
    const response: any = await resend.emails.list({ limit: 100 });
    let items: any[] = [];
    if (Array.isArray(response?.data?.data)) {
      items = response.data.data;
    } else if (Array.isArray(response?.data)) {
      items = response.data;
    } else if (Array.isArray(response)) {
      items = response;
    } else if (response?.data && typeof response.data === 'object') {
      const vals = Object.values(response.data);
      const foundArr = vals.find((v) => Array.isArray(v));
      if (foundArr) items = foundArr as any[];
    }

    const liveLogs: EmailLogEntry[] = items.map((item: any) => {
      const subject = item.subject || '';
      let type: any = 'TRANSACTIONAL';
      if (/boas-vindas|bienvenido|welcome|conta criada|cuenta creada|account created/i.test(subject)) {
        type = 'ACCOUNT_CREATED';
      } else if (/fatura|factura|invoice|receipt|comprovante|comprobante/i.test(subject)) {
        type = 'INVOICE_RECEIPT';
      } else if (/chamado|ticket|soporte|support/i.test(subject)) {
        type = 'TICKET_UPDATE';
      } else if (/domínio|dominio|domain|dns|txt/i.test(subject)) {
        type = 'DOMAIN_EVENT';
      } else if (/senha|password|contraseña/i.test(subject)) {
        type = 'PASSWORD_RESET';
      } else if (/suspensa|status|bloqueio|bloqueado/i.test(subject)) {
        type = 'TENANT_STATUS';
      } else if (/trial|avaliação|prueba/i.test(subject)) {
        type = 'TRIAL_WELCOME';
      }

      let status: any = 'DELIVERED';
      const event = (item.last_event || '').toLowerCase();
      if (event === 'delivered') {
        status = 'DELIVERED';
      } else if (event === 'sent') {
        status = 'SENT';
      } else if (event === 'bounced' || event === 'complained' || event === 'suppressed') {
        status = 'FAILED';
      }

      const toStr = Array.isArray(item.to) ? item.to.join(', ') : String(item.to || '');

      return {
        id: item.id,
        timestamp: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
        type,
        to: toStr,
        subject,
        status,
        resendId: item.id,
        errorMessage: event === 'bounced' ? 'Bounced' : event === 'suppressed' ? 'Suppressed by provider' : undefined,
      };
    });

    // Merge in-memory simulated logs or any recent logs not yet in the list
    const combined = [...liveLogs];
    for (const localLog of emailLogs) {
      if (!combined.some((c) => c.id === localLog.id || (localLog.resendId && c.id === localLog.resendId))) {
        combined.push(localLog);
      }
    }

    // Sort descending by timestamp
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    liveLogsCache = { timestamp: now, data: combined };
    return combined;
  } catch (err) {
    console.warn('[Resend] Failed to fetch live email logs, using local:', err);
    return emailLogs;
  }
}

export async function getEmailDetails(id: string): Promise<any | null> {
  const resend = getResendClient();
  if (!resend) {
    const local = emailLogs.find((l) => l.id === id || l.resendId === id);
    return local ? { ...local, html: `<p>${local.subject}</p>`, text: local.subject } : null;
  }

  try {
    const res = await resend.emails.get(id);
    if (res?.data) {
      return res.data;
    }
    const local = emailLogs.find((l) => l.id === id || l.resendId === id);
    return local || null;
  } catch (err: any) {
    console.warn(`[Resend] Failed getting email details for ${id}:`, err?.message);
    const local = emailLogs.find((l) => l.id === id || l.resendId === id);
    return local || null;
  }
}

export function getEmailServiceStatus(providedLogs?: EmailLogEntry[]): EmailServiceStatus {
  const isConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '');
  const logsToCount = providedLogs || liveLogsCache?.data || emailLogs;
  return {
    isConfigured,
    fromEmail: getFromAddress(),
    totalSent: logsToCount.filter((l) => l.status === 'SENT' || l.status === 'DELIVERED').length,
    totalSimulated: logsToCount.filter((l) => l.status === 'SIMULATED').length,
    totalFailed: logsToCount.filter((l) => l.status === 'FAILED').length,
  };
}
