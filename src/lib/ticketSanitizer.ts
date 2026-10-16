import type { SupportTicket } from '../types';

/**
 * Robust text cleaner to remove all references to Stripe, Superadmin,
 * and unwanted disclaimer notes in any casing, language (PT, ES, EN), or variation.
 */
export const cleanTicketText = (text?: string): string => {
  if (!text) return '';
  return text
    // Remove unwanted disclaimer paragraphs (ES, PT, EN and mixed typos)
    .replace(/Este correo fue transmitido exclusivamente al contacto de inicio de sesi[oó]n de la instituci[oó]n y al responsa[b|v]le t[eé]cnico registrado\.?\s*Puede dar seguimiento a las respuestas y enviar mensa[gj]es dire[ct]tamente desde la consola\.?/gi, '')
    .replace(/Este e-mail foi transmitido exclusivamente para o contato de login da instituição e o responsável técnico cadastrado\.?\s*Acompanhe as respostas e envie mensagens adicionais diretamente pelo console\.?/gi, '')
    .replace(/This notification was sent exclusively to the institution login contact and the registered technical lead\.?\s*You can track responses and send updates directly via the management console\.?/gi, '')
    .replace(/Puede responder a este mensaje en cualquier momento accediendo a la consola de gestión\.?\s*Esta notificación se transmite al contacto de inicio de sesión y al responsable técnico registrado\.?/gi, '')
    .replace(/Você pode responder a esta mensagem a qualquer momento acessando o console de gestão\.?\s*Esta notificação é transmitida para o contato de login da instituição e o responsável técnico cadastrado\.?/gi, '')
    .replace(/You can reply to this message anytime by accessing the management console\.?\s*This notification is sent to the institution login contact and technical lead\.?/gi, '')

    // Stripe phrases (PT, ES, EN)
    .replace(/processado com sucesso no Stripe/gi, 'aprovado com sucesso')
    .replace(/processado com sucesso pelo Stripe/gi, 'aprovado com sucesso')
    .replace(/procesado con éxito en Stripe/gi, 'aprobado con éxito')
    .replace(/procesado con éxito por Stripe/gi, 'aprobado con éxito')
    .replace(/successfully processed in Stripe/gi, 'successfully approved')
    .replace(/successfully processed by Stripe/gi, 'successfully approved')
    .replace(/pelo callback do Stripe/gi, 'pelo sistema após a confirmação do pagamento')
    .replace(/por el callback de Stripe/gi, 'por el sistema tras la confirmación del pago')
    .replace(/via aprovação de pagamento no Stripe/gi, 'via confirmação de pagamento')
    .replace(/via aprobación de pago en Stripe/gi, 'via confirmación de pago')
    .replace(/Stripe Billing/gi, 'Atendimento')
    .replace(/Fatura Stripe:\s*/gi, 'Fatura: ')
    .replace(/Factura Stripe:\s*/gi, 'Factura: ')
    .replace(/Stripe Invoice:\s*/gi, 'Invoice: ')
    .replace(/Sessão Stripe:\s*/gi, 'ID da Transação: ')
    .replace(/Sesión Stripe:\s*/gi, 'ID de la Transacción: ')
    .replace(/Stripe Session:\s*/gi, 'Transaction ID: ')
    .replace(/no Stripe/gi, '')
    .replace(/en Stripe/gi, '')
    .replace(/in Stripe/gi, '')
    .replace(/pelo Stripe/gi, 'pelo sistema')
    .replace(/por Stripe/gi, 'por el sistema')
    .replace(/by Stripe/gi, 'by the system')
    .replace(/\bStripe\b/gi, '')

    // Superadmin phrases (PT, ES, EN)
    .replace(/equipe de Superadministradores/gi, 'equipe de suporte técnico')
    .replace(/equipo de Superadministradores/gi, 'equipo de soporte técnico')
    .replace(/team of Superadministrators/gi, 'technical support team')
    .replace(/equipe de Superadmin/gi, 'equipe de suporte técnico')
    .replace(/equipo de Superadmin/gi, 'equipo de suporte técnico')
    .replace(/Superadministradores/gi, 'equipe de suporte técnico')
    .replace(/Superadministrador/gi, 'suporte técnico')
    .replace(/Superadministradora/gi, 'suporte técnico')
    .replace(/Superadministración/gi, 'suporte técnico')
    .replace(/Atenção Superadmin:/gi, 'Atenção equipe técnica:')
    .replace(/Atención Superadmin:/gi, 'Atención equipo técnico:')
    .replace(/Attention Superadmin:/gi, 'Attention technical team:')
    .replace(/Aviso SuperAdmin/gi, 'Aviso Suporte Técnico')
    .replace(/SuperAdmin Alert/gi, 'Technical Support Alert')
    .replace(/SuperAdmin/g, 'Equipe Técnica')
    .replace(/Superadmin/gi, 'equipe técnica')

    // Clean html artifacts
    .replace(/<p style="font-size: 13px; color: #5E605D;">\s*<\/p>/gi, '')
    // Normalize Windows line endings
    .replace(/\r\n/g, '\n')
    // Replace multiple consecutive horizontal spaces/tabs on same line with a single space (preserves \n and \n\n)
    .replace(/[^\S\r\n]{2,}/g, ' ')
    // Clean space before commas and dots on same line
    .replace(/[^\S\r\n]+,/g, ',')
    .replace(/[^\S\r\n]+\./g, '.')
    // Limit excessive consecutive blank lines to maximum of 2 newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Ensures line breaks and formatted text are preserved and cleanly rendered.
 * If text had lost line breaks from previous flattening, restores list/paragraph breaks.
 */
export function formatTicketContent(text?: string): string {
  if (!text) return '';
  // Unescape JSON-escaped newlines and normalize Windows CRLF
  let formatted = text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');

  // If text already has multiple line breaks, keep them as is (only normalize excessive breaks)
  const newlineCount = (formatted.match(/\n/g) || []).length;
  if (newlineCount >= 2) {
    return formatted.replace(/\n{3,}/g, '\n\n').trim();
  }

  // Restore line breaks for flattened lists, numbered steps, and section titles
  formatted = formatted
    .replace(/([.:?!])\s+(\d+\.\s+[A-Za-z0-9])/g, '$1\n\n$2')
    .replace(/(:\s*)(\d+\.\s+[A-Za-z0-9])/g, ':\n\n$2')
    .replace(/([.:?!])\s+([-\u2022]\s+[A-Za-z0-9])/g, '$1\n\n$2')
    .replace(/(:\s*)([-\u2022]\s+[A-Za-z0-9])/g, ':\n$2')
    .replace(/(\?\s*)([-\u2022]\s+[A-Za-z0-9])/g, '?\n$2')
    .replace(/([.:?!])\s+(Quick check before you start:)/gi, '$1\n\n$2')
    .replace(/([.:?!])\s+(One important detail:)/gi, '$1\n\n$2')
    .replace(/([.:?!])\s+(I can see you currently)/gi, '$1\n\n$2')
    .replace(/([.:?!])\s+(Could you let me know:)/gi, '$1\n\n$2')
    .replace(/([.:?!])\s+(With that information)/gi, '$1\n\n$2')
    .replace(/([.:?!])\s+(Best regards,?\s*Skoolia Support Team)/gi, '$1\n\n$2')
    .replace(/([.:?!])\s+(Atenciosamente,?\s*Equipe Skoolia)/gi, '$1\n\n$2')
    .replace(/([.:?!])\s+(Saludos cordiales,?\s*Equipo Skoolia)/gi, '$1\n\n$2');

  return formatted.trim();
}

/**
 * Standardized support agent signature
 */
export function getAgentSignature(lang: SupportedTicketLanguage = 'pt'): string {
  if (lang === 'en') {
    return [
      '--',
      'skoolia Support Team',
      "We're here to help.",
      'support@skoolia.net',
      'skoolia.net · Help Center',
      'Support hours: Mon–Fri, 8:00 AM–6:00 PM (GMT-5)',
    ].join('\n');
  }
  if (lang === 'es') {
    return [
      '--',
      'Equipo de Soporte skoolia',
      'Estamos para ayudar.',
      'support@skoolia.net',
      'skoolia.net · Centro de Ayuda',
      'Horario de atención: Lun–Vie, 8:00 AM–6:00 PM (GMT-5)',
    ].join('\n');
  }
  return [
    '--',
    'Equipe de Suporte skoolia',
    'Estamos aqui para ajudar.',
    'support@skoolia.net',
    'skoolia.net · Central de Ajuda',
    'Horário de atendimento: Seg–Sex, 08:00–18:00 (GMT-5)',
  ].join('\n');
}

/**
 * Appends official support signature to agent messages if not already present
 */
export function appendAgentSignature(content: string, lang: SupportedTicketLanguage = 'pt'): string {
  if (!content) return '';
  const clean = content.trim();
  // Check if message already ends with or includes the official signature
  if (
    /support@skoolia\.net/i.test(clean) ||
    /Equipe de Suporte skoolia/i.test(clean) ||
    /skoolia Support Team/i.test(clean) ||
    /Equipo de Soporte skoolia/i.test(clean)
  ) {
    return clean;
  }
  return `${clean}\n\n${getAgentSignature(lang)}`;
}

export type SupportedTicketLanguage = 'pt' | 'en' | 'es';

/**
 * Accurately detects whether a support ticket subject / description was written
 * in English ('en'), Spanish ('es'), or Portuguese ('pt').
 */
export function detectTicketLanguage(
  subject?: string,
  description?: string,
  preferredFallback: SupportedTicketLanguage = 'pt'
): SupportedTicketLanguage {
  const text = `${subject || ''} ${description || ''}`.toLowerCase();
  if (!text.trim()) return preferredFallback;

  // Distinctive English vocabulary & grammar markers
  const enPatterns = [
    /\b(hello|hi|dear|greetings|good morning|good afternoon|good evening)\b/i,
    /\b(thanks|thank you|regards|sincerely|cheers|best|please|kindly)\b/i,
    /\b(help|need|needed|issue|issues|problem|trouble|error|request|ticket)\b/i,
    /\b(cannot|can't|unable|could|would|should|having|working|doesn't|does not)\b/i,
    /\b(domain|domains|license|licenses|account|accounts|user|users|email|emails)\b/i,
    /\b(billing|invoice|payment|subscription|admin|console|setup|verify|dns)\b/i,
    /\b(the|is|are|was|were|have|has|had|with|from|about|our|we|you|your|their)\b/i,
    /\b(quote|pricing|upgrade|migration|urgent|inquiry|question)\b/i,
  ];

  // Distinctive Spanish vocabulary & grammar markers
  const esPatterns = [
    /\b(hola|estimad[oa]s?|buenos d[ií]as|buenas tardes|buenas noches|saludos)\b/i,
    /\b(gracias|atentamente|cordial|por favor|ayuda|necesit[ao]s?|necesitamos)\b/i,
    /\b(problema|soporte|solicitud|ticket|consulta|error|falla|inconveniente)\b/i,
    /\b(no puedo|no podemos|podr[ií]an|quisi[eé]ramos|tenemos|estamos|requerimos)\b/i,
    /\b(dominio|dominios|licencias?|cuentas?|usuarios?|correo|correos)\b/i,
    /\b(facturaci[oó]n|factura|pago|suscripci[oó]n|consola|configuraci[oó]n|instituci[oó]n)\b/i,
    /\b(el|la|los|las|un|una|unos|unas|para|con|por|sin|sobre|nuestro|nuestra)\b/i,
    /\b(cotizaci[oó]n|precios?|actualizaci[oó]n|migraci[oó]n|urgente)\b/i,
  ];

  // Distinctive Portuguese vocabulary & grammar markers
  const ptPatterns = [
    /\b(ol[aá]|prezad[oa]s?|bom dia|boa tarde|boa noite|sauda[cç][oõ]es)\b/i,
    /\b(obrigad[oa]|atenciosamente|cordialmente|por favor|ajuda|precis[ao]s?|precisamos)\b/i,
    /\b(problema|suporte|solicita[cç][aã]o|chamado|ticket|d[uú]vida|falha|erro)\b/i,
    /\b(n[aã]o consigo|n[aã]o podemos|poderiam|gostar[ií]amos|temos|estamos|requeremos)\b/i,
    /\b(dom[ií]nio|dom[ií]nios|licen[cç]as?|contas?|usu[aá]rios?|e-mail|emails)\b/i,
    /\b(faturamento|fatura|pagamento|assinatura|painel|configura[cç][aã]o|institui[cç][aã]o)\b/i,
    /\b(o|a|os|as|um|uma|uns|umas|para|com|por|sem|sobre|nosso|nossa)\b/i,
    /\b(cota[cç][aã]o|pre[cç]os?|atualiza[cç][aã]o|migra[cç][aã]o|urgente)\b/i,
  ];

  let enScore = 0;
  let esScore = 0;
  let ptScore = 0;

  for (const p of enPatterns) {
    const m = text.match(p);
    if (m) enScore += m.length;
  }
  for (const p of esPatterns) {
    const m = text.match(p);
    if (m) esScore += m.length;
  }
  for (const p of ptPatterns) {
    const m = text.match(p);
    if (m) ptScore += m.length;
  }

  // Language-specific diacritics/characters
  if (/[ñ¿¡]/.test(text)) esScore += 3;
  if (/[ãõç]/.test(text)) ptScore += 3;

  if (enScore > esScore && enScore > ptScore && enScore >= 2) return 'en';
  if (esScore > enScore && esScore > ptScore && esScore >= 2) return 'es';
  if (ptScore > enScore && ptScore > esScore && ptScore >= 2) return 'pt';

  return preferredFallback;
}

/**
 * Sanitizes a support ticket completely: subject, description, institution name and messages.
 */
export const sanitizeTicket = (t: SupportTicket, fallbackInstName?: string): SupportTicket => {
  if (!t) return t;

  const effectiveLang: SupportedTicketLanguage =
    t.preferredLanguage === 'en' || t.preferredLanguage === 'es' || t.preferredLanguage === 'pt'
      ? t.preferredLanguage
      : detectTicketLanguage(t.subject, t.description, 'pt');

  let institutionName = t.institutionName;
  if (!institutionName || institutionName === 'Instituição Educacional' || institutionName === 'Instituição de Ensino') {
    if (t.requesterName && t.requesterName !== 'Administrador Institucional' && !t.requesterName.includes('@')) {
      institutionName = t.requesterName;
    } else if (fallbackInstName && fallbackInstName !== 'Instituição Educacional' && fallbackInstName !== 'Instituição de Ensino') {
      institutionName = fallbackInstName;
    } else {
      institutionName = effectiveLang === 'en' ? 'Educational Institution' : effectiveLang === 'es' ? 'Institución Educativa' : 'Instituição de Ensino';
    }
  }

  let subject = t.subject || '';
  if (institutionName && subject.includes('Instituição Educacional')) {
    subject = subject.replace(/\s*-\s*Instituição Educacional/gi, ` - ${institutionName}`);
  }
  subject = cleanTicketText(subject);

  const description = formatTicketContent(cleanTicketText(t.description));

  const messages = (t.messages || []).map((m) => {
    let content = formatTicketContent(cleanTicketText(m.content));
    let senderName = cleanTicketText(m.senderName) || (effectiveLang === 'en' ? 'Skoolia System' : effectiveLang === 'es' ? 'Sistema Skoolia' : 'Sistema Skoolia');

    // If this is an automated bot response message on an English or Spanish ticket, adapt the greeting
    if (m.id.startsWith('msg-auto') || /Recebemos a sua solicitação com protocolo/i.test(content)) {
      if (effectiveLang === 'en') {
        senderName = 'Google Specialist Support';
        content = content.replace(
          /Olá\s+([^!]+)!\s*Recebemos a sua solicitação com protocolo\s*#?([A-Za-z0-9-_]+)\.\s*Nosso time técnico de suporte já foi notificado e está analisando o caso para a sua instituição\./gi,
          'Hello $1! We have received your request with protocol #$2. Our technical support team has been notified and is reviewing your case for your institution.'
        );
      } else if (effectiveLang === 'es') {
        senderName = 'Atención Especializada Google';
        content = content.replace(
          /Olá\s+([^!]+)!\s*Recebemos a sua solicitação com protocolo\s*#?([A-Za-z0-9-_]+)\.\s*Nosso time técnico de suporte já foi notificado e está analisando o caso para a sua instituição\./gi,
          '¡Hola $1! Hemos recibido su solicitud con protocolo #$2. Nuestro equipo técnico de soporte ha sido notificado y está analizando el caso para su institución.'
        );
      }
    } else if (m.senderRole === 'SUPPORT_AGENT') {
      content = appendAgentSignature(content, effectiveLang);
    }

    return {
      ...m,
      senderName,
      content,
    };
  });

  return {
    ...t,
    preferredLanguage: effectiveLang,
    institutionName: institutionName || (effectiveLang === 'en' ? 'Educational Institution' : effectiveLang === 'es' ? 'Institución Educativa' : 'Instituição de Ensino'),
    subject,
    description,
    messages,
  };
};
