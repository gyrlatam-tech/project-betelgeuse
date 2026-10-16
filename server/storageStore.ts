import fs from 'fs';
import path from 'path';

export interface StoragePolicyConfig {
  userLimits: Record<string, number>; // email -> limit in GB
  orgUnitLimits: Record<string, number>; // orgUnitPath -> limit in GB
  defaultLimitGb: number;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORAGE_CONFIG_FILE = path.join(DATA_DIR, 'storage_settings.json');

// Default initial storage settings
// - admin@alumnoweb.com holds the full domain pool (1349 GB / ~1.3 TB)
// - domquijotebrasil.com.br holds 200 GB quota as configured in Google Workspace Admin
// - standard accounts default to 15 GB
const DEFAULT_CONFIG: StoragePolicyConfig = {
  userLimits: {
    'admin@alumnoweb.com': 1349,
    'yodel@donquijotebrasil.com.br': 200,
  },
  orgUnitLimits: {
    '/domquijotebrasil.com.br': 200,
    '/alumnoweb.com': 1349,
    '/': 15,
  },
  defaultLimitGb: 15,
};

let storageConfigCache: StoragePolicyConfig = { ...DEFAULT_CONFIG };

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[StorageStore] Could not create .data directory:', err);
  }
}

export function loadStorageSettings(): StoragePolicyConfig {
  ensureDataDir();
  try {
    if (fs.existsSync(STORAGE_CONFIG_FILE)) {
      const raw = fs.readFileSync(STORAGE_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      storageConfigCache = {
        userLimits: { ...DEFAULT_CONFIG.userLimits, ...(parsed.userLimits || {}) },
        orgUnitLimits: { ...DEFAULT_CONFIG.orgUnitLimits, ...(parsed.orgUnitLimits || {}) },
        defaultLimitGb: parsed.defaultLimitGb || DEFAULT_CONFIG.defaultLimitGb,
      };
    } else {
      persistStorageSettings();
    }
  } catch (err) {
    console.warn('[StorageStore] Error reading storage settings:', err);
  }
  return storageConfigCache;
}

export function persistStorageSettings(): void {
  ensureDataDir();
  try {
    fs.writeFileSync(STORAGE_CONFIG_FILE, JSON.stringify(storageConfigCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[StorageStore] Error writing storage settings:', err);
  }
}

// Initial load
loadStorageSettings();

export function getUserStorageLimit(email: string, orgUnitPath?: string, isAdmin?: boolean): number {
  const normEmail = (email || '').toLowerCase().trim();
  const cfg = loadStorageSettings();

  // 1. Explicit user limit
  if (cfg.userLimits[normEmail] !== undefined && cfg.userLimits[normEmail] > 0) {
    return cfg.userLimits[normEmail];
  }

  // 2. Administrator account default: shared pooled storage (1349 GB)
  if (isAdmin || normEmail === 'admin@alumnoweb.com') {
    return 1349;
  }

  // 3. OrgUnit policy limit
  if (orgUnitPath) {
    const cleanPath = orgUnitPath.trim();
    if (cfg.orgUnitLimits[cleanPath] !== undefined && cfg.orgUnitLimits[cleanPath] > 0) {
      return cfg.orgUnitLimits[cleanPath];
    }
    // Also match without leading slash if applicable
    const withSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    if (cfg.orgUnitLimits[withSlash] !== undefined && cfg.orgUnitLimits[withSlash] > 0) {
      return cfg.orgUnitLimits[withSlash];
    }
  }

  return cfg.defaultLimitGb || 15;
}

export function setUserStorageLimit(email: string, limitGb: number): void {
  const normEmail = (email || '').toLowerCase().trim();
  if (!normEmail) return;

  const cfg = loadStorageSettings();
  cfg.userLimits[normEmail] = limitGb;
  persistStorageSettings();
}

export function setOrgUnitStorageLimit(orgUnitPath: string, limitGb: number): void {
  const cleanPath = (orgUnitPath || '').trim();
  if (!cleanPath) return;

  const cfg = loadStorageSettings();
  cfg.orgUnitLimits[cleanPath] = limitGb;
  persistStorageSettings();
}
