import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import type {
  InstitutionProfile,
  BillingDetails,
  SubscriptionState,
  Invoice,
  SupportTicket,
  TicketMessage,
  TicketStatus,
} from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Export raw Firebase config for token/URL generators
export const resolvedFirebaseConfig = {
  ...firebaseConfig,
  authDomain: firebaseConfig.authDomain || 'ai-studio-applet-webapp-833d9.firebaseapp.com',
};
export { firebaseConfig };

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();

// Auth Instance
export const auth = getAuth(app);

// Firestore Instance (supporting databaseId if provided)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Primary Google Auth action: Initiates in-app authentication via signInWithRedirect.
 * Storing a transient flag helps detect whether a page reload represents an active OAuth return.
 */
export async function loginWithGoogleRedirect(): Promise<void> {
  try {
    sessionStorage.setItem('auth_redirect_in_progress', 'true');
  } catch {
    // ignore
  }
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Fallback Google Auth action: Offered only as an alternative option if
 * getRedirectResult fails due to browser cross-origin cookie / storage partitioning.
 */
export async function loginWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Default export alias for general consumption
export const loginWithGoogle = loginWithGoogleRedirect;

/**
 * Retrieves the OAuth credential when returning from a signInWithRedirect flow.
 * Handled once on application mount with a strict timeout to prevent indefinite hangs.
 */
export async function checkRedirectResult(): Promise<FirebaseUser | null> {
  try {
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 2500)
    );
    const result = await Promise.race([
      getRedirectResult(auth),
      timeoutPromise,
    ]);
    return result?.user || null;
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain') {
      console.error(
        '[Firebase Auth] auth/unauthorized-domain: O domínio atual não está adicionado na lista de Domínios Autorizados no Firebase Authentication.',
        error
      );
    } else if (error?.code === 'auth/operation-not-allowed') {
      console.error(
        '[Firebase Auth] auth/operation-not-allowed: O provedor Google não está ativado no Firebase Console para este projeto.',
        error
      );
    } else {
      console.warn('[Firebase Auth] Aviso ao verificar resultado de redirecionamento:', error);
    }
    return null;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    return result.user;
  } catch (error: any) {
    const errCode = error?.code || '';
    const errMsg = error?.message || '';

    // If account was created or reset, attempt create if user not found in Firebase Auth
    if (errCode === 'auth/user-not-found' || errMsg.includes('user-not-found')) {
      try {
        const created = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        return created.user;
      } catch (createErr: any) {
        if (createErr?.code === 'auth/email-already-in-use') {
          const friendlyError: any = new Error(
            'E-mail ou senha incorretos. Verifique suas credenciais ou solicite a recuperação de senha.'
          );
          friendlyError.code = 'auth/invalid-credential';
          throw friendlyError;
        }
      }
    }

    // Friendly messages for known Firebase error codes
    if (
      errCode === 'auth/invalid-credential' ||
      errCode === 'auth/wrong-password' ||
      errCode === 'auth/user-not-found' ||
      errMsg.includes('invalid-credential') ||
      errMsg.includes('user-not-found') ||
      errMsg.includes('wrong-password')
    ) {
      const friendlyError: any = new Error(
        'E-mail ou senha incorretos. Verifique suas credenciais ou solicite a recuperação de senha.'
      );
      friendlyError.code = 'auth/invalid-credential';
      throw friendlyError;
    }

    if (errCode === 'auth/invalid-email' || errMsg.includes('invalid-email')) {
      const friendlyError: any = new Error('O formato do e-mail inserido é inválido.');
      friendlyError.code = 'auth/invalid-email';
      throw friendlyError;
    }

    if (errCode === 'auth/too-many-requests' || errMsg.includes('too-many-requests')) {
      const friendlyError: any = new Error(
        'Muitas tentativas consecutivas. Aguarde alguns instantes antes de tentar novamente.'
      );
      friendlyError.code = 'auth/too-many-requests';
      throw friendlyError;
    }

    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

// Password Reset with Firebase Auth Tokens and Config
export async function sendFirebasePasswordReset(email: string, customContinueUrl?: string, preferredLanguage?: string) {
  const currentLang =
    preferredLanguage ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('skoolia_language') : null) ||
    'pt';
  const continueUrl = customContinueUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const actionCodeSettings = {
    url: continueUrl ? `${continueUrl}?mode=resetPassword&email=${encodeURIComponent(email)}&lang=${encodeURIComponent(currentLang)}` : '',
    handleCodeInApp: true,
  };

  try {
    if (actionCodeSettings.url) {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } else {
      await sendPasswordResetEmail(auth, email);
    }
  } catch (error) {
    // If native Firebase fails (e.g. user not yet in client pool), we also trigger the backend REST API
    console.warn('Firebase client sendPasswordResetEmail note:', error);
  }

  // Also call backend to generate full oobCode and send Resend email with direct Firebase action link
  const res = await fetch('/api/auth/send-password-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-language': currentLang,
    },
    body: JSON.stringify({
      email,
      preferredLanguage: currentLang,
      lang: currentLang,
    }),
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Não foi possível gerar o link de redefinição de senha');
  }

  return await res.json();
}

