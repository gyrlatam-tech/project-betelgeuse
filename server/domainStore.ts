import fs from 'fs';
import path from 'path';

export type DomainState =
  | 'NOT_STARTED'
  | 'PENDING_APPROVAL'
  | 'DOMAIN_INSERTED'
  | 'TOKEN_ISSUED'
  | 'PENDING_DNS'
  | 'VERIFIED_PENDING_PROPAGATION'
  | 'VERIFIED'
  | 'FAILED'
  | 'CONFIG_ERROR'
  | 'PROPAGATION_TIMEOUT'
  | 'REMOVED';

export interface StateTransition {
  from: DomainState;
  to: DomainState;
  timestamp: string;
  details?: any;
}

export interface CustomDnsRecord {
  id: string;
  type: string;
  host: string;
  value: string;
  priority?: string | number;
  description?: string;
}

export interface DomainAuditRecord {
  domainName: string;
  tenantId?: string;
  institutionName?: string;
  state: DomainState;
  token?: string;
  txtHost?: string;
  mxServer?: string;
  mxHost?: string;
  mxPriority?: number | string;
  spfHost?: string;
  spfValue?: string;
  customDnsRecords?: CustomDnsRecord[];
  dnsInstructions?: string;
  canonicalResourceId?: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  verifiedAt?: string;
  unverifiedAt?: string;
  stateTransitions: StateTransition[];
  dnsCheck?: {
    lastCheckedAt: string;
    foundTxtRecords: string[];
    foundMxRecords?: string[];
    tokenMatched: boolean;
    mxMatched?: boolean;
    spfMatched?: boolean;
  };
  siteVerification?: {
    lastCheckedAt: string;
    canonicalId?: string;
    owners: string[];
    adminOwnerPresent: boolean;
  };
  directory?: {
    lastCheckedAt: string;
    verified: boolean;
    isPrimary?: boolean;
    creationTime?: string;
  };
  operatorAction?: {
    timestamp: string;
    result: 'ACCEPTED_IMMEDIATELY' | 'ASKED_NEW_TXT' | 'OTHER';
    notes?: string;
  };
  lastRawError?: any;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const AUDIT_FILE = path.join(DATA_DIR, 'domains_audit.json');

let auditCache: Record<string, DomainAuditRecord> = {};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[DomainStore] Could not create .data directory:', err);
  }
}

function loadAuditData(): Record<string, DomainAuditRecord> {
  ensureDataDir();
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
      auditCache = JSON.parse(raw) || {};
    }
  } catch (err) {
    console.warn('[DomainStore] Error reading audit file:', err);
  }
  return auditCache;
}

function persistAuditData(): void {
  ensureDataDir();
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DomainStore] Error writing audit file:', err);
  }
}

// Initial load
loadAuditData();

export function cleanDomainName(domain: string): string {
  if (typeof domain !== 'string') return '';
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .replace(/:[0-9]+$/, '');
}

export function getDomainRecord(domain: string): DomainAuditRecord | undefined {
  const clean = cleanDomainName(domain);
  if (!clean) return undefined;
  if (!auditCache[clean]) {
    loadAuditData();
  }
  return auditCache[clean];
}

export function getAllDomainRecords(): Record<string, DomainAuditRecord> {
  loadAuditData();
  return { ...auditCache };
}

