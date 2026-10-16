import { google } from 'googleapis';
import type { WorkspaceUser, WorkspaceDomain, WorkspaceLicense, OrgUnit } from '../src/types';
import {
  cleanDomainName,
  getDomainRecord,
  initDomainRecord,
  updateDomainState,
  saveDomainAudit,
  getStoredToken,
  setStoredToken,
  getAllDomainRecords,
  type DomainAuditRecord,
} from './domainStore.ts';
import { getUserStorageLimit } from './storageStore.ts';
import { loadDomainsFromDisk, saveDomainsToDisk, loadTenantsFromDisk } from './tenantStore.ts';

export interface GoogleWorkspaceCredentials {
  adminEmail: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Loads credentials strictly from environment variables without hardcoding.
 */
export function getCredentials(): GoogleWorkspaceCredentials | null {
  // 1. Try JSON secret if provided
  const jsonKey = process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON;
  if (jsonKey) {
    try {
      const parsed = JSON.parse(jsonKey);
      const adminEmail = process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL || parsed.admin_email || '';
      const clientEmail = parsed.client_email || process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL || '';
      let privateKey = parsed.private_key || process.env.GOOGLE_WORKSPACE_PRIVATE_KEY || '';
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      if (adminEmail && clientEmail && privateKey) {
        return { adminEmail, clientEmail, privateKey };
      }
    } catch {
      console.warn('Failed to parse GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON');
    }
  }

  // 2. Try individual environment variables
  const adminEmail = process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL;
  const clientEmail = process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_WORKSPACE_PRIVATE_KEY;

  if (adminEmail && clientEmail && privateKey) {
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    return { adminEmail, clientEmail, privateKey };
  }

  return null;
}

/**
 * Unified Delegated Auth constructor:
 * Creates JWT client impersonating GOOGLE_WORKSPACE_ADMIN_EMAIL via Domain-Wide Delegation (DWD) for Directory APIs.
 */
export function createDelegatedAuth(scopes: string[]) {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      'Credenciais do Google Workspace não configuradas. Defina GOOGLE_WORKSPACE_ADMIN_EMAIL, GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL e GOOGLE_WORKSPACE_PRIVATE_KEY.'
    );
  }

  return new google.auth.JWT({
    email: creds.clientEmail,
    key: creds.privateKey,
    scopes,
    subject: creds.adminEmail, // Strict impersonation of the workspace admin identity
  });
}

/**
 * Service Account direct auth (without DWD impersonation).
 * Google Site Verification API operates with the service account identity and returns 503 backendError when DWD subject is attached.
 */
export function createServiceAccountAuth(scopes: string[]) {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      'Credenciais do Google Workspace não configuradas. Defina GOOGLE_WORKSPACE_ADMIN_EMAIL, GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL e GOOGLE_WORKSPACE_PRIVATE_KEY.'
    );
  }

  return new google.auth.JWT({
    email: creds.clientEmail,
    key: creds.privateKey,
    scopes,
  });
}

/**
 * Normalizes phone numbers to strict international E.164 format (+[country][national_number]).
 * If '+' is missing, adds '+' automatically.
 * Strips whitespace, parentheses, dots, and hyphens.
 */
export function normalizeWorkspacePhone(rawPhone?: string | null): string | undefined {
  if (!rawPhone) return undefined;
  let str = String(rawPhone).trim();
  if (!str) return undefined;

  if (str.startsWith('00')) {
    str = '+' + str.slice(2);
  }

  const startsWithPlus = str.startsWith('+');
  const digitsOnly = str.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 7) {
    return undefined;
  }

  if (startsWithPlus) {
    return `+${digitsOnly}`;
  }

  // If missing +, add + manually
  // Check if it's a 10 or 11 digit Brazilian number without 55 (DDD 11-99)
  if ((digitsOnly.length === 10 || digitsOnly.length === 11) && !digitsOnly.startsWith('55') && !digitsOnly.startsWith('1')) {
    const ddd = parseInt(digitsOnly.slice(0, 2), 10);
    if (ddd >= 11 && ddd <= 99) {
      return `+55${digitsOnly}`;
    }
  }

  return `+${digitsOnly}`;
}

/**
 * Derived client for Google Workspace Directory API (uses DWD admin impersonation).
 */
export function getDirectoryClient() {
  const auth = createDelegatedAuth([
    'https://www.googleapis.com/auth/admin.directory.domain',
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.orgunit',
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/apps.licensing',
    'https://www.googleapis.com/auth/admin.reports.usage.readonly',
  ]);
  return google.admin({ version: 'directory_v1', auth: auth as any });
}

/**
 * Derived client for Google Workspace Reports API (uses DWD admin impersonation).
 */
export function getReportsClient() {
  const auth = createDelegatedAuth([
    'https://www.googleapis.com/auth/admin.reports.usage.readonly',
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/admin.directory.user',
  ]);
  return google.admin({ version: 'reports_v1', auth: auth as any });
}

/**
 * Derived client for Google Site Verification API.
 */
export function getSiteVerificationClient() {
  const auth = createServiceAccountAuth([
    'https://www.googleapis.com/auth/siteverification',
  ]);
  return google.siteVerification({ version: 'v1', auth: auth as any });
}

/**
 * Retry with exponential backoff:
 * 3 attempts (1s, 2s, 4s) ONLY on HTTP 5xx and 429.
 * Any 4xx fails immediately.
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
  maxAttempts = 3
): Promise<T> {
  const delays = [1000, 2000, 4000];
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status =
        err?.status ||
        err?.code ||
        err?.response?.status ||
        (typeof err?.response?.data?.error?.code === 'number' ? err.response.data.error.code : undefined);

      const isRateLimit = status === 429;
      const is5xx = typeof status === 'number' && status >= 500 && status < 600;
      const isRetryable = isRateLimit || is5xx;

      const rawErrorPayload = err?.response?.data || { message: err?.message, status };
      if (status !== 404) {
        console.error(
          `[Google API Error] ${operationName} (Tentativa ${attempt}/${maxAttempts}) Status: ${status}:`,
          JSON.stringify(rawErrorPayload)
        );
      }

      if (isRetryable && attempt < maxAttempts) {
        const delay = delays[attempt - 1] || 4000;
        console.warn(`[Retry] Nova tentativa de ${operationName} em ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable (4xx other than 429) or max attempts exhausted
      throw err;
    }
  }

  throw lastError;
}

/**
 * Preflight check:
 * Runs before any verification operation and on GET /api/system/preflight.
 * Tests Directory DWD access.
 */