export async function verifyFirebaseResetCode(oobCode: string, fallbackEmail?: string): Promise<string> {
  try {
    const verifiedEmail = await verifyPasswordResetCode(auth, oobCode);
    if (verifiedEmail) return verifiedEmail;
  } catch {
    // Non-blocking catch, check backend next
  }

  // Try backend verification endpoint
  try {
    const res = await fetch('/api/auth/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oobCode, email: fallbackEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.email || fallbackEmail || '';
    }
  } catch {
    // Return fallback if any
  }

  return fallbackEmail || '';
}

export async function confirmFirebasePasswordReset(oobCode: string, newPass: string, email?: string) {
  let isResetSuccessful = false;
  let lastError: any = null;

  // 1. If oobCode is a native Firebase Auth action code, attempt native SDK reset first
  if (oobCode && !oobCode.startsWith('fb_rst_') && oobCode !== 'direct_reset') {
    try {
      await confirmPasswordReset(auth, oobCode, newPass);
      isResetSuccessful = true;
    } catch (firebaseErr: any) {
      console.warn('Native Firebase confirmPasswordReset note, attempting backend endpoint:', firebaseErr);
      lastError = firebaseErr;
    }
  }

  // 2. Backend Identity Toolkit & Secure handler endpoint
  try {
    const res = await fetch('/api/auth/confirm-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oobCode, email, newPassword: newPass }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success !== false) {
      isResetSuccessful = true;
    } else if (!isResetSuccessful && data?.error) {
      lastError = new Error(data.error);
    }
  } catch (backendErr) {
    console.warn('Backend confirm reset note:', backendErr);
  }

  // 3. If email is provided, ensure user exists in Firebase Auth or sign in immediately
  if (email && email.includes('@')) {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, newPass);
      isResetSuccessful = true;
    } catch (createErr: any) {
      if (createErr?.code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, newPass);
          isResetSuccessful = true;
        } catch {
          // Keep prior state
        }
      }
    }
  }

  if (!isResetSuccessful && lastError) {
    throw lastError;
  }

  return { success: true, message: 'Senha atualizada com sucesso!' };
}

// Operation types & error info compliant with Firestore security error specs
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

// Institution Firestore Helpers
export async function fetchInstitutionProfile(uid: string, userEmail?: string | null): Promise<InstitutionProfile | null> {
  try {
    if (!uid) return null;
    const docRef = doc(db, 'institutions', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as InstitutionProfile;
      return {
        ...data,
        id: docSnap.id,
        ownerUid: data.ownerUid || docSnap.id,
      };
    }

    if (userEmail) {
      const cleanEmail = userEmail.trim().toLowerCase();
      const colRef = collection(db, 'institutions');
      const q = query(colRef, where('ownerEmail', '==', cleanEmail));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const foundDoc = qSnap.docs[0];
        const data = foundDoc.data() as InstitutionProfile;
        return {
          ...data,
          id: foundDoc.id,
          ownerUid: data.ownerUid || foundDoc.id,
        };
      }
      const qInst = query(colRef, where('institutionEmail', '==', cleanEmail));
      const qInstSnap = await getDocs(qInst);
      if (!qInstSnap.empty) {
        const foundDoc = qInstSnap.docs[0];
        const data = foundDoc.data() as InstitutionProfile;
        return {
          ...data,
          id: foundDoc.id,
          ownerUid: data.ownerUid || foundDoc.id,
        };
      }
    }

    return null;
  } catch (error) {
    console.warn('Aviso ao buscar perfil da instituição no Firestore:', error);
    return null;
  }
}

