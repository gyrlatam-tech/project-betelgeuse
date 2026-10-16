import type { EmailTemplateType } from '../src/types';

export interface LocalizedEmailContent {
  subject: string;
  preheader: string;
  badgeText: string;
  badgeColor?: string;
  title: string;
  bodyHtml: string;
  ctaText: string;
  footerNote: string;
}

export type EmailLocale = 'pt' | 'en' | 'es';

export const LOCALIZED_TEMPLATE_METADATA: Record<
  EmailLocale,
  Record<EmailTemplateType, { name: string; description: string; category: string }>
> = {
  pt: {
    ACCOUNT_CREATED: {
      name: 'Boas-vindas e Criação de Conta',
      description: 'Enviado ao administrador ou usuário quando uma nova conta é criada na instituição.',
      category: 'Onboarding',
    },
    DOMAIN_REGISTERED: {
      name: 'Domínio Cadastrado / Em Homologação',
      description: 'Enviado ao administrador quando um novo domínio educacional é submetido para análise.',
      category: 'Domínios',
    },
    DOMAIN_APPROVED: {
      name: 'Domínio Aprovado / Configuração TXT DNS',
      description: 'Enviado quando o domínio educacional é aprovado e é emitido o token TXT do Google Workspace.',
      category: 'Domínios',
    },
    DOMAIN_VERIFIED: {
      name: 'Domínio Ativado e Verificado',
      description: 'Enviado quando o DNS é propagado e o domínio está 100% ativo para criação de contas.',
      category: 'Domínios',
    },
    PASSWORD_RESET: {
      name: 'Redefinição de Senha',
      description: 'Enviado quando um usuário solicita a recuperação ou redefinição de sua senha.',
      category: 'Segurança',
    },
    WORKSPACE_PASSWORD_RESET: {
      name: 'Senha de Acesso Google Workspace',
      description: 'Enviado ao e-mail de recuperação do usuário quando o administrador redefine a senha de acesso ao Workspace.',
      category: 'Segurança',
    },
    TENANT_STATUS: {
      name: 'Atualização de Status da Instituição',
      description: 'Notificação enviada quando o status da instituição é alterado (ativo, suspenso, cancelado).',
      category: 'Administração',
    },
    INVOICE: {
      name: 'Fatura e Comprovante de Pagamento',
      description: 'Enviado automaticamente após a emissão ou confirmação de pagamento de uma fatura.',
      category: 'Faturamento',
    },
    TRIAL_WELCOME: {
      name: 'Boas-vindas ao Período de Testes (Trial)',
      description: 'Enviado aos novos clientes que iniciam o período de degustação de 30 dias na plataforma.',
      category: 'Onboarding',
    },
    TICKET_OPENED: {
      name: 'Novo Chamado de Suporte Aberto',
      description: 'Confirmação de recebimento enviada ao cliente com o número de protocolo do chamado.',
      category: 'Suporte',
    },
    TICKET_REPLIED: {
      name: 'Resposta ao Chamado de Suporte',
      description: 'Notificação enviada quando um agente ou o cliente envia uma nova mensagem no chamado.',
      category: 'Suporte',
    },
    SUPERADMIN_NEW_TICKET: {
      name: 'Aviso de Novo Chamado (SuperAdmin)',
      description: 'Alerta prioritário enviado ao SuperAdmin e equipe de atendimento com os dados do chamado para resposta imediata.',
      category: 'Suporte',
    },
    SUPERADMIN_NEW_TENANT: {
      name: 'Aviso de Novo Tenant Cadastrado (SuperAdmin)',
      description: 'Notificação automática enviada via Resend ao SuperAdmin (gyrlatam@gmail.com) toda vez que uma nova instituição se registra no sistema.',
      category: 'SuperAdmin',
    },
  },
  en: {
    ACCOUNT_CREATED: {
      name: 'Welcome & Account Creation',
      description: 'Sent to the administrator or user when a new account is created in the institution.',
      category: 'Onboarding',
    },
    DOMAIN_REGISTERED: {
      name: 'Domain Registered / In Review',
      description: 'Sent to the administrator when a new educational domain is submitted for review.',
      category: 'Domains',
    },
    DOMAIN_APPROVED: {
      name: 'Domain Approved / DNS TXT Setup',
      description: 'Sent when the educational domain is approved and the Google Workspace TXT token is issued.',
      category: 'Domains',
    },
    DOMAIN_VERIFIED: {
      name: 'Domain Activated & Verified',
      description: 'Sent when DNS is propagated and the domain is 100% active for account creation.',
      category: 'Domains',
    },
    PASSWORD_RESET: {
      name: 'Password Reset',
      description: 'Sent when a user requests recovery or reset of their password.',
      category: 'Security',
    },
    WORKSPACE_PASSWORD_RESET: {
      name: 'Google Workspace Access Password',
      description: 'Sent to the user recovery email when the administrator resets Workspace access password.',
      category: 'Security',
    },
    TENANT_STATUS: {
      name: 'Institution Status Update',
      description: 'Notification sent when the institution status changes (active, suspended, canceled).',
      category: 'Administration',
    },
    INVOICE: {
      name: 'Invoice & Payment Receipt',
      description: 'Sent automatically after an invoice is issued or payment is confirmed.',
      category: 'Billing',
    },
    TRIAL_WELCOME: {
      name: 'Welcome to Trial Period',
      description: 'Sent to new clients starting their 30-day trial period on the platform.',
      category: 'Onboarding',
    },
    TICKET_OPENED: {
      name: 'New Support Ticket Opened',
      description: 'Receipt confirmation sent to the client with the support ticket protocol number.',
      category: 'Support',
    },
    TICKET_REPLIED: {
      name: 'Response to Support Ticket',
      description: 'Notification sent when an agent or client sends a new message on the ticket.',
      category: 'Support',
    },
    SUPERADMIN_NEW_TICKET: {
      name: 'New Ticket Alert (SuperAdmin)',
      description: 'Priority alert sent to the SuperAdmin and support team with ticket details to reply to the client.',
      category: 'Support',
    },
    SUPERADMIN_NEW_TENANT: {
      name: 'New Tenant Registered Notice (SuperAdmin)',
      description: 'Automatic notification sent via Resend to the SuperAdmin (gyrlatam@gmail.com) whenever a new tenant registers on the system.',
      category: 'SuperAdmin',
    },
  },
  es: {
    ACCOUNT_CREATED: {
      name: 'Bienvenida y Creación de Cuenta',
      description: 'Enviado al administrador o usuario cuando se crea una nueva cuenta en la institución.',
      category: 'Onboarding',
    },
    DOMAIN_REGISTERED: {
      name: 'Dominio Registrado / En Homologación',
      description: 'Enviado al administrador cuando se envía un nuevo dominio educativo para análisis.',
      category: 'Dominios',
    },
    DOMAIN_APPROVED: {
      name: 'Dominio Aprobado / Configuración TXT DNS',
      description: 'Enviado cuando se aprueba el dominio educativo y se emite el token TXT de Google Workspace.',
      category: 'Dominios',
    },
    DOMAIN_VERIFIED: {
      name: 'Dominio Activado y Verificado',
      description: 'Enviado cuando el DNS se propaga y el dominio está 100% activo para creación de cuentas.',
      category: 'Dominios',
    },
    PASSWORD_RESET: {
      name: 'Restablecimiento de Contraseña',
      description: 'Enviado cuando un usuario solicita la recuperación o restablecimiento de su contraseña.',
      category: 'Seguridad',
    },
    WORKSPACE_PASSWORD_RESET: {
      name: 'Contraseña de Acceso Google Workspace',
      description: 'Enviado al correo de recuperación del usuario cuando el administrador restablece la contraseña de Workspace.',
      category: 'Seguridad',
    },
    TENANT_STATUS: {
      name: 'Actualización de Estado de la Institución',
      description: 'Notificación enviada cuando cambia el estado de la institución (activo, suspendido, cancelado).',
      category: 'Administración',
    },
    INVOICE: {
      name: 'Factura y Comprobante de Pago',
      description: 'Enviado automáticamente tras la emisión o confirmación de pago de una factura.',
      category: 'Facturación',
    },
    TRIAL_WELCOME: {
      name: 'Bienvenida al Período de Prueba',
      description: 'Enviado a los nuevos clientes que inician su período de prueba de 30 días en la plataforma.',
      category: 'Onboarding',
    },
    TICKET_OPENED: {
      name: 'Nuevo Ticket de Soporte Abierto',
      description: 'Confirmación de recepción enviada al cliente con el número de protocolo del ticket.',
      category: 'Soporte',
    },
    TICKET_REPLIED: {
      name: 'Respuesta a Ticket de Soporte',
      description: 'Notificación enviada cuando un agente o cliente envía un nuevo mensaje en el ticket.',
      category: 'Soporte',
    },
    SUPERADMIN_NEW_TICKET: {
      name: 'Aviso de Nuevo Ticket (SuperAdmin)',
      description: 'Alerta prioritaria enviada al SuperAdmin y equipo de soporte con detalles del ticket para respuesta inmediata.',
      category: 'Soporte',
    },
    SUPERADMIN_NEW_TENANT: {
      name: 'Aviso de Nuevo Tenant Registrado (SuperAdmin)',
      description: 'Notificación automática enviada vía Resend al SuperAdmin (gyrlatam@gmail.com) cada vez que una nueva institución se registra en el sistema.',
      category: 'SuperAdmin',
    },
  },
};

