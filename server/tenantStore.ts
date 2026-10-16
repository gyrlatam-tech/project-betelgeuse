import fs from 'fs';
import path from 'path';
import type { Tenant, WorkspaceUser, WorkspaceDomain, LicenseInventory } from '../src/types';

export interface MultiTenantState {
  tenants: Tenant[];
  currentTenantId: string;
  users: WorkspaceUser[];
  domains: WorkspaceDomain[];
  licenses: LicenseInventory[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');
const DOMAINS_FILE = path.join(DATA_DIR, 'domains.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // ignore
    }
  }
}

export function loadTenantsFromDisk(): Tenant[] {
  try {
    ensureDataDir();
    if (fs.existsSync(TENANTS_FILE)) {
      const raw = fs.readFileSync(TENANTS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[tenantStore] Failed to load tenants from disk:', err);
  }
  return [];
}

export function saveTenantsToDisk(tenants: Tenant[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf8');
  } catch (err) {
    console.warn('[tenantStore] Failed to save tenants to disk:', err);
  }
}

export function loadDomainsFromDisk(): WorkspaceDomain[] {
  try {
    ensureDataDir();
    if (fs.existsSync(DOMAINS_FILE)) {
      const raw = fs.readFileSync(DOMAINS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[tenantStore] Failed to load domains from disk:', err);
  }
  return [];
}

export function saveDomainsToDisk(domains: WorkspaceDomain[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DOMAINS_FILE, JSON.stringify(domains, null, 2), 'utf8');
  } catch (err) {
    console.warn('[tenantStore] Failed to save domains to disk:', err);
  }
}

// Initial multi-tenant state starts clean with persisted tenants and domains from disk
export const INITIAL_MULTI_TENANT_STATE: MultiTenantState = {
  tenants: loadTenantsFromDisk(),
  currentTenantId: '',
  users: [],
  domains: loadDomainsFromDisk(),
  licenses: [
    {
      sku: 'Google Workspace Enterprise Plus',
      totalSeats: 50,
      assignedSeats: 0,
      color: '#00c868',
      monthlyCostUsd: 30.0,
      features: ['Drive Ilimitado', 'Google Meet 500p + Gravação', 'Vault e DLP Avançado', 'Controle S/MIME'],
    },
    {
      sku: 'Google Workspace Business Standard',
      totalSeats: 100,
      assignedSeats: 0,
      color: '#00e5ff',
      monthlyCostUsd: 12.0,
      features: ['2 TB por usuário', 'Google Meet 150p + Gravação', 'Drives Compartilhados'],
    },
    {
      sku: 'Google Workspace Business Starter',
      totalSeats: 30,
      assignedSeats: 0,
      color: '#ffaa00',
      monthlyCostUsd: 6.0,
      features: ['30 GB por usuário', 'Google Meet 100p', 'Segurança Padrão'],
    },
    {
      sku: 'Cloud Identity Free',
      totalSeats: 250,
      assignedSeats: 0,
      color: '#94a3b8',
      monthlyCostUsd: 0.0,
      features: ['Gerenciamento de Identidades', '2SV Obrigatório', 'SSO / SAML'],
    },
  ],
};