// Fetch all registered institutions (tenants) from Firestore database for SuperAdmin
export async function fetchAllInstitutionsFromFirestore(): Promise<InstitutionProfile[]> {
  try {
    const colRef = collection(db, 'institutions');
    const snap = await getDocs(colRef);
    const institutions: InstitutionProfile[] = [];
    snap.forEach((d) => {
      const data = d.data() as InstitutionProfile;
      institutions.push({
        ...data,
        id: d.id,
        ownerUid: data.ownerUid || d.id,
      });
    });
    return institutions;
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.LIST, 'institutions');
    } else {
      console.warn('Aviso ao buscar todas as instituições no Firestore:', error);
    }
    return [];
  }
}

// Real-time broadcast channel for instant multi-tab and live sync of tenant block/unblock status
function createTenantStatusChannel(): BroadcastChannel | null {
  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      return new BroadcastChannel('skoolia_tenant_status_sync');
    }
  } catch (err) {
    console.warn('BroadcastChannel initialization skipped:', err);
  }
  return null;
}

export const tenantStatusChannel = createTenantStatusChannel();

export function broadcastTenantStatus(data: {
  tenantId: string;
  status: 'ACTIVE' | 'SUSPENDED';
  suspendedReason?: string;
  timestamp?: number;
}): void {
  try {
    const payload = { ...data, timestamp: Date.now() };
    try {
      localStorage.setItem('skoolia_tenant_status_broadcast', JSON.stringify(payload));
    } catch {
      // ignore
    }
    if (tenantStatusChannel) {
      tenantStatusChannel.postMessage(payload);
    }
    // Also dispatch custom DOM event for current window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skoolia_tenant_status_change', { detail: payload }));
    }
  } catch (err) {
    console.warn('Notice broadcasting tenant status:', err);
  }
}

// Live real-time Firestore listener for a specific institution document
export function subscribeInstitutionProfile(
  uid: string,
  onUpdate: (profile: InstitutionProfile | null) => void
): () => void {
  if (!uid) return () => {};
  try {
    const docRef = doc(db, 'institutions', uid);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as InstitutionProfile;
          onUpdate({
            ...data,
            id: docSnap.id,
            ownerUid: data.ownerUid || docSnap.id,
          });
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.warn('Real-time snapshot notice for institution profile:', error);
      }
    );
  } catch (err) {
    console.warn('Could not establish real-time snapshot listener on institution:', err);
    return () => {};
  }
}