export const LOCALIZED_VARIABLE_LABELS: Record<
  EmailLocale,
  Record<string, { label: string; description: string }>
> = {
  pt: {
    nome: { label: 'Nome do Usuário', description: 'Nome completo do administrador ou usuário' },
    instituicao: { label: 'Nome da Instituição', description: 'Nome da instituição de ensino' },
    email: { label: 'E-mail do Usuário', description: 'Endereço de e-mail institucional Google' },
    cargo: { label: 'Perfil / Cargo', description: 'Papel do usuário no sistema' },
    link_acesso: { label: 'Link de Acesso', description: 'URL para login no sistema' },
    dominio: { label: 'Domínio', description: 'Domínio educacional oficial' },
    solicitante: { label: 'Solicitante', description: 'Nome de quem solicitou a ação' },
    txt_token: { label: 'Token TXT Google', description: 'Token de validação oficial do Google' },
    status: { label: 'Novo Status', description: 'Novo estado operacional da conta' },
    motivo: { label: 'Motivo', description: 'Justificativa da alteração de status' },
    data: { label: 'Data da Alteração', description: 'Data em que ocorreu a ação' },
    fatura_num: { label: 'Número da Fatura', description: 'Identificador único da fatura' },
    valor: { label: 'Valor da Fatura', description: 'Valor total cobrado' },
    vencimento: { label: 'Data de Vencimento', description: 'Prazo limite para pagamento' },
    senha_temporaria: { label: 'Senha Provisória', description: 'Senha temporária para primeiro login' },
    dias_restantes: { label: 'Dias Restantes', description: 'Dias restantes de avaliação' },
    limite_usuarios: { label: 'Limite de Contas', description: 'Número máximo de licenças' },
    protocolo: { label: 'Protocolo do Chamado', description: 'Número do ticket de suporte' },
    assunto_chamado: { label: 'Assunto do Chamado', description: 'Título do ticket de suporte' },
    mensagem: { label: 'Conteúdo da Mensagem', description: 'Texto da resposta do suporte' },
    atendente: { label: 'Atendente de Suporte', description: 'Nome do especialista de suporte' },
    admin_nome: { label: 'Nome do Administrador', description: 'Nome do responsável pelo tenant' },
    admin_email: { label: 'E-mail do Administrador', description: 'E-mail do administrador do tenant' },
    telefone: { label: 'Telefone de Contato', description: 'Telefone ou WhatsApp informado' },
    pais: { label: 'País / Região', description: 'País de origem da instituição' },
    plano: { label: 'Plano / Modalidade', description: 'Modalidade de plano contratado ou período trial' },
    tenant_id: { label: 'ID do Tenant', description: 'Identificador único do tenant no sistema' },
    data_registro: { label: 'Data do Registro', description: 'Data e hora da inscrição' },
  },
  en: {
    nome: { label: 'User Name', description: 'Full name of the administrator or user' },
    instituicao: { label: 'Institution Name', description: 'Name of the educational institution' },
    email: { label: 'User Email', description: 'Google institutional email address' },
    cargo: { label: 'Role / Position', description: 'User role within the platform' },
    link_acesso: { label: 'Access Link', description: 'URL to sign in to the platform' },
    dominio: { label: 'Domain', description: 'Official educational domain' },
    solicitante: { label: 'Requester Name', description: 'Name of the requester' },
    txt_token: { label: 'Google TXT Token', description: 'Official Google verification token' },
    status: { label: 'New Status', description: 'New operational status of the account' },
    motivo: { label: 'Reason', description: 'Reason for the status change' },
    data: { label: 'Date of Change', description: 'Date the action occurred' },
    fatura_num: { label: 'Invoice Number', description: 'Unique invoice identifier' },
    valor: { label: 'Invoice Amount', description: 'Total billed amount' },
    vencimento: { label: 'Due Date', description: 'Payment deadline' },
    senha_temporaria: { label: 'Temporary Password', description: 'Temporary password for initial login' },
    dias_restantes: { label: 'Days Remaining', description: 'Remaining days of the trial period' },
    limite_usuarios: { label: 'Account Limit', description: 'Maximum number of accounts' },
    protocolo: { label: 'Ticket Protocol', description: 'Support ticket number' },
    assunto_chamado: { label: 'Ticket Subject', description: 'Support ticket subject title' },
    mensagem: { label: 'Message Content', description: 'Text of the support reply' },
    atendente: { label: 'Support Agent', description: 'Name of the support specialist' },
    admin_nome: { label: 'Administrator Name', description: 'Name of the tenant administrator' },
    admin_email: { label: 'Administrator Email', description: 'Email address of the administrator' },
    telefone: { label: 'Contact Phone', description: 'Phone or WhatsApp number provided' },
    pais: { label: 'Country / Region', description: 'Country of the institution' },
    plano: { label: 'Plan / Mode', description: 'Subscription plan or trial mode' },
    tenant_id: { label: 'Tenant ID', description: 'Unique identifier of the tenant' },
    data_registro: { label: 'Registration Date', description: 'Date and time of registration' },
  },
  es: {
    nome: { label: 'Nombre del Usuario', description: 'Nombre completo del administrador o usuario' },
    instituicao: { label: 'Nombre de la Institución', description: 'Nombre de la institución educativa' },
    email: { label: 'Correo del Usuario', description: 'Dirección de correo institucional de Google' },
    cargo: { label: 'Perfil / Cargo', description: 'Rol del usuario en el sistema' },
    link_acesso: { label: 'Enlace de Acceso', description: 'URL para iniciar sesión en el sistema' },
    dominio: { label: 'Dominio', description: 'Dominio educativo oficial' },
    solicitante: { label: 'Solicitante', description: 'Nombre de quien solicitó la acción' },
    txt_token: { label: 'Token TXT de Google', description: 'Token de verificación oficial de Google' },
    status: { label: 'Nuevo Estado', description: 'Nuevo estado operativo de la cuenta' },
    motivo: { label: 'Motivo', description: 'Motivo del cambio de estado' },
    data: { label: 'Fecha del Cambio', description: 'Fecha en que ocurrió la acción' },
    fatura_num: { label: 'Número de Factura', description: 'Identificador único de la factura' },
    valor: { label: 'Monto de la Factura', description: 'Monto total facturado' },
    vencimento: { label: 'Fecha de Vencimiento', description: 'Fecha límite de pago' },
    senha_temporaria: { label: 'Contraseña Temporal', description: 'Contraseña temporal para el primer inicio' },
    dias_restantes: { label: 'Días Restantes', description: 'Días restantes del período de prueba' },
    limite_usuarios: { label: 'Límite de Cuentas', description: 'Número máximo de cuentas' },
    protocolo: { label: 'Protocolo del Ticket', description: 'Número de protocolo del ticket' },
    assunto_chamado: { label: 'Asunto del Ticket', description: 'Asunto del ticket de soporte' },
    mensagem: { label: 'Contenido del Mensaje', description: 'Texto de la respuesta de soporte' },
    atendente: { label: 'Agente de Soporte', description: 'Nombre del especialista de soporte' },
    admin_nome: { label: 'Nombre del Administrador', description: 'Nombre del responsable del tenant' },
    admin_email: { label: 'Correo del Administrador', description: 'Correo del administrador del tenant' },
    telefone: { label: 'Teléfono de Contacto', description: 'Teléfono o WhatsApp informado' },
    pais: { label: 'País / Región', description: 'País de origen de la institución' },
    plano: { label: 'Plan / Modalidad', description: 'Modalidad de plan contratado o período de prueba' },
    tenant_id: { label: 'ID del Tenant', description: 'Identificador único del tenant en el sistema' },
    data_registro: { label: 'Fecha de Registro', description: 'Fecha y hora de la inscripción' },
  },
};