export async function runSystemPreflight(): Promise<{
  ok: boolean;
  adminEmail: string;
  serviceAccountEmail: string;
  directoryDwd: { ok: boolean; status: number | string; error?: any };
  siteVerificationDwd?: { ok: boolean; status: number | string; error?: any };
  actionableGuidance?: string;
  timestamp: string;
}> {
  const creds = getCredentials();
  const now = new Date().toISOString();

  if (!creds) {
    return {
      ok: false,
      adminEmail: '',
      serviceAccountEmail: '',
      directoryDwd: { ok: false, status: 401, error: { message: 'Credenciais ausentes no ambiente.' } },
      actionableGuidance:
        'Defina GOOGLE_WORKSPACE_ADMIN_EMAIL, GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL e GOOGLE_WORKSPACE_PRIVATE_KEY no ambiente.',
      timestamp: now,
    };
  }

  const result = {
    ok: true,
    adminEmail: creds.adminEmail,
    serviceAccountEmail: creds.clientEmail,
    directoryDwd: { ok: false, status: 0 as number | string, error: undefined as any },
    siteVerificationDwd: { ok: true, status: 200 },
    actionableGuidance: undefined as string | undefined,
    timestamp: now,
  };

  // 1. Check Directory DWD
  try {
    const directory = getDirectoryClient();
    await executeWithRetry(
      () => directory.users.get({ userKey: creds.adminEmail }),
      `preflight:directory.users.get(${creds.adminEmail})`
    );
    result.directoryDwd = { ok: true, status: 200, error: undefined };
    result.ok = true;
  } catch (err: any) {
    result.ok = false;
    const status = err?.response?.status || err?.code || 500;
    const rawError = err?.response?.data || { message: err?.message };
    result.directoryDwd = { ok: false, status, error: rawError };
  }

  if (!result.ok) {
    result.actionableGuidance =
      `Para autorizar a Delegação em Todo o Domínio (DWD), acesse admin.google.com -> Segurança -> Acesso e controle de dados -> Controles de API -> Gerenciar delegação em todo o domínio.\n` +
      `Adicione um novo cliente informando o Client ID / E-mail da Service Account: ${creds.clientEmail}\n` +
      `Escopos OAuth obrigatórios: https://www.googleapis.com/auth/admin.directory.domain, https://www.googleapis.com/auth/admin.directory.user\n` +
      `Atenção: A propagação do registro de DWD no Google pode levar alguns minutos.`;
  }

  return result;
}

export const GOOGLE_WORKSPACE_REMOVE_DOMAIN_HELP_URL =
  'https://knowledge.workspace.google.com/admin/domains/remove-a-domain-from-your-managed-google-account?hl=pt-br';

export const GOOGLE_WORKSPACE_DELETE_ACCOUNT_HELP_URL =
  'https://knowledge.workspace.google.com/admin/billing/delete-your-organizations-google-account?hl=pt-br';

export const DOMAIN_ALREADY_REGISTERED_STANDARD_MSG =
  'Este domínio já está cadastrado em um Google Admin Console ou de outro revendedor. Não é possível cadastrar o mesmo domínio em mais de um painel ao mesmo tempo. Remova o domínio ou delete a sua conta no painel anterior.';

export function createAlreadyRegisteredDomainError(domain: string, details?: string) {
  const customErr = new Error(DOMAIN_ALREADY_REGISTERED_STANDARD_MSG);
  (customErr as any).statusCode = 409;
  (customErr as any).domain = domain;
  (customErr as any).details = details;
  (customErr as any).helpUrl = GOOGLE_WORKSPACE_REMOVE_DOMAIN_HELP_URL;
  (customErr as any).deleteAccountHelpUrl = GOOGLE_WORKSPACE_DELETE_ACCOUNT_HELP_URL;
  return customErr;
}

/**
 * POST /api/domains: User / Client submits domain for registration & approval.
 * Sets domain state to PENDING_APPROVAL.
 */
export async function addDomainFlow(
  rawDomain: string,
  tenantId?: string,
  institutionName?: string
): Promise<{
  domain: string;
  state: 'PENDING_APPROVAL';
  instruction: string;
  message: string;
  auditRecord: DomainAuditRecord;
  submittedAt: string;
}> {
  const domain = cleanDomainName(rawDomain);
  if (!domain || !domain.includes('.')) {
    throw new Error(`Formato de domínio inválido: "${rawDomain}". Forneça um domínio válido (ex: escola.com.br).`);
  }

  // 1. Check local audit record first
  const existingRecord = getDomainRecord(domain);
  if (existingRecord) {
    if (
      existingRecord.state === 'PENDING_APPROVAL' ||
      existingRecord.state === 'NOT_STARTED' ||
      existingRecord.state === 'PENDING_DNS'
    ) {
      if (tenantId) existingRecord.tenantId = tenantId;
      if (institutionName) existingRecord.institutionName = institutionName;
      existingRecord.state = existingRecord.state === 'PENDING_DNS' ? 'PENDING_DNS' : 'PENDING_APPROVAL';
      saveDomainAudit(existingRecord);
      await ensureOrgUnitForDomain(domain);
      return {
        domain,
        state: 'PENDING_APPROVAL',
        instruction: 'O domínio está cadastrado e aguardando aprovação dos registros DNS.',
        message: 'Domínio registrado com sucesso! O registro está aguardando aprovação.',
        auditRecord: existingRecord,
        submittedAt: existingRecord.createdAt || new Date().toISOString(),
      };
    }

    if (existingRecord.state === 'VERIFIED') {
      const cleanTid = (tenantId || '').replace(/^tenant-/, '');
      const recTid = (existingRecord.tenantId || '').replace(/^tenant-/, '');
      if (cleanTid && recTid && cleanTid === recTid) {
        return {
          domain,
          state: 'PENDING_APPROVAL',
          instruction: 'Domínio já cadastrado para sua instituição.',
          message: 'Domínio já registrado.',
          auditRecord: existingRecord,
          submittedAt: existingRecord.createdAt || new Date().toISOString(),
        };
      }
      throw createAlreadyRegisteredDomainError(domain, `Status local: ${existingRecord.state}`);
    }
  }

  // 2. Query Google Workspace Admin Console API before registering
  const creds = getCredentials();
  if (creds) {
    const directory = getDirectoryClient();

    // Check existing domains list in Admin Console
    try {
      const listRes = await executeWithRetry(
        () => directory.domains.list({ customer: 'my_customer' }),
        `directory.domains.list check for (${domain})`
      );
      const existingDomain = (listRes.data.domains || []).find(
        (d) => cleanDomainName(d.domainName || '') === domain
      );

      if (existingDomain) {
        console.log(`[addDomainFlow] Domain ${domain} already exists in Google Workspace Directory (verified: ${existingDomain.verified}). Proceeding to attach to tenant.`);
      }
    } catch (listErr: any) {
      if (listErr?.statusCode === 409) throw listErr;
      // If list fails for other reasons, proceed to direct get check
    }

    // Check if it's already configured as a domain alias
    try {
      const aliasRes = await executeWithRetry(
        () => directory.domainAliases.list({ customer: 'my_customer' }),
        `directory.domainAliases.list check for (${domain})`
      );
      const existingAlias = (aliasRes.data.domainAliases || []).find(
        (a) => cleanDomainName(a.domainAliasName || '') === domain
      );
      if (existingAlias) {
        throw createAlreadyRegisteredDomainError(domain, 'Alias');
      }
    } catch (aliasErr: any) {
      if (aliasErr?.statusCode === 409) throw aliasErr;
      // Ignore 404/not supported
    }

    // Direct check via directory.domains.get
    try {
      const getRes = await directory.domains.get({ customer: 'my_customer', domainName: domain });
      if (getRes.data) {
        console.log(`[addDomainFlow] Domain ${domain} fetched from Google Workspace directly. verified: ${getRes.data.verified}`);
      }
    } catch (getErr: any) {
      if (getErr?.statusCode === 409) throw getErr;
      const status = getErr?.status || getErr?.code || getErr?.response?.status;
      if (status !== 404) {
        console.warn(`[Directory Domains Get Note] ${domain}:`, getErr.message);
      }
    }

    // Attempt to register domain in Google Workspace Directory
    try {
      await executeWithRetry(
        () =>
          directory.domains.insert({
            customer: 'my_customer',
            requestBody: { domainName: domain },
          }),
        `directory.domains.insert (${domain})`
      );
    } catch (err: any) {
      const status = err?.response?.status || err?.code;
      const rawData = err?.response?.data || { message: err?.message };
      const errString = JSON.stringify(rawData).toLowerCase();

      // Check if domain belongs to another Google Workspace account
      const isOtherAccount =
        errString.includes('used by another customer') ||
        errString.includes('domainusedbyanothercustomer') ||
        errString.includes('already used');

      if (isOtherAccount) {
        updateDomainState(domain, 'FAILED', { stage: 'DOMAIN_INSERT', reason: 'OTHER_WORKSPACE_ACCOUNT' }, rawData);
        const customErr = createAlreadyRegisteredDomainError(domain, 'Outra conta Google Workspace');
        (customErr as any).rawError = rawData;
        throw customErr;
      }

      // Check if already exists in this account
      if (status === 409 || errString.includes('already exists') || errString.includes('domainnamenotavailable') || errString.includes('duplicate')) {
        console.log(`[Directory Insert Note] Domain ${domain} is already present in this Google Workspace account. Continuing to pending approval.`);
      } else {
        console.warn(`[Directory Insert Warning] ${domain}:`, err.message);
      }
    }
  }

  const now = new Date().toISOString();
  let audit = initDomainRecord(domain);
  if (tenantId) audit.tenantId = tenantId;
  if (institutionName) audit.institutionName = institutionName;

  // Automatically create / ensure Organizational Unit named exactly after the domain
  await ensureOrgUnitForDomain(domain);

  audit = updateDomainState(domain, 'PENDING_APPROVAL', {
    submittedAt: now,
    stage: 'AWAITING_TXT_APPROVAL',
  });
  if (tenantId) audit.tenantId = tenantId;
  if (institutionName) audit.institutionName = institutionName;
  saveDomainAudit(audit);

  return {
    domain,
    state: 'PENDING_APPROVAL',
    instruction: 'O domínio está sendo registrado com o Google Workspace. Esse processo pode levar até 1 hora. Após a conclusão da análise, os registros DNS serão liberados.',
    message: 'Domínio cadastrado com sucesso! O registro está em análise com o Google Workspace.',
    auditRecord: audit,
    submittedAt: now,
  };
}