export function initDomainRecord(domain: string): DomainAuditRecord {
  const clean = cleanDomainName(domain);
  const existing = getDomainRecord(clean);
  const now = new Date().toISOString();

  if (existing) {
    return existing;
  }

  const record: DomainAuditRecord = {
    domainName: clean,
    state: 'NOT_STARTED',
    stateTransitions: [
      {
        from: 'NOT_STARTED',
        to: 'NOT_STARTED',
        timestamp: now,
        details: 'Initial record created',
      },
    ],
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  auditCache[clean] = record;
  persistAuditData();
  return record;
}

export function updateDomainState(
  domain: string,
  newState: DomainState,
  details?: any,
  rawError?: any
): DomainAuditRecord {
  const clean = cleanDomainName(domain);
  let record = getDomainRecord(clean);
  const now = new Date().toISOString();

  if (!record) {
    record = initDomainRecord(clean);
  }

  const previousState = record.state;
  record.state = newState;
  record.updatedAt = now;

  if (newState === 'PENDING_APPROVAL') {
    delete record.token;
    delete record.approvedBy;
    delete record.approvedAt;
    delete record.adminNotes;
    delete record.verifiedAt;
    delete record.dnsCheck;
  }

  record.stateTransitions.push({
    from: previousState,
    to: newState,
    timestamp: now,
    details,
  });

  if (rawError !== undefined) {
    record.lastRawError = rawError;
  }

  auditCache[clean] = record;
  persistAuditData();
  return record;
}

export function saveDomainAudit(record: DomainAuditRecord): void {
  const clean = cleanDomainName(record.domainName);
  record.updatedAt = new Date().toISOString();
  auditCache[clean] = record;
  persistAuditData();
}

export function getStoredToken(domain: string): string | undefined {
  const record = getDomainRecord(domain);
  return record?.token;
}

export function setStoredToken(domain: string, token: string): void {
  const clean = cleanDomainName(domain);
  let record = getDomainRecord(clean);
  if (!record) {
    record = initDomainRecord(clean);
  }
  record.token = token;
  record.updatedAt = new Date().toISOString();
  auditCache[clean] = record;
  persistAuditData();
}

export function updateDomainDnsConfig(
  domain: string,
  config: {
    token?: string;
    txtHost?: string;
    mxServer?: string;
    mxHost?: string;
    mxPriority?: number | string;
    spfHost?: string;
    spfValue?: string;
    customDnsRecords?: CustomDnsRecord[];
    dnsInstructions?: string;
    adminNotes?: string;
  }
): DomainAuditRecord {
  const clean = cleanDomainName(domain);
  let record = getDomainRecord(clean);
  if (!record) {
    record = initDomainRecord(clean);
  }
  const now = new Date().toISOString();
  if (config.token !== undefined) record.token = config.token;
  if (config.txtHost !== undefined) record.txtHost = config.txtHost;
  if (config.mxServer !== undefined) record.mxServer = config.mxServer;
  if (config.mxHost !== undefined) record.mxHost = config.mxHost;
  if (config.mxPriority !== undefined) record.mxPriority = config.mxPriority;
  if (config.spfHost !== undefined) record.spfHost = config.spfHost;
  if (config.spfValue !== undefined) record.spfValue = config.spfValue;
  if (config.customDnsRecords !== undefined) record.customDnsRecords = config.customDnsRecords;
  if (config.dnsInstructions !== undefined) record.dnsInstructions = config.dnsInstructions;
  if (config.adminNotes !== undefined) record.adminNotes = config.adminNotes;
  record.updatedAt = now;
  auditCache[clean] = record;
  persistAuditData();
  return record;
}

export function approveDomainWithTxt(
  domain: string,
  token: string,
  notes?: string,
  adminEmail?: string
): DomainAuditRecord {
  const clean = cleanDomainName(domain);
  let record = getDomainRecord(clean);
  const now = new Date().toISOString();

  if (!record) {
    record = initDomainRecord(clean);
  }

  const previousState = record.state;
  record.state = 'PENDING_DNS';
  record.token = token;
  record.adminNotes = notes;
  record.approvedBy = adminEmail || 'gyrlatam@gmail.com';
  record.approvedAt = now;
  record.updatedAt = now;

  record.stateTransitions.push({
    from: previousState,
    to: 'PENDING_DNS',
    timestamp: now,
    details: {
      action: 'ADMIN_APPROVED_WITH_TXT',
      token,
      notes,
      approvedBy: record.approvedBy,
    },
  });

  auditCache[clean] = record;
  persistAuditData();
  return record;
}

export function recordOperatorAction(
  domain: string,
  result: 'ACCEPTED_IMMEDIATELY' | 'ASKED_NEW_TXT' | 'OTHER',
  notes?: string
): DomainAuditRecord {
  const clean = cleanDomainName(domain);
  let record = getDomainRecord(clean);
  if (!record) {
    record = initDomainRecord(clean);
  }
  record.operatorAction = {
    timestamp: new Date().toISOString(),
    result,
    notes,
  };
  record.updatedAt = new Date().toISOString();
  auditCache[clean] = record;
  persistAuditData();
  return record;
}