export const LOCALIZED_EMAIL_TEMPLATES: Record<EmailLocale, Record<EmailTemplateType, LocalizedEmailContent>> = {
  pt: {
    ACCOUNT_CREATED: {
      subject: 'Boas-vindas à skoolia - Conta criada para {{instituicao}}',
      preheader: 'Sua conta institucional para {{instituicao}} está pronta para acesso com a Conta Google.',
      badgeText: 'Conta Criada',
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
      footerNote: 'O acesso é autenticado e protegido diretamente pela infraestrutura de segurança do Google Workspace.',
    },
    DOMAIN_REGISTERED: {
      subject: 'Domínio {{dominio}} cadastrado - Aguardando Homologação',
      preheader: 'O domínio {{dominio}} foi submetido para homologação no Google Workspace.',
      badgeText: 'Análise de Domínio',
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
      footerNote: 'A análise técnica costuma levar poucos minutos em horário comercial.',
    },
    DOMAIN_APPROVED: {
      subject: '✅ Domínio {{dominio}} aprovado! Configure o registro TXT',
      preheader: 'Configure o registro TXT DNS para ativar {{dominio}} no Google Workspace.',
      badgeText: 'Domínio Aprovado',
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
      footerNote: 'A propagação DNS pode levar de alguns minutos até algumas horas dependendo do seu provedor.',
    },
    DOMAIN_VERIFIED: {
      subject: '🎉 Domínio {{dominio}} verificado com sucesso no Google Workspace!',
      preheader: 'Seu domínio {{dominio}} está 100% ativo e pronto para criação de contas.',
      badgeText: 'Domínio Ativo',
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
      footerNote: 'As contas criadas já terão acesso imediato ao Gmail, Google Drive, Classroom e Google Meet.',
    },
    PASSWORD_RESET: {
      subject: 'Redefinição de senha da sua conta skoolia',
      preheader: 'Link seguro para redefinição de senha da sua conta skoolia.',
      badgeText: 'Segurança da Conta',
      title: 'Redefinição de Senha',
      bodyHtml: `<p>Olá, <strong>{{nome}}</strong>,</p>
<p>Recebemos uma solicitação para redefinir a senha da sua conta de acesso institucional (<strong>{{email}}</strong>).</p>

<p>Clique no botão abaixo para escolher uma nova senha de acesso segura:</p>`,
      ctaText: 'Redefinir Minha Senha',
      footerNote: 'Se você não solicitou a redefinição de senha, desconsidere esta mensagem. Sua conta permanece segura.',
    },
    WORKSPACE_PASSWORD_RESET: {
      subject: 'Sua nova senha de acesso ao Google Workspace ({{email}})',
      preheader: 'Sua senha temporária de acesso ao Google Workspace foi gerada pelo administrador.',
      badgeText: 'Acesso Google Workspace',
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
      footerNote: 'Esta credencial temporária foi enviada para o seu e-mail de recuperação cadastrado. Se você não solicitou esta redefinição, contate imediatamente o suporte da sua instituição.',
    },
    TENANT_STATUS: {
      subject: 'Aviso: Instituição {{instituicao}} teve o status atualizado para {{status}}',
      preheader: 'A instituição {{instituicao}} está agora com status: {{status}}.',
      badgeText: 'Status da Conta',
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
      footerNote: 'Em caso de dúvidas sobre políticas de uso, consulte nossos termos de serviço.',
    },
    INVOICE: {
      subject: 'Comprovante de Fatura #{{fatura_num}} - skoolia ({{valor}})',
      preheader: 'Fatura #{{fatura_num}} no valor de {{valor}} processada com sucesso.',
      badgeText: 'Fatura Paga',
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
      footerNote: 'Documento auxiliar de quitação de serviços digitais.',
    },
    TRIAL_WELCOME: {
      subject: 'Seu período de teste de 30 dias na skoolia começou!',
      preheader: 'Aproveite 30 dias de licenças ilimitadas e provisionamento no Google Workspace.',
      badgeText: 'Trial Ativado',
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
      footerNote: 'Nenhuma cobrança automática será realizada antes do término do seu período de testes.',
    },
    TICKET_OPENED: {
      subject: '[Suporte #{{protocolo}}] Chamado Aberto: {{assunto}}',
      preheader: 'Seu chamado #{{protocolo}} foi recebido e está na fila prioritária de atendimento.',
      badgeText: 'Chamado Aberto',
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
      footerNote: 'Central de Atendimento e Suporte.',
    },
    TICKET_REPLIED: {
      subject: '[Suporte #{{protocolo}}] Nova Resposta: {{assunto}}',
      preheader: 'O especialista {{autor_resposta}} enviou uma resposta no chamado #{{protocolo}}.',
      badgeText: 'Resposta de Suporte',
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
      footerNote: 'Atendimento Especializado Google Workspace.',
    },
    SUPERADMIN_NEW_TICKET: {
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
      footerNote: 'Alerta prioritário automático para Administradores da Plataforma.',
    },
    SUPERADMIN_NEW_TENANT: {
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
      footerNote: 'Notificação automática enviada via Resend para o SuperAdmin do sistema.',
    },
  },

  en: {
    ACCOUNT_CREATED: {
      subject: 'Welcome to skoolia - Account created for {{instituicao}}',
      preheader: 'Your institutional account for {{instituicao}} is ready to access with your Google Account.',
      badgeText: 'Account Created',
      title: 'Welcome to the skoolia platform',
      bodyHtml: `<p>Hello, <strong>{{nome}}</strong>!</p>
<p>Your institutional account on the <strong>skoolia</strong> platform was successfully created. You now have access to the Google Workspace administration and provisioning dashboard.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Institution:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Access Email:</span>
    <span class="info-value">{{email}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Access Role:</span>
    <span class="info-value" style="color: #008a46;">{{cargo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Sign-in Method:</span>
    <span class="info-value" style="font-family: inherit;">Google Account (Google Sign-In)</span>
  </div>
</div>

<p><strong>How to access your account:</strong></p>
<p>Access is directly integrated with your <strong>Google Account</strong>. Simply click <strong>"Sign in with Google"</strong> using the authorized email above.</p>

<p><strong>Recommended next steps:</strong></p>
<ol style="padding-left: 20px; margin: 12px 0;">
  <li>Access the dashboard clicking the button below and sign in with your Google Account.</li>
  <li>Register the official educational domain of your institution.</li>
  <li>Wait for technical validation and DNS verification.</li>
  <li>Batch import your students and teachers.</li>
</ol>`,
      ctaText: 'Sign in with Google',
      footerNote: 'Access is authenticated and protected directly by Google Workspace security infrastructure.',
    },
    DOMAIN_REGISTERED: {
      subject: 'Domain {{dominio}} registered - Pending Review',
      preheader: 'The domain {{dominio}} has been submitted for Google Workspace review.',
      badgeText: 'Domain Under Review',
      title: 'Domain Registered for Review',
      bodyHtml: `<p>We would like to inform you that the educational domain <strong>{{dominio}}</strong> was registered in the skoolia platform for institution <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Domain:</span>
    <span class="info-value">{{dominio}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Institution:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Current Status:</span>
    <span class="info-value" style="color: #f59e0b; font-family: inherit;">Pending Approval</span>
  </div>
  <div class="info-item">
    <span class="info-label">Requested by:</span>
    <span class="info-value">{{solicitante}}</span>
  </div>
</div>

<p>Our specialized technical team has been notified to validate the domain and generate the official Google Workspace TXT verification record. You will receive an update once review is complete.</p>`,
      ctaText: 'View Domain Status',
      footerNote: 'Technical review usually takes only a few minutes during business hours.',
    },
    DOMAIN_APPROVED: {
      subject: '✅ Domain {{dominio}} approved! Configure DNS TXT record',
      preheader: 'Configure the DNS TXT record to activate {{dominio}} on Google Workspace.',
      badgeText: 'Domain Approved',
      title: 'Domain Approved - Action Required on DNS',
      bodyHtml: `<p>Great news! The domain <strong>{{dominio}}</strong> for institution <strong>{{instituicao}}</strong> was approved and is ready for Google Workspace activation.</p>

<p>To finalize activation and start creating institutional email accounts, add the following TXT record to your DNS zone provider (e.g., Cloudflare, GoDaddy, Route 53):</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Record Type:</span>
    <span class="info-value">TXT</span>
  </div>
  <div class="info-item">
    <span class="info-label">Host / Entry:</span>
    <span class="info-value">@ (or {{dominio}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Recommended TTL:</span>
    <span class="info-value">3600 (1 hour)</span>
  </div>
</div>

<p><strong>TXT Record Value (Google Verification Token):</strong></p>
<div class="token-box">{{token_txt}}</div>

<p>After adding the DNS record, click the button below to test propagation and activate educational licenses.</p>`,
      ctaText: 'Check DNS Propagation',
      footerNote: 'DNS propagation may take from a few minutes up to several hours depending on your provider.',
    },
    DOMAIN_VERIFIED: {
      subject: '🎉 Domain {{dominio}} successfully verified on Google Workspace!',
      preheader: 'Your domain {{dominio}} is 100% active and ready for account creation.',
      badgeText: 'Domain Active',
      title: 'Domain Verified & Operational',
      bodyHtml: `<p>Congratulations, <strong>{{nome}}</strong>!</p>
<p>The domain <strong>{{dominio}}</strong> has been successfully verified on Google Workspace. The corresponding Organizational Unit (OU) has been provisioned and Google Workspace licenses are released.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Domain:</span>
    <span class="info-value" style="color: #008a46;">{{dominio}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Institution:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Google Admin Status:</span>
    <span class="info-value" style="color: #00c868; font-family: inherit;">VERIFIED / ACTIVE</span>
  </div>
  <div class="info-item">
    <span class="info-label">Released Licenses:</span>
    <span class="info-value" style="font-family: inherit;">Unlimited (Fundamentals)</span>
  </div>
</div>

<p>You can now batch import student and teacher lists or create individual users directly from the console.</p>`,
      ctaText: 'Create Accounts on Domain',
      footerNote: 'Created accounts will have immediate access to Gmail, Google Drive, Classroom, and Google Meet.',
    },
    PASSWORD_RESET: {
      subject: 'Reset your skoolia account password',
      preheader: 'Secure link to reset your skoolia account password.',
      badgeText: 'Account Security',
      title: 'Password Reset',
      bodyHtml: `<p>Hello, <strong>{{nome}}</strong>,</p>
<p>We received a request to reset the password for your institutional access account (<strong>{{email}}</strong>).</p>

<p>Click the button below to choose a secure new password:</p>`,
      ctaText: 'Reset My Password',
      footerNote: 'If you did not request a password reset, please ignore this message. Your account remains secure.',
    },
    WORKSPACE_PASSWORD_RESET: {
      subject: 'Your new Google Workspace access password ({{email}})',
      preheader: 'Your temporary Google Workspace access password was generated by your administrator.',
      badgeText: 'Google Workspace Access',
      title: 'Your New Temporary Password',
      bodyHtml: `<p>Hello, <strong>{{nome}}</strong>,</p>
<p>A new temporary access password for your institutional <strong>Google Workspace</strong> account was generated by your institution administrator:</p>

<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
  <div style="margin-bottom: 12px;">
    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block;">Google Workspace Account:</span>
    <span style="font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">{{email}}</span>
  </div>
  <div>
    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block;">New Temporary Password:</span>
    <span style="display: inline-block; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 14px; font-size: 16px; font-weight: 700; color: #008a46; font-family: monospace; letter-spacing: 1px; margin-top: 4px;">{{senha_temporaria}}</span>
  </div>
</div>

<p style="color: #475569; font-size: 13px; line-height: 1.6;">
  <strong>Important:</strong> Upon your first login at <strong>accounts.google.com</strong> with this temporary password, Google will require you to set your own permanent password.
</p>`,
      ctaText: 'Sign in to Google Workspace',
      footerNote: 'This temporary credential was sent to your registered recovery email. If you did not request this reset, contact your institution support immediately.',
    },
    TENANT_STATUS: {
      subject: 'Notice: Institution {{instituicao}} status updated to {{status}}',
      preheader: 'Institution {{instituicao}} status is now: {{status}}.',
      badgeText: 'Account Status',
      title: 'Institution Status Update',
      bodyHtml: `<p>Dear Administrator,</p>
<p>We inform you that the status of institution <strong>{{instituicao}}</strong> on the skoolia platform has been updated to: <strong>{{status}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Institution:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">New Status:</span>
    <span class="info-value" style="font-family: inherit;">{{status}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Date of Change:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Reason / Details:</span>
    <span class="info-value" style="font-family: inherit;">{{motivo}}</span>
  </div>
</div>

<p>If you have any questions or require assistance, please contact our support team.</p>`,
      ctaText: 'Access skoolia Dashboard',
      footerNote: 'For questions regarding usage policies, please refer to our terms of service.',
    },
    INVOICE: {
      subject: 'Invoice Receipt #{{fatura_num}} - skoolia ({{valor}})',
      preheader: 'Invoice #{{fatura_num}} for {{valor}} has been successfully processed.',
      badgeText: 'Invoice Paid',
      title: 'Invoice Receipt',
      bodyHtml: `<p>Hello, <strong>{{nome}}</strong>,</p>
<p>We confirm the payment processing for your subscribed services on the <strong>skoolia</strong> platform for institution <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Invoice Number:</span>
    <span class="info-value">#{{fatura_num}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Subscribed Plan:</span>
    <span class="info-value" style="font-family: inherit;">{{plano}} ({{ciclo}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Total Amount:</span>
    <span class="info-value" style="color: #008a46; font-size: 16px;">{{valor}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Payment Status:</span>
    <span class="info-value" style="color: #00c868; font-family: inherit;">PAID / APPROVED</span>
  </div>
  <div class="info-item">
    <span class="info-label">Payment Method:</span>
    <span class="info-value" style="font-family: inherit;">{{metodo_pagamento}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Issue Date:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="font-size: 13px; color: #5E605D;">
  This invoice ensures renewal of your licensing and unlimited educational account provisioning capacity. You can view your complete invoice history anytime in the <strong>Billing</strong> tab.
</p>`,
      ctaText: 'View Invoices in Dashboard',
      footerNote: 'Digital auxiliary receipt for digital services.',
    },
    TRIAL_WELCOME: {
      subject: 'Your 30-day trial period on skoolia has started!',
      preheader: 'Enjoy 30 days of unlimited licenses and provisioning on Google Workspace.',
      badgeText: 'Trial Activated',
      title: 'Trial with Unlimited Licenses Activated',
      bodyHtml: `<p>Hello, <strong>{{nome}}</strong>!</p>
<p>Your 30-day trial period of the <strong>skoolia</strong> platform for institution <strong>{{instituicao}}</strong> is now active.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Institution:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Trial Duration:</span>
    <span class="info-value" style="color: #008a46; font-family: inherit;">30 Free Days</span>
  </div>
  <div class="info-item">
    <span class="info-label">Available Licenses:</span>
    <span class="info-value" style="color: #008a46; font-family: inherit;">Unlimited (Students & Teachers)</span>
  </div>
  <div class="info-item">
    <span class="info-label">Trial Expiration:</span>
    <span class="info-value" style="font-family: inherit;">{{data_expiracao}}</span>
  </div>
</div>

<p>During the trial period, you can register and verify your official domain, import student accounts, and test all security features without restriction or immediate charge.</p>`,
      ctaText: 'Start Configuration',
      footerNote: 'No automatic charges will be made before your trial period expires.',
    },
    TICKET_OPENED: {
      subject: '[Support #{{protocolo}}] Ticket Opened: {{assunto}}',
      preheader: 'Your ticket #{{protocolo}} was received and is in our priority queue.',
      badgeText: 'Ticket Opened',
      title: 'Support Ticket Registered',
      bodyHtml: `<p>Hello!</p>
<p>We confirm that a support ticket was opened for institution <strong>{{instituicao}}</strong>. Our technical team has been notified for review.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Protocol:</span>
    <span class="info-value" style="color: #008a46; font-size: 15px;">#{{protocolo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Subject:</span>
    <span class="info-value" style="font-family: inherit;">{{assunto}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Category:</span>
    <span class="info-value" style="font-family: inherit;">{{categoria}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Priority:</span>
    <span class="info-value" style="font-family: inherit;">{{prioridade}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Requester:</span>
    <span class="info-value" style="font-family: inherit;">{{solicitante}} ({{email_solicitante}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Date Registered:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="margin-top: 16px; font-weight: 600; color: #0E0F0C;">Ticket Description:</p>
<div style="background-color: #F4F5F0; border-left: 3px solid #00c868; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #373A36; white-space: pre-wrap; margin-bottom: 20px;">{{descricao}}</div>`,
      ctaText: 'Track Ticket in Dashboard',
      footerNote: 'Support and Help Desk.',
    },
    TICKET_REPLIED: {
      subject: '[Support #{{protocolo}}] New Reply: {{assunto}}',
      preheader: 'Specialist {{autor_resposta}} sent a reply on ticket #{{protocolo}}.',
      badgeText: 'Support Reply',
      title: 'New Reply on Your Ticket',
      bodyHtml: `<p>Hello!</p>
<p>There is a new interaction on ticket <strong>#{{protocolo}}</strong> for institution <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Protocol:</span>
    <span class="info-value" style="color: #008a46; font-size: 15px;">#{{protocolo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Subject:</span>
    <span class="info-value" style="font-family: inherit;">{{assunto}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Replied by:</span>
    <span class="info-value" style="font-family: inherit;">{{autor_resposta}} ({{cargo_autor}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Current Status:</span>
    <span class="info-value" style="font-family: inherit; color: #163300; font-weight: 800;">{{status}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Message Date:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="margin-top: 16px; font-weight: 600; color: #0E0F0C;">Message Content:</p>
<div style="background-color: #F4F5F0; border-left: 3px solid #3b82f6; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #373A36; white-space: pre-wrap; margin-bottom: 20px;">{{mensagem}}</div>`,
      ctaText: 'Reply in Console',
      footerNote: 'Google Workspace Support.',
    },
    SUPERADMIN_NEW_TICKET: {
      subject: '[New Ticket #{{protocolo}}] {{instituicao}}: {{assunto}}',
      preheader: 'New support ticket opened by {{instituicao}} awaiting response from the team.',
      badgeText: 'Technical Support',
      badgeColor: '#163300',
      title: 'New Ticket Awaiting Reply',
      bodyHtml: `<p>Hello, <strong>Technical Support Team</strong>!</p>
<p>A new support ticket was opened on the platform and requires technical team attention to reply to institution <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Protocol:</span>
    <span class="info-value" style="color: #163300; font-size: 15px; font-weight: 800;">#{{protocolo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Institution:</span>
    <span class="info-value" style="font-family: inherit; font-weight: 700;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Subject:</span>
    <span class="info-value" style="font-family: inherit;">{{assunto}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Category:</span>
    <span class="info-value" style="font-family: inherit;">{{categoria}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Priority:</span>
    <span class="info-value" style="font-family: inherit; font-weight: 700;">{{prioridade}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Requester:</span>
    <span class="info-value" style="font-family: inherit;">{{solicitante}} ({{email_solicitante}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Target SLA:</span>
    <span class="info-value" style="font-family: inherit;">{{sla}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Opened Date:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="margin-top: 16px; font-weight: 600; color: #0E0F0C;">Client Description:</p>
<div style="background-color: #F4F5F0; border-left: 3px solid #163300; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #373A36; white-space: pre-wrap; margin-bottom: 20px;">{{descricao}}</div>

<p style="font-size: 13px; color: #5E605D;">
  Access the ticket in the console to send a technical reply directly to the customer.
</p>`,
      ctaText: 'Reply to Ticket',
      footerNote: 'Automated priority alert for Platform Administrators.',
    },
    SUPERADMIN_NEW_TENANT: {
      subject: '[New Tenant] {{instituicao}} has just registered on the platform',
      preheader: 'New institution registered: {{instituicao}} | Admin: {{admin_nome}} ({{admin_email}})',
      badgeText: 'SuperAdmin • New Tenant',
      badgeColor: '#163300',
      title: 'New Educational Institution Registered',
      bodyHtml: `<p>Hello, <strong>SuperAdmin</strong>!</p>
<p>A new institution has just registered on the platform. Here are the tenant registration details:</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Institution Name:</span>
    <span class="info-value" style="color: #163300; font-size: 15px; font-weight: 800;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Administrator:</span>
    <span class="info-value" style="font-weight: 700;">{{admin_nome}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Contact Email:</span>
    <span class="info-value">{{admin_email}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Phone / WhatsApp:</span>
    <span class="info-value">{{telefone}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Country / Region:</span>
    <span class="info-value">{{pais}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Plan / Mode:</span>
    <span class="info-value" style="color: #008a46; font-weight: 700;">{{plano}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Tenant ID:</span>
    <span class="info-value" style="font-family: monospace;">{{tenant_id}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Registration Date:</span>
    <span class="info-value">{{data_registro}}</span>
  </div>
</div>

<p style="font-size: 13px; color: #5E605D; margin-top: 16px;">
  You can manage this new tenant, configure domains, and assign licenses directly from the SuperAdmin console.
</p>`,
      ctaText: 'Manage in SuperAdmin Console',
      footerNote: 'Automatic notification sent via Resend for the platform SuperAdmin.',
    },
  },

  es: {
    ACCOUNT_CREATED: {
      subject: 'Bienvenido a skoolia - Cuenta creada para {{instituicao}}',
      preheader: 'Su cuenta institucional para {{instituicao}} está lista para acceder con su Cuenta de Google.',
      badgeText: 'Cuenta Creada',
      title: 'Bienvenido a la plataforma skoolia',
      bodyHtml: `<p>¡Hola, <strong>{{nome}}</strong>!</p>
<p>Su cuenta institucional en la plataforma <strong>skoolia</strong> se creó con éxito. Ahora tiene acceso al panel de administración y aprovisionamiento de Google Workspace.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Institución:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Correo de Acceso:</span>
    <span class="info-value">{{email}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Rol de Acceso:</span>
    <span class="info-value" style="color: #008a46;">{{cargo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Método de Acceso:</span>
    <span class="info-value" style="font-family: inherit;">Cuenta de Google (Google Sign-In)</span>
  </div>
</div>

<p><strong>Cómo acceder a su cuenta:</strong></p>
<p>El acceso está integrado directamente con su <strong>Cuenta de Google</strong>. Simplemente haga clic en el botón <strong>"Iniciar sesión con Google"</strong> con el correo autorizado.</p>

<p><strong>Próximos pasos recomendados:</strong></p>
<ol style="padding-left: 20px; margin: 12px 0;">
  <li>Acceda al panel haciendo clic en el botón abajo e inicie sesión con su Cuenta de Google.</li>
  <li>Registre el dominio educativo oficial de su institución.</li>
  <li>Espere la validación técnica y verificación de DNS.</li>
  <li>Realice la importación masiva de alumnos y profesores.</li>
</ol>`,
      ctaText: 'Acceder con Google',
      footerNote: 'El acceso está autenticado y protegido directamente por la infraestructura de seguridad de Google Workspace.',
    },
    DOMAIN_REGISTERED: {
      subject: 'Dominio {{dominio}} registrado - Pendiente de Aprobación',
      preheader: 'El dominio {{dominio}} fue enviado para aprobación en Google Workspace.',
      badgeText: 'Revisión de Dominio',
      title: 'Dominio Registrado para Aprobación',
      bodyHtml: `<p>Le informamos que el dominio educativo <strong>{{dominio}}</strong> fue registrado en la plataforma skoolia para la institución <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Dominio:</span>
    <span class="info-value">{{dominio}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Institución:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Estado Actual:</span>
    <span class="info-value" style="color: #f59e0b; font-family: inherit;">Pendiente de Aprobación</span>
  </div>
  <div class="info-item">
    <span class="info-label">Solicitado por:</span>
    <span class="info-value">{{solicitante}}</span>
  </div>
</div>

<p>Nuestro equipo técnico especializado ha sido notificado para validar el dominio y generar el registro TXT de verificación oficial de Google Workspace. Recibirá una notificación en cuanto se complete la aprobación.</p>`,
      ctaText: 'Ver Estado del Dominio',
      footerNote: 'La revisión técnica suele demorar pocos minutos en horario laboral.',
    },
    DOMAIN_APPROVED: {
      subject: '✅ ¡Dominio {{dominio}} aprobado! Configure el registro TXT',
      preheader: 'Configure el registro TXT de DNS para activar {{dominio}} en Google Workspace.',
      badgeText: 'Dominio Aprobado',
      title: 'Dominio Aprobado - Acción Requerida en DNS',
      bodyHtml: `<p>¡Excelente noticia! El dominio <strong>{{dominio}}</strong> de la institución <strong>{{instituicao}}</strong> ha sido aprobado y liberado para su activación en Google Workspace.</p>

<p>Para concluir la activación oficial y comenzar a crear cuentas de correo institucional, añada el siguiente registro TXT en la zona DNS de su proveedor (ej: Cloudflare, GoDaddy, DonDominio):</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Tipo de Registro:</span>
    <span class="info-value">TXT</span>
  </div>
  <div class="info-item">
    <span class="info-label">Nombre / Host:</span>
    <span class="info-value">@ (o {{dominio}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">TTL Recomendado:</span>
    <span class="info-value">3600 (1 hora)</span>
  </div>
</div>

<p><strong>Valor del Registro TXT (Token de Verificación Google):</strong></p>
<div class="token-box">{{token_txt}}</div>

<p>Después de insertar el registro DNS, haga clic en el botón abajo para verificar la propagación y activar las licencias educativas.</p>`,
      ctaText: 'Verificar Propagación DNS',
      footerNote: 'La propagación DNS puede tardar de unos minutos a unas horas según su proveedor.',
    },
    DOMAIN_VERIFIED: {
      subject: '🎉 ¡Dominio {{dominio}} verificado con éxito en Google Workspace!',
      preheader: 'Su dominio {{dominio}} está 100% activo y listo para la creación de cuentas.',
      badgeText: 'Dominio Activo',
      title: 'Dominio Verificado y Operativo',
      bodyHtml: `<p>¡Felicitaciones, <strong>{{nome}}</strong>!</p>
<p>El dominio <strong>{{dominio}}</strong> ha sido verificado con éxito en Google Workspace. La Unidad Organizativa (OU) correspondiente ha sido aprovisionada y las licencias de Google Workspace están liberadas.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Dominio:</span>
    <span class="info-value" style="color: #008a46;">{{dominio}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Institución:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Estado Google Admin:</span>
    <span class="info-value" style="color: #00c868; font-family: inherit;">VERIFICADO / ACTIVO</span>
  </div>
  <div class="info-item">
    <span class="info-label">Licencias Liberadas:</span>
    <span class="info-value" style="font-family: inherit;">Ilimitadas (Fundamentals)</span>
  </div>
</div>

<p>Ya puede importar listas de alumnos y profesores o crear usuarios individuales directamente desde el panel.</p>`,
      ctaText: 'Crear Cuentas en el Dominio',
      footerNote: 'Las cuentas creadas tendrán acceso inmediato a Gmail, Google Drive, Classroom y Google Meet.',
    },
    PASSWORD_RESET: {
      subject: 'Restablecimiento de contraseña de su cuenta skoolia',
      preheader: 'Enlace seguro para restablecer la contraseña de su cuenta skoolia.',
      badgeText: 'Seguridad de la Cuenta',
      title: 'Restablecimiento de Contraseña',
      bodyHtml: `<p>Hola, <strong>{{nome}}</strong>,</p>
<p>Recibimos una solicitud para restablecer la contraseña de su cuenta de acceso institucional (<strong>{{email}}</strong>).</p>

<p>Haga clic en el botón de abajo para elegir una nueva contraseña de acceso segura:</p>`,
      ctaText: 'Restablecer Mi Contraseña',
      footerNote: 'Si no solicitó el restablecimiento de contraseña, ignore este mensaje. Su cuenta permanece protegida.',
    },
    WORKSPACE_PASSWORD_RESET: {
      subject: 'Su nueva contraseña de acceso a Google Workspace ({{email}})',
      preheader: 'Su administrador ha generado una contraseña temporal de acceso a Google Workspace.',
      badgeText: 'Acceso Google Workspace',
      title: 'Su Nueva Contraseña Temporal',
      bodyHtml: `<p>Hola, <strong>{{nome}}</strong>,</p>
<p>El administrador de su institución ha generado una nueva contraseña temporal de acceso para su cuenta institucional de <strong>Google Workspace</strong>:</p>

<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
  <div style="margin-bottom: 12px;">
    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block;">Cuenta Google Workspace:</span>
    <span style="font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">{{email}}</span>
  </div>
  <div>
    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block;">Nueva Contraseña Temporal:</span>
    <span style="display: inline-block; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 14px; font-size: 16px; font-weight: 700; color: #008a46; font-family: monospace; letter-spacing: 1px; margin-top: 4px;">{{senha_temporaria}}</span>
  </div>
</div>

<p style="color: #475569; font-size: 13px; line-height: 1.6;">
  <strong>Importante:</strong> Al iniciar sesión por primera vez en <strong>accounts.google.com</strong> con esta contraseña temporal, Google le solicitará obligatoriamente que defina su propia contraseña definitiva.
</p>`,
      ctaText: 'Acceder a Google Workspace',
      footerNote: 'Esta credencial temporal se envió a su correo de recuperación registrado. Si no solicitó este cambio, comuníquese de inmediato con el soporte de su institución.',
    },
    TENANT_STATUS: {
      subject: 'Aviso: El estado de la institución {{instituicao}} se actualizó a {{status}}',
      preheader: 'La institución {{instituicao}} ahora tiene el estado: {{status}}.',
      badgeText: 'Estado de la Cuenta',
      title: 'Actualización de Estado de la Institución',
      bodyHtml: `<p>Estimado/a Administrador/a,</p>
<p>Le informamos que el estado de la institución <strong>{{instituicao}}</strong> en la plataforma skoolia ha sido actualizado a: <strong>{{status}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Institución:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Nuevo Estado:</span>
    <span class="info-value" style="font-family: inherit;">{{status}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Fecha de Cambio:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Motivo / Detalles:</span>
    <span class="info-value" style="font-family: inherit;">{{motivo}}</span>
  </div>
</div>

<p>Si tiene dudas o requiere asistencia, comuníquese con nuestro equipo de atención.</p>`,
      ctaText: 'Acceder al Panel skoolia',
      footerNote: 'En caso de dudas sobre las políticas de uso, consulte nuestros términos de servicio.',
    },
    INVOICE: {
      subject: 'Comprobante de Factura #{{fatura_num}} - skoolia ({{valor}})',
      preheader: 'Factura #{{fatura_num}} por valor de {{valor}} procesada con éxito.',
      badgeText: 'Factura Pagada',
      title: 'Comprobante de Factura',
      bodyHtml: `<p>Hola, <strong>{{nome}}</strong>,</p>
<p>Confirmamos el procesamiento de su factura correspondiente a los servicios contratados en la plataforma <strong>skoolia</strong> para la institución <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Número de Factura:</span>
    <span class="info-value">#{{fatura_num}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Plan Contratado:</span>
    <span class="info-value" style="font-family: inherit;">{{plano}} ({{ciclo}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Monto Total:</span>
    <span class="info-value" style="color: #008a46; font-size: 16px;">{{valor}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Estado de Pago:</span>
    <span class="info-value" style="color: #00c868; font-family: inherit;">PAGADO / APROBADO</span>
  </div>
  <div class="info-item">
    <span class="info-label">Método de Pago:</span>
    <span class="info-value" style="font-family: inherit;">{{metodo_pagamento}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Fecha de Emisión:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="font-size: 13px; color: #5E605D;">
  Esta factura garantiza la renovación de su licenciamiento y capacidad ilimitada de aprovisionamiento de cuentas educativas. Puede consultar el historial completo en la pestaña <strong>Facturación</strong>.
</p>`,
      ctaText: 'Ver Facturas en el Panel',
      footerNote: 'Comprobante digital auxiliar de servicios.',
    },
    TRIAL_WELCOME: {
      subject: '¡Su período de prueba de 30 días en skoolia ha comenzado!',
      preheader: 'Aproveche 30 días de licencias ilimitadas y aprovisionamiento en Google Workspace.',
      badgeText: 'Trial Activado',
      title: 'Prueba con Licencias Ilimitadas Activada',
      bodyHtml: `<p>¡Hola, <strong>{{nome}}</strong>!</p>
<p>Su período de prueba de 30 días en la plataforma <strong>skoolia</strong> para la institución <strong>{{instituicao}}</strong> ya está activo.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Institución:</span>
    <span class="info-value" style="font-family: inherit;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Duración de la Prueba:</span>
    <span class="info-value" style="color: #008a46; font-family: inherit;">30 Días Gratuitos</span>
  </div>
  <div class="info-item">
    <span class="info-label">Licencias Disponibles:</span>
    <span class="info-value" style="color: #008a46; font-family: inherit;">Ilimitadas (Alumnos y Profesores)</span>
  </div>
  <div class="info-item">
    <span class="info-label">Vencimiento del Trial:</span>
    <span class="info-value" style="font-family: inherit;">{{data_expiracao}}</span>
  </div>
</div>

<p>Durante el período de prueba puede registrar y verificar su dominio oficial, importar cuentas y probar todas las funciones de seguridad sin restricciones ni cargos inmediatos.</p>`,
      ctaText: 'Comenzar a Configurar',
      footerNote: 'No se realizará ningún cobro automático antes del vencimiento del período de prueba.',
    },
    TICKET_OPENED: {
      subject: '[Soporte #{{protocolo}}] Ticket Abierto: {{assunto}}',
      preheader: 'Su ticket #{{protocolo}} fue recibido y se encuentra en la cola prioritaria de atención.',
      badgeText: 'Ticket Abierto',
      title: 'Ticket de Soporte Registrado',
      bodyHtml: `<p>¡Hola!</p>
<p>Confirmamos la apertura del ticket de soporte para la institución <strong>{{instituicao}}</strong>. Nuestro equipo técnico ha sido notificado para su revisión.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Protocolo:</span>
    <span class="info-value" style="color: #008a46; font-size: 15px;">#{{protocolo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Asunto:</span>
    <span class="info-value" style="font-family: inherit;">{{assunto}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Categoría:</span>
    <span class="info-value" style="font-family: inherit;">{{categoria}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Prioridad:</span>
    <span class="info-value" style="font-family: inherit;">{{prioridade}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Solicitante:</span>
    <span class="info-value" style="font-family: inherit;">{{solicitante}} ({{email_solicitante}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Fecha de Registro:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="margin-top: 16px; font-weight: 600; color: #0E0F0C;">Descripción del Ticket:</p>
<div style="background-color: #F4F5F0; border-left: 3px solid #00c868; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #373A36; white-space: pre-wrap; margin-bottom: 20px;">{{descricao}}</div>`,
      ctaText: 'Dar Seguimiento al Ticket',
      footerNote: 'Centro de Atención y Soporte.',
    },
    TICKET_REPLIED: {
      subject: '[Soporte #{{protocolo}}] Nueva Respuesta: {{assunto}}',
      preheader: 'El especialista {{autor_resposta}} envió una respuesta en el ticket #{{protocolo}}.',
      badgeText: 'Respuesta de Soporte',
      title: 'Nueva Respuesta en su Ticket',
      bodyHtml: `<p>¡Hola!</p>
<p>Hay una nueva interacción en el ticket <strong>#{{protocolo}}</strong> de la institución <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Protocolo:</span>
    <span class="info-value" style="color: #008a46; font-size: 15px;">#{{protocolo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Asunto:</span>
    <span class="info-value" style="font-family: inherit;">{{assunto}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Respondido por:</span>
    <span class="info-value" style="font-family: inherit;">{{autor_resposta}} ({{cargo_autor}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">Estado Actual:</span>
    <span class="info-value" style="font-family: inherit; color: #163300; font-weight: 800;">{{status}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Fecha del Mensaje:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="margin-top: 16px; font-weight: 600; color: #0E0F0C;">Contenido del Mensaje:</p>
<div style="background-color: #F4F5F0; border-left: 3px solid #3b82f6; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #373A36; white-space: pre-wrap; margin-bottom: 20px;">{{mensagem}}</div>`,
      ctaText: 'Responder en la Consola',
      footerNote: 'Atención Especializada Google Workspace.',
    },
    SUPERADMIN_NEW_TICKET: {
      subject: '[Nuevo Ticket #{{protocolo}}] {{instituicao}}: {{assunto}}',
      preheader: 'Nuevo ticket abierto por la institución {{instituicao}} esperando respuesta del equipo.',
      badgeText: 'Equipo Técnico',
      badgeColor: '#163300',
      title: 'Nuevo Ticket Esperando Respuesta',
      bodyHtml: `<p>¡Hola, <strong>Equipo Técnico</strong>!</p>
<p>Se ha abierto un nuevo ticket de soporte en la plataforma y requiere atención del equipo técnico para responder a la institución <strong>{{instituicao}}</strong>.</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Protocolo:</span>
    <span class="info-value" style="color: #163300; font-size: 15px; font-weight: 800;">#{{protocolo}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Institución:</span>
    <span class="info-value" style="font-family: inherit; font-weight: 700;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Asunto:</span>
    <span class="info-value" style="font-family: inherit;">{{assunto}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Categoría:</span>
    <span class="info-value" style="font-family: inherit;">{{categoria}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Prioridad:</span>
    <span class="info-value" style="font-family: inherit; font-weight: 700;">{{prioridade}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Solicitante:</span>
    <span class="info-value" style="font-family: inherit;">{{solicitante}} ({{email_solicitante}})</span>
  </div>
  <div class="info-item">
    <span class="info-label">SLA Objetivo:</span>
    <span class="info-value" style="font-family: inherit;">{{sla}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Fecha de Apertura:</span>
    <span class="info-value" style="font-family: inherit;">{{data}}</span>
  </div>
</div>

<p style="margin-top: 16px; font-weight: 600; color: #0E0F0C;">Descripción del Cliente:</p>
<div style="background-color: #F4F5F0; border-left: 3px solid #163300; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #373A36; white-space: pre-wrap; margin-bottom: 20px;">{{descricao}}</div>

<p style="font-size: 13px; color: #5E605D;">
  Acceda al ticket en la consola para enviar la respuesta técnica directamente al cliente.
</p>`,
      ctaText: 'Responder al Ticket',
      footerNote: 'Alerta prioritaria automática para Administradores de la Plataforma.',
    },
    SUPERADMIN_NEW_TENANT: {
      subject: '[Nuevo Tenant] {{instituicao}} se acaba de registrar en la plataforma',
      preheader: 'Nueva institución registrada: {{instituicao}} | Admin: {{admin_nome}} ({{admin_email}})',
      badgeText: 'SuperAdmin • Nuevo Tenant',
      badgeColor: '#163300',
      title: 'Nueva Institución Registrada en el Sistema',
      bodyHtml: `<p>¡Hola, <strong>SuperAdmin</strong>!</p>
<p>Una nueva institución acaba de registrarse en la plataforma con éxito. A continuación se presentan los detalles del registro:</p>

<div class="info-box">
  <div class="info-item">
    <span class="info-label">Nombre de la Institución:</span>
    <span class="info-value" style="color: #163300; font-size: 15px; font-weight: 800;">{{instituicao}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Administrador Responsable:</span>
    <span class="info-value" style="font-weight: 700;">{{admin_nome}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Correo de Contacto:</span>
    <span class="info-value">{{admin_email}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Teléfono / WhatsApp:</span>
    <span class="info-value">{{telefone}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">País / Región:</span>
    <span class="info-value">{{pais}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Modalidad / Plan:</span>
    <span class="info-value" style="color: #008a46; font-weight: 700;">{{plano}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">ID del Tenant:</span>
    <span class="info-value" style="font-family: monospace;">{{tenant_id}}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Fecha y Hora de Registro:</span>
    <span class="info-value">{{data_registro}}</span>
  </div>
</div>

<p style="font-size: 13px; color: #5E605D; margin-top: 16px;">
  Puede gestionar este nuevo tenant, configurar dominios y asignar licencias directamente desde la consola del SuperAdmin.
</p>`,
      ctaText: 'Gestionar en Consola SuperAdmin',
      footerNote: 'Notificación automática enviada vía Resend para el SuperAdmin del sistema.',
    },
  },
};

export function normalizeEmailLanguage(lang?: string): EmailLocale {
  if (!lang) return 'pt';
  const l = lang.toLowerCase().trim();
  if (l.startsWith('en')) return 'en';
  if (l.startsWith('es')) return 'es';
  return 'pt';
}

export function getLocalizedEmailContent(
  type: EmailTemplateType,
  lang: string = 'pt'
): LocalizedEmailContent {
  const norm = normalizeEmailLanguage(lang);
  return (
    LOCALIZED_EMAIL_TEMPLATES[norm]?.[type] ||
    LOCALIZED_EMAIL_TEMPLATES.pt[type]
  );
}