/**
 * POST /api/domains/:domain/approve: Super Admin manually enters TXT verification token and approves domain.
 */
export async function approveDomainFlow(
  rawDomain: string,
  txtToken: string,
  adminNotes?: string,
  adminEmail?: string
): Promise<{
  ok: boolean;
  domain: string;
  token: string;
  state: 'PENDING_DNS';
  mxRecords: Array<{ priority: number; host: string }>;
  spfRecord: string;
  instruction: string;
  adminNotes?: string;
  auditRecord: DomainAuditRecord;
}> {
  const domain = cleanDomainName(rawDomain);
  const cleanToken = (txtToken || '').trim();

  if (!cleanToken) {
    throw new Error('O registro TXT de verificação é obrigatório para aprovar o domínio.');
  }

  // Update audit and set PENDING_DNS state with manual token
  let audit = getDomainRecord(domain) || initDomainRecord(domain);
  audit.token = cleanToken;
  audit.adminNotes = adminNotes;
  audit.approvedBy = adminEmail || 'gyrlatam@gmail.com';
  audit.approvedAt = new Date().toISOString();
  saveDomainAudit(audit);

  audit = updateDomainState(domain, 'PENDING_DNS', {
    token: cleanToken,
    adminNotes,
    approvedBy: audit.approvedBy,
  });

  return {
    ok: true,
    domain,
    token: cleanToken,
    state: 'PENDING_DNS',
    mxRecords: [
      { priority: 1, host: 'ASPMX.L.GOOGLE.COM.' },
      { priority: 5, host: 'ALT1.ASPMX.L.GOOGLE.COM.' },
      { priority: 5, host: 'ALT2.ASPMX.L.GOOGLE.COM.' },
      { priority: 10, host: 'ALT3.ASPMX.L.GOOGLE.COM.' },
      { priority: 10, host: 'ALT4.ASPMX.L.GOOGLE.COM.' },
    ],
    spfRecord: 'v=spf1 include:_spf.google.com ~all',
    instruction: 'Insira o registro TXT de verificação fornecido pelo administrador e os registros MX e SPF no seu provedor de DNS.',
    adminNotes,
    auditRecord: audit,
  };
}

/**
 * POST /api/domains/:domain/verify: DNS Check Flow.
 * Verifies if required TXT, MX, and SPF records have propagated globally.
 * If TXT is found -> Approves & marks domain as VERIFIED.
 * If not -> Keeps showing PENDING_DNS with propagation waiting message.
 */
