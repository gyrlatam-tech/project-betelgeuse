import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { MultiTenantState } from './tenantStore.ts';
import { cleanDomainName } from './domainStore.ts';

const CONFIG_PATH = path.join(process.cwd(), 'firebase-applet-config.json');
const DATA_DIR = path.join(process.cwd(), '.data');
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');
const DOMAINS_FILE = path.join(DATA_DIR, 'domains.json');
const AUDIT_FILE = path.join(DATA_DIR, 'domains_audit.json');

function getDb() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const app = getApps().length === 0 ? initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    }) : getApps()[0];
    return getFirestore(app, config.firestoreDatabaseId);
  } catch (err) {
    console.warn('[firestoreSync] Could not initialize Firestore:', err);
    return null;
  }
}

let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 2500; // avoid spamming getDocs on rapid requests

export async function syncInstitutionsFromFirestore(multiTenantData?: MultiTenantState, force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && now - lastSyncTime < SYNC_COOLDOWN_MS) {
    return false;
  }
  lastSyncTime = now;

  const db = getDb();
  if (!db) return false;

  try {
    const snap = await getDocs(collection(db, 'institutions'));
    const tenants: any[] = [];
    const domainToTenant: Record<string, { tenantId: string; institutionName: string }> = {};

    snap.forEach((d) => {
      const data = d.data();
      const rawId = data.ownerUid || d.id;
      const cleanId = String(rawId).replace(/^tenant-/, '');
      const instId = rawId.startsWith('tenant-') ? rawId : `tenant-${rawId}`;
      const allowed = (data.allowedDomains || []).map((x: string) => String(x).toLowerCase().trim()).filter(Boolean);

      tenants.push({
        id: instId,
        name: data.institutionName || 'Organização',
        slug: (data.institutionName || 'org').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        primaryContactEmail: data.technicalContactEmail || data.institutionEmail || data.ownerEmail || '',
        financialContactEmail: data.financialContactEmail || data.institutionEmail || '',
        allowedDomains: allowed,
        status: data.status || 'ACTIVE',
        ownerUid: cleanId,
      });

      const isSuperAdminAccount = data.role === 'SUPER_ADMIN' || cleanId === 'MTIsLQkMv8Vpai1hZ7o7CoSQ5xj2' || (data.ownerEmail && data.ownerEmail.toLowerCase() === 'gyrlatam@gmail.com');
      if (!isSuperAdminAccount) {
        allowed.forEach((dom: string) => {
          domainToTenant[dom] = {
            tenantId: cleanId,
            institutionName: data.institutionName || 'Organização',
          };
        });
      }
    });

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 1. Save tenants to disk and update multiTenantData
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf8');
    if (multiTenantData) {
      multiTenantData.tenants = tenants;
    }

    // 2. Synchronize domains in domains.json
    let domains: any[] = [];
    if (fs.existsSync(DOMAINS_FILE)) {
      try {
        domains = JSON.parse(fs.readFileSync(DOMAINS_FILE, 'utf8'));
      } catch {
        domains = [];
      }
    }

    // Ensure all domains mapped from institutions exist and are linked to their tenant
    Object.keys(domainToTenant).forEach((dom) => {
      const info = domainToTenant[dom];
      const existing = domains.find((d) => cleanDomainName(d.domainName) === dom);
      if (existing) {
        existing.tenantId = info.tenantId;
        if (!existing.auditRecord) existing.auditRecord = { domainName: dom };
        existing.auditRecord.tenantId = info.tenantId;
        existing.auditRecord.institutionName = info.institutionName;
        existing.auditRecord.state = existing.state || 'VERIFIED';
        existing.verified = true;
        existing.state = 'VERIFIED';
      } else {
        domains.push({
          domainName: dom,
          tenantId: info.tenantId,
          isPrimary: domains.length === 0,
          verified: true,
          state: 'VERIFIED',
          mxConfigured: true,
          spfConfigured: true,
          dkimConfigured: true,
          verificationTxtToken: '',
          txtHost: '@',
          mxRecordServer: 'SMTP.GOOGLE.COM',
          mxRecordHost: '@',
          mxRecordPriority: '1',
          spfRecordValue: 'v=spf1 include:_spf.google.com ~all',
          spfRecordHost: '@',
          customDnsRecords: [],
          dnsInstructions: '',
          auditRecord: {
            domainName: dom,
            tenantId: info.tenantId,
            institutionName: info.institutionName,
            state: 'VERIFIED',
          },
        });
      }
    });

    fs.writeFileSync(DOMAINS_FILE, JSON.stringify(domains, null, 2), 'utf8');
    if (multiTenantData) {
      multiTenantData.domains = domains;
    }

    // 3. Synchronize audit records in domains_audit.json
    let audits: Record<string, any> = {};
    if (fs.existsSync(AUDIT_FILE)) {
      try {
        audits = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
      } catch {
        audits = {};
      }
    }

    Object.keys(domainToTenant).forEach((dom) => {
      const info = domainToTenant[dom];
      if (!audits[dom]) {
        audits[dom] = {
          domainName: dom,
          state: 'VERIFIED',
          stateTransitions: [
            {
              from: 'NOT_STARTED',
              to: 'VERIFIED',
              timestamp: new Date().toISOString(),
              details: 'Associated by SuperAdmin / Firestore sync',
            },
          ],
          attempts: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: info.tenantId,
          institutionName: info.institutionName,
          dnsInstructions: 'Configurado e verificado pelo SuperAdmin',
        };
      } else {
        audits[dom].tenantId = info.tenantId;
        audits[dom].institutionName = info.institutionName;
        audits[dom].state = 'VERIFIED';
      }
    });

    fs.writeFileSync(AUDIT_FILE, JSON.stringify(audits, null, 2), 'utf8');
    console.log(`[firestoreSync] Successfully synced ${tenants.length} tenants and mapped ${Object.keys(domainToTenant).length} domains from Firestore.`);
    return true;
  } catch (err: any) {
    console.warn('[firestoreSync] Sync error:', err?.message || err);
    return false;
  }
}