// Live real-time Firestore listener for ALL institutions (for SuperAdmin live dashboard)
export function subscribeAllInstitutions(
  onUpdate: (institutions: InstitutionProfile[]) => void
): () => void {
  try {
    const colRef = collection(db, 'institutions');
    return onSnapshot(
      colRef,
      (snap) => {
        const list: InstitutionProfile[] = [];
        snap.forEach((d) => {
          const data = d.data() as InstitutionProfile;
          list.push({
            ...data,
            id: d.id,
            ownerUid: data.ownerUid || d.id,
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Real-time snapshot notice for all institutions:', error);
      }
    );
  } catch (err) {
    console.warn('Could not establish real-time snapshot listener on all institutions:', err);
    return () => {};
  }
}

// Update tenant / institution status in Firestore database
export async function updateInstitutionStatusInFirestore(
  uid: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL',
  suspendedReason?: string
): Promise<void> {
  try {
    const docRef = doc(db, 'institutions', uid);
    const updateData: any = {
      subscription: {
        status,
      },
      status,
      updatedAt: new Date().toISOString(),
      _serverUpdatedAt: serverTimestamp(),
    };
    if (status === 'SUSPENDED') {
      updateData.suspendedReason =
        suspendedReason ||
        'Inadimplência ou pendência financeira identificada pelo administrador do sistema.';
    } else {
      updateData.suspendedReason = null;
    }
    await setDoc(docRef, updateData, { merge: true });

    // Live broadcast across tabs and local windows immediately
    if (status === 'ACTIVE' || status === 'SUSPENDED') {
      broadcastTenantStatus({
        tenantId: uid,
        status,
        suspendedReason: status === 'SUSPENDED' ? updateData.suspendedReason : undefined,
      });
    }
  } catch (error) {
    console.warn('Erro ao atualizar status da instituição no Firestore:', error);
  }
}

// Mark pending invoice as paid in Firestore and automatically unlock tenant
export async function markInstitutionInvoicePaidInFirestore(
  uid: string,
  invoiceId: string,
  paidInvoiceData?: Partial<Invoice>
): Promise<void> {
  try {
    const docRef = doc(db, 'institutions', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const invoices: Invoice[] = data.invoices || [];
      const updatedInvoices = invoices.map((inv) =>
        inv.id === invoiceId || inv.invoiceNumber === invoiceId
          ? {
              ...inv,
              status: 'PAID' as const,
              ...paidInvoiceData,
            }
          : inv
      );

      // If this was a new/custom invoice not previously stored in Firestore array, add it as paid
      if (!updatedInvoices.some((i) => i.id === invoiceId || i.invoiceNumber === invoiceId)) {
        if (paidInvoiceData) {
          updatedInvoices.unshift({
            id: invoiceId,
            invoiceNumber: invoiceId,
            date: new Date().toISOString(),
            amount: 120,
            currency: 'USD',
            status: 'PAID',
            billingCycle: 'MONTHLY',
            planName: 'Workspace Standard Unlimited',
            paymentMethod: 'Cartão de Crédito',
            ...paidInvoiceData,
          } as Invoice);
        }
      }

      await setDoc(
        docRef,
        {
          invoices: updatedInvoices,
          status: 'ACTIVE',
          subscription: {
            status: 'ACTIVE',
          },
          suspendedReason: null,
          updatedAt: new Date().toISOString(),
          _serverUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Broadcast unblock immediately to tenant and admin
      broadcastTenantStatus({
        tenantId: uid,
        status: 'ACTIVE',
      });
    }
  } catch (err) {
    console.warn('Erro ao atualizar fatura e desbloquear instituição no Firestore:', err);
  }
}

// Delete an institution tenant completely from Firestore
export async function deleteInstitutionFromFirestore(uid: string): Promise<void> {
  try {
    const docRef = doc(db, 'institutions', uid);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao excluir instituição do Firestore:', error);
    throw error;
  }
}

// Full update of an institution in Firestore
export async function updateInstitutionInFirestore(
  uid: string,
  data: Partial<InstitutionProfile>
): Promise<void> {
  try {
    const docRef = doc(db, 'institutions', uid);
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: new Date().toISOString(),
        _serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Erro ao atualizar instituição no Firestore:', error);
    throw error;
  }
}

// Create new tenant in Firestore database
export async function createInstitutionTenantInFirestore(
  tenantData: any
): Promise<InstitutionProfile> {
  const tenantId = tenantData.id || `inst-${Date.now()}`;
  const uid = tenantId.replace(/^tenant-/, '');
  const now = new Date().toISOString();

  const newProfile: InstitutionProfile = {
    ownerUid: uid,
    ownerEmail: tenantData.primaryContactEmail || '',
    institutionName: tenantData.name || 'Nova Instituição',
    institutionEmail: tenantData.primaryContactEmail || '',
    institutionPhone: '',
    institutionAddress: '',
    technicalContactName: tenantData.name || 'Administrador Técnico',
    technicalContactEmail: tenantData.primaryContactEmail || '',
    technicalContactPhone: '',
    financialContactName: tenantData.name || 'Administrador Financeiro',
    financialContactEmail: tenantData.financialContactEmail || tenantData.primaryContactEmail || '',
    financialContactPhone: '',
    studentsCount: 300,
    teachersCount: 25,
    role: 'TENANT_ADMIN',
    subscription: {
      planId: 'workspace_standard_unlimited',
      planName: 'Workspace Standard Unlimited',
      status: (tenantData.status as any) || 'ACTIVE',
      billingCycle: 'MONTHLY',
      currentPrice: tenantData.monthlyBudgetUsd || 0,
      isUnlimitedLicenses: true,
      startDate: now,
      nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentMethod: {
        brand: 'Visa',
        last4: '4242',
        expiry: '12/28',
        cardholder: tenantData.name || 'Instituição',
      },
      billingDetails: {
        fullName: tenantData.name || 'Instituição',
        email: tenantData.primaryContactEmail || '',
        taxId: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Brasil',
        countryCode: 'BR',
      },
    },
    createdAt: tenantData.createdAt || now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'institutions', uid);
    await setDoc(
      docRef,
      {
        ...newProfile,
        _serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Aviso ao salvar nova instituição no Firestore:', err);
  }

  return newProfile;
}

export async function saveInstitutionProfile(
  uid: string,
  profile: Omit<InstitutionProfile, 'ownerUid' | 'createdAt' | 'updatedAt'> & { ownerUid?: string; ownerEmail?: string }
): Promise<InstitutionProfile> {
  const now = new Date().toISOString();
  const docRef = doc(db, 'institutions', uid);
  
  // Check if exists to preserve createdAt and existing billing/Stripe IDs
  let existingCreatedAt = now;
  let existingData: any = {};
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      existingData = snap.data() || {};
      if (existingData.createdAt) {
        existingCreatedAt = existingData.createdAt;
      }
    }
  } catch {
    // continue
  }

  const completeProfile: InstitutionProfile = {
    ...profile,
    ownerUid: uid,
    ownerEmail: profile.ownerEmail || auth.currentUser?.email || '',
    stripeCustomerId: profile.stripeCustomerId || existingData.stripeCustomerId,
    stripeSubscriptionId: profile.stripeSubscriptionId || existingData.stripeSubscriptionId,
    stripeFinancialEmail: profile.stripeFinancialEmail || existingData.stripeFinancialEmail || profile.financialContactEmail,
    subscription: profile.subscription || existingData.subscription,
    invoices: profile.invoices || existingData.invoices || [],
    createdAt: existingCreatedAt,
    updatedAt: now,
  };

  // If new tenant without Stripe customer ID, automatically create Stripe customer with financial email and 30-day trial
  if (!completeProfile.stripeCustomerId && profile.financialContactEmail && profile.institutionName) {
    try {
      const res = await fetch('/api/billing/create-tenant-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantUid: uid,
          institutionName: profile.institutionName,
          financialContactEmail: profile.financialContactEmail,
          financialContactName: profile.financialContactName,
          financialContactPhone: profile.financialContactPhone,
          technicalContactEmail: profile.technicalContactEmail,
          institutionAddress: profile.institutionAddress,
          country: profile.country,
          countryCode: profile.countryCode,
        }),
      });

      if (res.ok) {
        const trialData = await res.json();
        if (trialData.success) {
          completeProfile.stripeCustomerId = trialData.stripeCustomerId;
          completeProfile.stripeSubscriptionId = trialData.stripeSubscriptionId;
          completeProfile.stripeFinancialEmail = trialData.stripeFinancialEmail || profile.financialContactEmail;

          if (!completeProfile.subscription) {
            completeProfile.subscription = {
              planId: trialData.planId || 'workspace_standard_unlimited',
              planName: trialData.planName || 'Workspace Standard Unlimited',
              status: 'TRIAL',
              billingCycle: 'MONTHLY',
              currentPrice: 0,
              isUnlimitedLicenses: true,
              startDate: trialData.trialStartDate || now,
              nextRenewalDate: trialData.trialEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              paymentMethod: {
                brand: '',
                last4: '',
                expiry: '',
                cardholder: '',
              },
              billingDetails: {
                fullName: profile.financialContactName || profile.institutionName,
                email: profile.financialContactEmail,
                taxId: '',
                address: profile.institutionAddress || '',
                city: '',
                state: '',
                zipCode: '',
                country: profile.country || 'Brasil',
                countryCode: profile.countryCode || 'BR',
              },
            };
          }
        }
      }
    } catch (stripeErr) {
      console.warn('[Stripe] Automated trial creation notice:', stripeErr);
    }
  }

  await setDoc(docRef, {
    ...completeProfile,
    _serverUpdatedAt: serverTimestamp(),
  }, { merge: true });

  return completeProfile;
}

export async function saveInstitutionBilling(
  uid: string,
  billingDetails: BillingDetails,
  subscription?: SubscriptionState,
  newInvoice?: Invoice
): Promise<{ billingDetails: BillingDetails; subscription?: SubscriptionState; invoices: Invoice[] }> {
  const docRef = doc(db, 'institutions', uid);
  const snap = await getDoc(docRef);
  const existingData = snap.exists() ? snap.data() : {};
  const existingInvoices: Invoice[] = existingData.invoices || [];

  const updatedInvoices = newInvoice
    ? [newInvoice, ...existingInvoices.filter((i) => i.id !== newInvoice.id)]
    : existingInvoices;

  const updatePayload: Record<string, any> = {
    billingDetails,
    updatedAt: new Date().toISOString(),
    _serverUpdatedAt: serverTimestamp(),
  };

  if (subscription) {
    updatePayload.subscription = subscription;
  }
  if (newInvoice || existingInvoices.length > 0) {
    updatePayload.invoices = updatedInvoices;
  }

  await setDoc(docRef, updatePayload, { merge: true });

  return {
    billingDetails,
    subscription: subscription || existingData.subscription,
    invoices: updatedInvoices,
  };
}

// Helper to identify legacy demo/mock tickets
const isDemoTicket = (t: SupportTicket): boolean => {
  if (!t) return true;
  const demoIds = ['tkt-hs-4081', 'tkt-hs-3920', 'tkt-hs-2844', 'HS-4081', 'HS-3920', 'HS-2844'];
  if (demoIds.includes(t.id) || demoIds.includes(t.protocol)) return true;
  if (
    t.subject?.includes('Validação de Registro MX') ||
    t.subject?.includes('Ativação do Add-on Gemini') ||
    t.subject?.includes('Política de Verificação em Duas Etapas')
  ) {
    return true;
  }
  return false;
};

// Clean text and sanitize tickets to eliminate unwanted references to payment processor and superadmins
import { cleanTicketText, sanitizeTicket } from './ticketSanitizer';
export { cleanTicketText, sanitizeTicket };

// Support Tickets Firestore & Local Persistence Helpers
export async function fetchInstitutionTickets(uid: string): Promise<SupportTicket[]> {
  let tickets: SupportTicket[] = [];
  let loadedFromFirestore = false;

  try {
    const docRef = doc(db, 'institutions', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.supportTickets)) {
        tickets = data.supportTickets as SupportTicket[];
        loadedFromFirestore = true;
      }
    }
  } catch (error) {
    console.warn('Erro ao buscar tickets no Firestore, recorrendo a storage local:', error);
  }

  // Fallback to localStorage if Firestore was empty
  if (!loadedFromFirestore || tickets.length === 0) {
    try {
      const local = localStorage.getItem(`skoolia_tickets_${uid}`);
      if (local) {
        tickets = JSON.parse(local);
      }
    } catch {
      // ignore
    }
  }

  // Purge any demo tickets and sanitize real tickets
  const cleaned = (tickets || [])
    .filter((t) => !isDemoTicket(t))
    .map((t) => sanitizeTicket(t));

  // If changes occurred, update storage
  const hadChanges = cleaned.length !== tickets.length || JSON.stringify(cleaned) !== JSON.stringify(tickets);
  if (hadChanges) {
    saveInstitutionTickets(uid, cleaned).catch((e) =>
      console.warn('Aviso ao sincronizar limpeza de tickets:', e)
    );
  }

  return cleaned;
}

export async function saveInstitutionTickets(uid: string, tickets: SupportTicket[]): Promise<SupportTicket[]> {
  try {
    localStorage.setItem(`skoolia_tickets_${uid}`, JSON.stringify(tickets));
  } catch {
    // ignore
  }

  try {
    const docRef = doc(db, 'institutions', uid);
    await setDoc(
      docRef,
      {
        supportTickets: tickets,
        updatedAt: new Date().toISOString(),
        _serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Aviso ao sincronizar tickets com Firestore:', error);
  }

  return tickets;
}

export { onAuthStateChanged };
export type { FirebaseUser };