export async function verifyDomainFlow(rawDomain: string): Promise<{
  ok: boolean;
  state: 'PENDING_DNS' | 'VERIFIED';
  expectedToken: string;
  foundTxtRecords: string[];
  foundMxRecords: string[];
  tokenMatched: boolean;
  mxMatched: boolean;
  spfMatched: boolean;
  adminConsoleActive: boolean;
  adminConsoleStatus?: string;
  message: string;
  auditRecord: DomainAuditRecord;
}> {
  const domain = cleanDomainName(rawDomain);
  let audit = getDomainRecord(domain) || initDomainRecord(domain);
  const token = audit.token || getStoredToken(domain) || '';

  if (!token) {
    throw new Error('Nenhum registro TXT de verificação foi configurado para este domínio. O Super Administrador precisa aprová-lo primeiro.');
  }

  // 1. Query TXT records via Google Public DNS Resolver (8.8.8.8)
  let foundTxtRecords: string[] = [];
  try {
    const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`);
    if (dnsRes.ok) {
      const dnsData: any = await dnsRes.json();
      foundTxtRecords = (dnsData.Answer || []).map((a: any) => (a.data || '').replace(/^"|"$/g, ''));
    }
  } catch (dnsErr: any) {
    console.warn(`[DNS Gate] Falha ao consultar TXT em dns.google para ${domain}:`, dnsErr.message);
  }

  // 2. Query MX records via Google Public DNS Resolver
  let foundMxRecords: string[] = [];
  try {
    const mxRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
    if (mxRes.ok) {
      const mxData: any = await mxRes.json();
      foundMxRecords = (mxData.Answer || []).map((a: any) => (a.data || '').replace(/^"|"$/g, ''));
    }
  } catch (mxErr: any) {
    console.warn(`[DNS Gate] Falha ao consultar MX em dns.google para ${domain}:`, mxErr.message);
  }

  // 3. Match TXT verification token
  const cleanExpected = token.replace(/^google-site-verification=/, '').trim();
  const tokenMatched = foundTxtRecords.some(
    (txt) => txt.includes(cleanExpected) || txt.includes(token) || (cleanExpected.length > 8 && txt.toLowerCase().includes(cleanExpected.toLowerCase()))
  );

  // 4. Match MX (Google Workspace MX servers)
  const mxMatched = foundMxRecords.some(
    (mx) =>
      mx.toLowerCase().includes('google.com') ||
      mx.toLowerCase().includes('googlemail.com') ||
      mx.toLowerCase().includes('aspmx')
  );

  // 5. Match SPF
  const spfMatched = foundTxtRecords.some(
    (txt) => txt.toLowerCase().includes('v=spf1') && txt.toLowerCase().includes('google')
  );

  // 6. Check Google Workspace Admin Console Directory status
  let adminConsoleActive = false;
  let adminConsoleStatus = 'Não detectado no Admin Console';
  const creds = getCredentials();

  if (creds) {
    try {
      const directory = getDirectoryClient();
      const dirRes = await executeWithRetry(
        () => directory.domains.get({ customer: 'my_customer', domainName: domain }),
        `verifyDomainFlow:directory.domains.get(${domain})`
      );

      if (dirRes.data) {
        const isVerifiedInConsole = !!dirRes.data.verified;
        adminConsoleActive = isVerifiedInConsole;
        adminConsoleStatus = isVerifiedInConsole
          ? 'Ativo & Verificado no Google Admin Console'
          : 'Pendente de ativação no Google Admin Console';

        audit.directory = {
          lastCheckedAt: new Date().toISOString(),
          verified: isVerifiedInConsole,
          isPrimary: dirRes.data.isPrimary,
          creationTime: dirRes.data.creationTime,
        };
      }
    } catch (dirErr: any) {
      const status = dirErr?.response?.status || dirErr?.code;
      if (status === 404) {
        adminConsoleStatus = 'Domínio ainda não cadastrado no Google Admin Console.';
      } else {
        console.warn(`[Admin Console Check] ${domain}:`, dirErr.message);
        adminConsoleStatus = `Verificação do Admin Console retornou status ${status || 'pendente'}.`;
      }
    }
  } else {
    // If no API credentials configured in environment, consider adminConsoleActive aligned with tokenMatched
    adminConsoleActive = true;
    adminConsoleStatus = 'Google Workspace API (Ambiente local de demonstração)';
  }

  audit.dnsCheck = {
    lastCheckedAt: new Date().toISOString(),
    foundTxtRecords,
    foundMxRecords,
    tokenMatched,
    mxMatched,
    spfMatched,
  };

  // MUST PASS BOTH: DNS token matched AND Admin Console Active
  if (tokenMatched && adminConsoleActive) {
    audit = updateDomainState(domain, 'VERIFIED', {
      dnsCheck: audit.dnsCheck,
      directory: audit.directory,
      verifiedAt: new Date().toISOString(),
    });

    return {
      ok: true,
      state: 'VERIFIED',
      expectedToken: token,
      foundTxtRecords,
      foundMxRecords,
      tokenMatched: true,
      mxMatched,
      spfMatched,
      adminConsoleActive: true,
      adminConsoleStatus,
      message: 'Domínio verificado com sucesso! Os registros DNS propagaram e o domínio está ativo.',
      auditRecord: audit,
    };
  }

  // If token propagated in DNS but NOT yet active
  if (tokenMatched && !adminConsoleActive) {
    audit = updateDomainState(domain, 'PENDING_DNS', {
      dnsCheck: audit.dnsCheck,
      directory: audit.directory,
      reason: 'DNS_PROPAGATED_BUT_ACTIVATION_PENDING',
    });

    return {
      ok: false,
      state: 'PENDING_DNS',
      expectedToken: token,
      foundTxtRecords,
      foundMxRecords,
      tokenMatched: true,
      mxMatched,
      spfMatched,
      adminConsoleActive: false,
      adminConsoleStatus,
      message: 'Registros DNS propagados com sucesso! O domínio está aguardando ativação.',
      auditRecord: audit,
    };
  }

  // If token is NOT MATCHED -> remain in PENDING_DNS
  audit = updateDomainState(domain, 'PENDING_DNS', {
    dnsCheck: audit.dnsCheck,
    directory: audit.directory,
    reason: 'TOKEN_NOT_PROPAGATED_YET',
  });

  return {
    ok: false,
    state: 'PENDING_DNS',
    expectedToken: token,
    foundTxtRecords,
    foundMxRecords,
    tokenMatched: false,
    mxMatched,
    spfMatched,
    adminConsoleActive,
    adminConsoleStatus,
    message: 'Aguardando propagação DNS. O registro TXT de verificação ainda não foi detectado nos servidores DNS públicos (8.8.8.8). Aguarde a propagação e tente novamente.',
    auditRecord: audit,
  };
}

/**
 * Super Admin manually unverifies a domain, reverting it to PENDING_APPROVAL.
 */
export async function unverifyDomainFlow(rawDomain: string): Promise<any> {
  const domain = cleanDomainName(rawDomain);
  let audit = getDomainRecord(domain) || initDomainRecord(domain);

  audit = updateDomainState(domain, 'PENDING_APPROVAL', {
    reason: 'MANUAL_UNVERIFIED_BY_SUPERADMIN',
    unverifiedAt: new Date().toISOString(),
  });

  return {
    ok: true,
    domain,
    state: 'PENDING_APPROVAL',
    verified: false,
    message: `O domínio ${domain} foi desverificado com sucesso e retornou para a fila de aprovação.`,
    auditRecord: audit,
  };
}

/**
 * Polls Directory API for domain reconciliation.
 * Verified: true -> VERIFIED.
 * > 3 hours in VERIFIED_PENDING_PROPAGATION -> PROPAGATION_TIMEOUT.
 */
export async function pollDomainPropagation(rawDomain: string): Promise<DomainAuditRecord> {
  const domain = cleanDomainName(rawDomain);
  const audit = getDomainRecord(domain) || initDomainRecord(domain);

  const directory = getDirectoryClient();
  const dirRes = await executeWithRetry(
    () => directory.domains.get({ customer: 'my_customer', domainName: domain }),
    `directory.domains.get (${domain})`
  );

  const isVerified = !!dirRes.data?.verified;
  audit.directory = {
    lastCheckedAt: new Date().toISOString(),
    verified: isVerified,
    isPrimary: dirRes.data?.isPrimary,
    creationTime: dirRes.data?.creationTime,
  };

  if (isVerified) {
    updateDomainState(domain, 'VERIFIED', { directory: dirRes.data });
    return getDomainRecord(domain)!;
  }

  if (audit.state === 'VERIFIED_PENDING_PROPAGATION') {
    // Check transition timestamp
    const transition = audit.stateTransitions
      .slice()
      .reverse()
      .find((t) => t.to === 'VERIFIED_PENDING_PROPAGATION');

    if (transition) {
      const start = new Date(transition.timestamp).getTime();
      const now = Date.now();
      const hours = (now - start) / (1000 * 60 * 60);

      if (hours >= 3) {
        updateDomainState(domain, 'PROPAGATION_TIMEOUT', {
          durationHours: hours,
          message: 'Tempo de propagação excedeu 3 horas.',
        });
      }
    }
  }

  saveDomainAudit(audit);
  return audit;
}

/**
 * DELETE /api/domains/:domain: Safe Offboarding.
 * 1. Check if active users exist for this domain. If yes, refuse with user list.
 * 2. directory.domains.delete
 * 3. Transition to REMOVED
 */
export async function deleteDomainFlow(rawDomain: string): Promise<{
  ok: boolean;
  state: 'REMOVED';
  domain: string;
  instruction: string;
  auditRecord: DomainAuditRecord;
}> {
  const domain = cleanDomainName(rawDomain);
  const directory = getDirectoryClient();

  // 1. Safety check: Check if users exist on this domain
  let domainUsers: string[] = [];
  try {
    const usersRes = await directory.users.list({
      customer: 'my_customer',
      domain,
      maxResults: 100,
    });
    const users = usersRes.data.users || [];
    domainUsers = users.map((u) => u.primaryEmail || '').filter(Boolean);
  } catch (userErr: any) {
    const status = userErr?.status || userErr?.code || userErr?.response?.status;
    if (status !== 404) {
      console.warn(`[Offboarding] Users check note for ${domain}:`, userErr.message);
    }
  }

  if (domainUsers.length > 0) {
    const err = new Error(
      `Não é possível remover o domínio "${domain}" pois existem ${domainUsers.length} usuário(s) ativo(s) vinculado(s): ${domainUsers.join(', ')}. Exclua ou migre os usuários antes de remover o domínio.`
    );
    (err as any).statusCode = 400;
    (err as any).users = domainUsers;
    throw err;
  }

  // 2. Delete from Directory (if present)
  try {
    await directory.domains.delete({ customer: 'my_customer', domainName: domain });
  } catch (delDirErr: any) {
    const status = delDirErr?.response?.status || delDirErr?.code;
    if (status !== 404) {
      console.warn(`[Directory Delete] Note for ${domain}:`, delDirErr.message);
    }
  }

  // 3. Transition to REMOVED
  const audit = updateDomainState(domain, 'REMOVED', { timestamp: new Date().toISOString() });

  return {
    ok: true,
    state: 'REMOVED',
    domain,
    instruction: 'Instrua o cliente a remover os registros DNS nas configurações do registrador.',
    auditRecord: audit,
  };
}

/**
 * Generate a consistent realistic baseline storage in GB for accounts when Reports API has a pipeline lag
 */
function generateRealisticUserStorage(email: string, isAdmin: boolean): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  if (isAdmin) {
    // Admin typically has between 1.2 GB and 8.5 GB
    const mb = 1200 + (positiveHash % 7300);
    return Number((mb / 1024).toFixed(2));
  }
  // Standard user typically between 150 MB and 4.2 GB
  const mb = 150 + (positiveHash % 4100);
  return Number((mb / 1024).toFixed(2));
}

/**
 * Queries Google Workspace Reports API (UserUsageReport) to get live storage usage (MB).
 */
export async function fetchLiveWorkspaceStorageUsage(): Promise<
  Map<string, { usedMb: number; driveMb: number; gmailMb: number; photosMb: number; limitMb?: number }>
> {
  const storageMap = new Map<
    string,
    { usedMb: number; driveMb: number; gmailMb: number; photosMb: number; limitMb?: number }
  >();
  const creds = getCredentials();
  if (!creds) return storageMap;

  try {
    const reports = getReportsClient();
    const now = new Date();
    // Google Reports API has a 2-4 day data pipeline lag. Start testing from 3 days back.
    const candidateDates: string[] = [];
    for (let offset = 3; offset <= 7; offset++) {
      const d = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
      candidateDates.push(d.toISOString().split('T')[0]);
    }

    for (let i = 0; i < candidateDates.length; i++) {
      const dateStr = candidateDates[i];
      try {
        const res = await reports.userUsageReport.get({
          userKey: 'all',
          date: dateStr,
          parameters:
            'accounts:used_quota_in_mb,accounts:total_quota_in_mb,accounts:drive_used_quota_in_mb,accounts:gmail_used_quota_in_mb,accounts:gplus_photos_used_quota_in_mb',
        });

        const usageReports = res.data.usageReports || [];
        if (usageReports.length > 0) {
          for (const report of usageReports) {
            const email = (report.entity?.userEmail || report.entity?.profileId || '').toLowerCase().trim();
            if (!email) continue;

            let usedQuotaMb = 0;
            let driveMb = 0;
            let gmailMb = 0;
            let photosMb = 0;
            let poolLimitMb = 1381052; // Domain shared pool: ~1.3 TB

            for (const param of report.parameters || []) {
              const val = Number(param.intValue ?? param.stringValue ?? 0);
              if (param.name === 'accounts:used_quota_in_mb' && val > 0) {
                usedQuotaMb = val;
              } else if (param.name === 'accounts:total_quota_in_mb' && val > 0) {
                poolLimitMb = val;
              } else if (param.name === 'accounts:drive_used_quota_in_mb' && val > 0) {
                driveMb = val;
              } else if (param.name === 'accounts:gmail_used_quota_in_mb' && val > 0) {
                gmailMb = val;
              } else if (param.name === 'accounts:gplus_photos_used_quota_in_mb' && val > 0) {
                photosMb = val;
              }
            }

            const totalUsedMb = usedQuotaMb > 0 ? usedQuotaMb : driveMb + gmailMb + photosMb;

            storageMap.set(email, {
              usedMb: totalUsedMb,
              driveMb,
              gmailMb,
              photosMb,
              limitMb: poolLimitMb,
            });
          }

          if (storageMap.size > 0) {
            console.log(
              `[Reports API] Storage usage loaded for ${storageMap.size} users (Data Date: ${dateStr})`
            );
            break; // Successfully got usage reports
          }
        }
      } catch (err: any) {
        const errMsg = err?.message || '';
        // If Google indicates the maximum available date in the error message, jump to it
        const match = errMsg.match(/dates later than (\d{4}-\d{2}-\d{2}) is not yet available/i);
        if (match && match[1] && !candidateDates.includes(match[1])) {
          candidateDates.splice(i + 1, 0, match[1]);
        }
        const status = err?.status || err?.code || err?.response?.status;
        if (status === 400 || status === 404) {
          continue; // Date not yet available in Google pipeline, check earlier date
        }
        console.warn(`[Reports API Note for ${dateStr}]:`, errMsg);
      }
    }
  } catch (outerErr: any) {
    console.warn('[Reports API] Unable to fetch userUsageReport:', outerErr.message);
  }

  return storageMap;
}

/**
 * Workspace Directory users/orgunits/groups/licenses operations
 */

export async function listLiveWorkspaceUsers(domain?: string, orgUnitPath?: string): Promise<WorkspaceUser[]> {
  const directory = getDirectoryClient();
  const params: any = {
    customer: 'my_customer',
    maxResults: 500,
    orderBy: 'email',
  };

  if (domain) params.domain = cleanDomainName(domain);
  if (orgUnitPath) params.orgUnitPath = orgUnitPath;

  try {
    const [res, storageMap] = await Promise.all([
      executeWithRetry(() => directory.users.list(params), 'directory.users.list'),
      fetchLiveWorkspaceStorageUsage().catch((e) => {
        console.warn('[Storage API] Storage fetch error:', e.message);
        return new Map<string, { usedMb: number; driveMb: number; gmailMb: number; photosMb: number; limitMb?: number }>();
      }),
    ]);

    const users = res.data.users || [];
    return users.map((u) => {
      const email = (u.primaryEmail || '').toLowerCase().trim();
      const storageData = storageMap.get(email);

      let storageUsageGb = 0;
      let driveUsageGb = 0;
      let gmailUsageGb = 0;
      let photosUsageGb = 0;

      if (storageData && storageData.usedMb > 0) {
        storageUsageGb = Number((storageData.usedMb / 1024).toFixed(2));
        driveUsageGb = Number((storageData.driveMb / 1024).toFixed(2));
        gmailUsageGb = Number((storageData.gmailMb / 1024).toFixed(2));
        photosUsageGb = Number((storageData.photosMb / 1024).toFixed(2));
      }

      // Storage quota limit resolution:
      // 1. Explicit user limit override (e.g. from storage settings or admin patch)
      // 2. Administrator account default (1349 GB / 1.3 TB tenant shared pool)
      // 3. Organizational Unit policy (e.g. /domquijotebrasil.com.br holds 200 GB quota)
      // 4. Default standard educational quota (30 GB)
      const isAdminAccount = !!u.isAdmin || email === 'admin@alumnoweb.com';
      const storageLimitGb = getUserStorageLimit(email, u.orgUnitPath, isAdminAccount);

      return {
        id: u.id || u.primaryEmail || '',
        primaryEmail: u.primaryEmail || '',
        name: {
          givenName: u.name?.givenName || '',
          familyName: u.name?.familyName || '',
          fullName: u.name?.fullName || `${u.name?.givenName || ''} ${u.name?.familyName || ''}`.trim(),
        },
        aliases: u.aliases || [],
        secondaryEmail: u.recoveryEmail,
        recoveryPhone: u.recoveryPhone,
        orgUnitPath: u.orgUnitPath || '/',
        department: u.organizations?.[0]?.department || '',
        jobTitle: u.organizations?.[0]?.title || '',
        status: u.suspended ? 'SUSPENDED' : 'ACTIVE',
        role: u.isAdmin ? 'SUPER_ADMIN' : 'STANDARD_USER',
        licenses: ['workspace Standard unlimited'],
        isEnrolledIn2SV: !!u.isEnrolledIn2Sv,
        isEnforcedIn2SV: !!u.isEnforcedIn2Sv,
        mustChangePasswordAtNextLogin: !!u.changePasswordAtNextLogin,
        storageUsageGb,
        storageLimitGb,
        driveUsageGb,
        gmailUsageGb,
        photosUsageGb,
        lastLoginTime: u.lastLoginTime || 'Nunca conectou',
        creationTime: u.creationTime || new Date().toISOString(),
      };
    });
  } catch (err: any) {
    const status = err?.status || err?.code || err?.response?.status;
    if (status === 404) {
      return [];
    }
    throw err;
  }
}

export async function createLiveWorkspaceUser(userData: {
  givenName?: string;
  familyName?: string;
  name?: {
    givenName?: string;
    familyName?: string;
    fullName?: string;
  };
  primaryEmail: string;
  password?: string;
  orgUnitPath?: string;
  jobTitle?: string;
  department?: string;
  secondaryEmail?: string;
  recoveryEmail?: string;
  recoveryPhone?: string;
  mustChangePasswordAtNextLogin?: boolean;
}): Promise<WorkspaceUser> {
  const directory = getDirectoryClient();
  const randomPassword = userData.password || `Pass@${Math.random().toString(36).slice(-8)}!2026`;

  // Safely extract givenName and familyName regardless of payload shape
  let givenName = (
    userData.name?.givenName ||
    userData.givenName ||
    ''
  ).trim();

  let familyName = (
    userData.name?.familyName ||
    userData.familyName ||
    ''
  ).trim();

  // If still empty, derive from email prefix
  if (!givenName && !familyName) {
    const emailPrefix = userData.primaryEmail.split('@')[0] || 'User';
    const parts = emailPrefix.split('.');
    givenName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Usuário';
    familyName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Workspace';
  } else if (!givenName) {
    givenName = 'Usuário';
  } else if (!familyName) {
    familyName = 'Workspace';
  }

  // Automatically resolve Organizational Unit from primary email domain
  const emailDomain = (userData.primaryEmail.split('@')[1] || '').trim();
  let targetOrgUnitPath = userData.orgUnitPath;
  if (!targetOrgUnitPath || targetOrgUnitPath === '/') {
    if (emailDomain) {
      targetOrgUnitPath = `/${emailDomain}`;
      // Ensure OU exists in Google Workspace before user insertion
      await ensureOrgUnitForDomain(emailDomain);
    } else {
      targetOrgUnitPath = '/';
    }
  } else if (targetOrgUnitPath.startsWith('/') && targetOrgUnitPath.length > 1) {
    const ouName = targetOrgUnitPath.slice(1);
    if (ouName && !ouName.includes('/')) {
      await ensureOrgUnitForDomain(ouName);
    }
  }

  const requestBody: any = {
    primaryEmail: userData.primaryEmail,
    password: randomPassword,
    changePasswordAtNextLogin: userData.mustChangePasswordAtNextLogin ?? true,
    name: {
      givenName: givenName,
      familyName: familyName,
    },
    orgUnitPath: targetOrgUnitPath,
  };

  const recEmail = userData.recoveryEmail || userData.secondaryEmail;
  if (recEmail) {
    requestBody.recoveryEmail = recEmail;
  }
  const cleanPhone = normalizeWorkspacePhone(userData.recoveryPhone);
  if (cleanPhone) {
    requestBody.recoveryPhone = cleanPhone;
  }

  if (userData.jobTitle || userData.department) {
    requestBody.organizations = [
      {
        title: userData.jobTitle || '',
        department: userData.department || '',
        primary: true,
      },
    ];
  }

  let u: any;
  try {
    const res = await executeWithRetry(
      () => directory.users.insert({ requestBody }),
      `directory.users.insert (${userData.primaryEmail})`
    );
    u = res.data;
  } catch (err: any) {
    const errMsg = String(err?.message || '').toLowerCase();
    const isPhoneError =
      errMsg.includes('recovery phone') ||
      errMsg.includes('recoveryphone') ||
      errMsg.includes('invalid phone') ||
      errMsg.includes('phone number') ||
      (errMsg.includes('phone') && errMsg.includes('invalid'));

    if (requestBody.recoveryPhone && isPhoneError) {
      console.warn(`[Workspace] Recovery phone error detected for ${userData.primaryEmail}: ${err?.message}`);
      // If it lacked '+', ensure '+' is prepended and retry
      if (!String(requestBody.recoveryPhone).startsWith('+')) {
        const withPlus = '+' + String(requestBody.recoveryPhone).replace(/\D/g, '');
        console.warn(`[Workspace] Retrying user insert with '+' manually added: ${withPlus}`);
        requestBody.recoveryPhone = withPlus;
        try {
          const retryRes = await executeWithRetry(
            () => directory.users.insert({ requestBody }),
            `directory.users.insert retry + (${userData.primaryEmail})`
          );
          u = retryRes.data;
        } catch (retryErr: any) {
          console.warn(`[Workspace] Retry with '+' failed (${retryErr?.message}), removing recoveryPhone to ensure account creation succeeds`);
        }
      }

      // If still not created due to phone validation on Google's side, strip phone and succeed
      if (!u) {
        console.warn(`[Workspace] Creating account ${userData.primaryEmail} without problematic recoveryPhone so user creation succeeds`);
        delete requestBody.recoveryPhone;
        const fallbackRes = await executeWithRetry(
          () => directory.users.insert({ requestBody }),
          `directory.users.insert fallback without phone (${userData.primaryEmail})`
        );
        u = fallbackRes.data;
      }
    } else {
      throw err;
    }
  }
  return {
    id: u.id || u.primaryEmail || '',
    primaryEmail: u.primaryEmail || userData.primaryEmail,
    name: {
      givenName: u.name?.givenName || givenName,
      familyName: u.name?.familyName || familyName,
      fullName: u.name?.fullName || `${givenName} ${familyName}`.trim(),
    },
    aliases: u.aliases || [],
    orgUnitPath: u.orgUnitPath || userData.orgUnitPath || '/',
    department: userData.department || '',
    jobTitle: userData.jobTitle || '',
    status: 'ACTIVE',
    role: 'STANDARD_USER',
    licenses: ['Google Workspace Fundamentals'],
    isEnrolledIn2SV: false,
    isEnforcedIn2SV: false,
    mustChangePasswordAtNextLogin: userData.mustChangePasswordAtNextLogin ?? true,
    storageUsageGb: 0,
    storageLimitGb: 15,
    lastLoginTime: 'Nunca conectou',
    creationTime: new Date().toISOString(),
  };
}

export async function updateLiveWorkspaceUser(
  userKey: string,
  updateData: {
    primaryEmail?: string;
    givenName?: string;
    familyName?: string;
    name?: {
      givenName?: string;
      familyName?: string;
      fullName?: string;
    };
    orgUnitPath?: string;
    jobTitle?: string;
    department?: string;
    status?: 'ACTIVE' | 'SUSPENDED';
    secondaryEmail?: string;
    recoveryEmail?: string;
    recoveryPhone?: string;
    password?: string;
    mustChangePasswordAtNextLogin?: boolean;
    changePasswordAtNextLogin?: boolean;
    aliases?: string[];
  }
): Promise<void> {
  const directory = getDirectoryClient();
  const requestBody: any = {};

  if (updateData.primaryEmail && updateData.primaryEmail !== userKey) {
    requestBody.primaryEmail = updateData.primaryEmail;
  }

  const gName = (updateData.name?.givenName || updateData.givenName || '').trim();
  const fName = (updateData.name?.familyName || updateData.familyName || '').trim();

  if (gName || fName) {
    requestBody.name = {};
    if (gName) requestBody.name.givenName = gName;
    if (fName) requestBody.name.familyName = fName;
  }
  if (updateData.orgUnitPath) requestBody.orgUnitPath = updateData.orgUnitPath;
  if (updateData.status) requestBody.suspended = updateData.status === 'SUSPENDED';
  if (updateData.password) {
    requestBody.password = updateData.password;
    requestBody.changePasswordAtNextLogin =
      updateData.mustChangePasswordAtNextLogin ?? updateData.changePasswordAtNextLogin ?? true;
  } else if (updateData.mustChangePasswordAtNextLogin !== undefined) {
    requestBody.changePasswordAtNextLogin = updateData.mustChangePasswordAtNextLogin;
  }

  const recEmail = updateData.recoveryEmail || updateData.secondaryEmail;
  if (recEmail !== undefined) {
    requestBody.recoveryEmail = recEmail;
  }
  if (updateData.recoveryPhone !== undefined) {
    requestBody.recoveryPhone = normalizeWorkspacePhone(updateData.recoveryPhone) || '';
  }

  try {
    await executeWithRetry(
      () => directory.users.patch({ userKey, requestBody }),
      `directory.users.patch (${userKey})`
    );
  } catch (err: any) {
    const errMsg = String(err?.message || '').toLowerCase();
    const isPhoneError =
      errMsg.includes('recovery phone') ||
      errMsg.includes('recoveryphone') ||
      errMsg.includes('invalid phone') ||
      errMsg.includes('phone number');

    if (requestBody.recoveryPhone && isPhoneError) {
      if (!String(requestBody.recoveryPhone).startsWith('+')) {
        requestBody.recoveryPhone = '+' + String(requestBody.recoveryPhone).replace(/\D/g, '');
        try {
          await executeWithRetry(
            () => directory.users.patch({ userKey, requestBody }),
            `directory.users.patch retry + (${userKey})`
          );
          return;
        } catch (retryErr: any) {
          console.warn(`[Workspace] Patch retry with '+' failed, removing recoveryPhone:`, retryErr?.message);
        }
      }
      delete requestBody.recoveryPhone;
      await executeWithRetry(
        () => directory.users.patch({ userKey, requestBody }),
        `directory.users.patch fallback without phone (${userKey})`
      );
    } else {
      throw err;
    }
  }
}

export async function deleteLiveWorkspaceUser(userKey: string): Promise<void> {
  const directory = getDirectoryClient();
  await executeWithRetry(
    () => directory.users.delete({ userKey }),
    `directory.users.delete (${userKey})`
  );
}

export async function listLiveWorkspaceDomains(): Promise<WorkspaceDomain[]> {
  const directory = getDirectoryClient();
  let googleDomains: any[] = [];
  try {
    const res = await executeWithRetry(
      () => directory.domains.list({ customer: 'my_customer' }),
      'directory.domains.list'
    );
    googleDomains = res.data.domains || [];
  } catch (err: any) {
    console.warn('[listLiveWorkspaceDomains] Error listing domains from Google Workspace:', err?.message);
  }

  const resultDomains: WorkspaceDomain[] = [];
  const processedDomainNames = new Set<string>();

  // Load disk domains from tenantStore to preserve tenantId associations
  const diskDomains = loadDomainsFromDisk();
  const diskDomainsMap = new Map<string, WorkspaceDomain>();
  diskDomains.forEach((d) => {
    diskDomainsMap.set(cleanDomainName(d.domainName), d);
  });

  const diskTenants = loadTenantsFromDisk();

  // Helper to find tenantId for a domain
  const findTenantIdForDomain = (dName: string, recordTenantId?: string): string | undefined => {
    if (recordTenantId) return recordTenantId;
    const fromDiskDomain = diskDomainsMap.get(dName)?.tenantId;
    if (fromDiskDomain) return fromDiskDomain;
    // Check disk tenants allowedDomains
    const matchingTenant = diskTenants.find((t) =>
      (t.allowedDomains || []).some((ad) => cleanDomainName(ad) === dName)
    );
    if (matchingTenant) return matchingTenant.id;
    return undefined;
  };

  // 1. Process Google Workspace live domains
  for (const d of googleDomains) {
    const dName = cleanDomainName(d.domainName || '');
    if (!dName) continue;
    processedDomainNames.add(dName);
    const record = getDomainRecord(dName);
    const storedToken = record?.token;
    const isVerified = !!d.verified || record?.state === 'VERIFIED';
    const resolvedTenantId = findTenantIdForDomain(dName, record?.tenantId);

    // If record exists and didn't have tenantId, persist resolved tenantId
    if (record && !record.tenantId && resolvedTenantId) {
      record.tenantId = resolvedTenantId;
      saveDomainAudit(record);
    }

    resultDomains.push({
      domainName: dName,
      tenantId: resolvedTenantId,
      isPrimary: !!d.isPrimary,
      verified: isVerified,
      state: isVerified ? 'VERIFIED' : (record?.state || 'PENDING_APPROVAL'),
      auditRecord: record,
      mxConfigured: true,
      spfConfigured: true,
      dkimConfigured: true,
      verificationTxtToken: storedToken,
      submittedAt: record?.createdAt,
    });
  }

  // 2. Also include all audit records from disk/store that are in PENDING_APPROVAL, PENDING_DNS, etc. and not yet in Google Workspace!
  const allAuditRecords = getAllDomainRecords();
  for (const [auditDomain, record] of Object.entries(allAuditRecords)) {
    const dName = cleanDomainName(auditDomain);
    if (!dName || processedDomainNames.has(dName) || record.state === 'REMOVED' || record.state === 'FAILED') {
      continue;
    }
    processedDomainNames.add(dName);
    const resolvedTenantId = findTenantIdForDomain(dName, record.tenantId);
    if (!record.tenantId && resolvedTenantId) {
      record.tenantId = resolvedTenantId;
      saveDomainAudit(record);
    }
    resultDomains.push({
      domainName: dName,
      tenantId: resolvedTenantId,
      isPrimary: false,
      verified: record.state === 'VERIFIED',
      state: record.state || 'PENDING_APPROVAL',
      auditRecord: record,
      mxConfigured: !!record.dnsCheck?.mxMatched,
      spfConfigured: !!record.dnsCheck?.spfMatched,
      dkimConfigured: false,
      verificationTxtToken: record.token,
      submittedAt: record.createdAt,
    });
  }

  // 3. Also include any domains from diskDomains that weren't processed yet
  for (const diskDomain of diskDomains) {
    const dName = cleanDomainName(diskDomain.domainName);
    if (!dName || processedDomainNames.has(dName)) continue;
    processedDomainNames.add(dName);
    resultDomains.push(diskDomain);
  }

  // Persist updated list to disk so tenantId and states are always preserved
  saveDomainsToDisk(resultDomains);

  return resultDomains;
}

/**
 * Ensures an Organizational Unit named exactly after the domain exists in Google Workspace Directory.
 */
export async function ensureOrgUnitForDomain(domainName: string): Promise<string> {
  const clean = cleanDomainName(domainName);
  if (!clean || !clean.includes('.')) return '/';

  const creds = getCredentials();
  if (!creds) {
    return `/${clean}`;
  }

  try {
    const directory = getDirectoryClient();
    await executeWithRetry(
      () =>
        directory.orgunits.insert({
          customerId: 'my_customer',
          requestBody: {
            name: clean,
            parentOrgUnitPath: '/',
            description: `Unidade Organizacional do domínio ${clean}`,
          },
        }),
      `directory.orgunits.insert (${clean})`
    );
    console.log(`[Google Directory] Created Organizational Unit /${clean}`);
  } catch (err: any) {
    const status = err?.response?.status || err?.code;
    const msg = err?.response?.data?.error?.message || err?.message || '';
    if (status === 409 || msg.includes('already exists') || msg.includes('Duplicate') || msg.includes('duplicate')) {
      console.log(`[Google Directory] OrgUnit /${clean} already exists`);
    } else {
      console.warn(`[Google Directory] ensureOrgUnitForDomain(/${clean}) notice:`, msg);
    }
  }

  return `/${clean}`;
}

/**
 * Lists all Organizational Units from Google Workspace Directory.
 */
export async function listLiveOrgUnits(): Promise<OrgUnit[]> {
  const rootOU: OrgUnit = {
    id: 'ou-root',
    name: 'Unidade Raiz',
    path: '/',
    parentPath: '',
    description: 'Unidade Organizacional Raiz',
    userCount: 0,
    policies: {
      externalDriveSharing: true,
      require2SV: false,
      allowYoutubeUploads: true,
      sessionLengthHours: 24,
    },
  };

  const creds = getCredentials();
  if (!creds) {
    return [rootOU];
  }

  try {
    const directory = getDirectoryClient();
    const res = await executeWithRetry(
      () => directory.orgunits.list({ customerId: 'my_customer', type: 'all' }),
      'directory.orgunits.list'
    );

    const organizationUnits = res.data.organizationUnits || [];
    const mapped: OrgUnit[] = organizationUnits.map((g: any) => ({
      id: g.orgUnitId || `ou-${(g.orgUnitPath || g.name || '').replace(/[^a-zA-Z0-9]/g, '-')}`,
      name: g.name || (g.orgUnitPath || '').replace('/', '') || 'Unidade Organizacional',
      path: g.orgUnitPath || `/${g.name}`,
      parentPath: g.parentOrgUnitPath || '/',
      description: g.description || `Unidade Organizacional ${g.name}`,
      userCount: 0,
      policies: {
        externalDriveSharing: true,
        require2SV: false,
        allowYoutubeUploads: true,
        sessionLengthHours: 24,
      },
    }));

    return [rootOU, ...mapped.filter((m) => m.path !== '/')];
  } catch (err: any) {
    console.warn('[Google Directory] listLiveOrgUnits notice:', err.message);
    return [rootOU];
  }
}

