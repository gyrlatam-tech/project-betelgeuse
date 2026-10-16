import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  auth,
  loginWithGoogleRedirect,
  loginWithGooglePopup,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  fetchInstitutionProfile,
  saveInstitutionProfile,
  onAuthStateChanged,
  subscribeInstitutionProfile,
  tenantStatusChannel,
  checkRedirectResult,
  type FirebaseUser,
} from '../lib/firebase';
import type { InstitutionProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  institution: InstitutionProfile | null;
  loading: boolean;
  isProfileComplete: boolean;
  isSuperAdmin: boolean;
  redirectError: string | null;
  isRedirecting: boolean;
  storageBlockedFallback: boolean;
  clearRedirectError: () => void;
  loginWithGoogleProvider: () => Promise<void>;
  loginWithGooglePopupProvider: () => Promise<FirebaseUser>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<FirebaseUser>;
  signupWithEmailPassword: (
    email: string,
    pass: string,
    institutionData: Omit<InstitutionProfile, 'ownerUid' | 'ownerEmail' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ user: FirebaseUser; institution: InstitutionProfile }>;
  submitInstitutionProfile: (
    institutionData: Omit<InstitutionProfile, 'ownerUid' | 'ownerEmail' | 'createdAt' | 'updatedAt'>,
    isNewRegistration?: boolean
  ) => Promise<InstitutionProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SUPERADMIN_EMAILS = [
  'gyrlatam@gmail.com',
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [institution, setInstitution] = useState<InstitutionProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [storageBlockedFallback, setStorageBlockedFallback] = useState<boolean>(false);

  // Check if user is platform SuperAdmin (all normal new accounts are isolated tenants)
  const isSuperAdmin = Boolean(
    (user?.email && SUPERADMIN_EMAILS.includes(user.email.toLowerCase().trim())) ||
      institution?.role === 'SUPER_ADMIN'
  );

  // Check if profile is complete (SuperAdmin is always complete; normal schools must provide address and phone)
  const isProfileComplete = isSuperAdmin || Boolean(
    institution &&
      institution.institutionName?.trim() &&
      institution.institutionPhone?.trim() &&
      institution.institutionAddress?.trim() &&
      institution.technicalContactName?.trim() &&
      institution.financialContactName?.trim()
  );

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setInstitution(null);
      return;
    }
    try {
      const prof = await fetchInstitutionProfile(user.uid, user.email);
      setInstitution(prof);
    } catch (e) {
      console.error('Erro ao atualizar perfil da instituição:', e);
    }
  }, [user]);

  const liveProfileUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;
    let authStateUnsubscribe: (() => void) | null = null;

    // Safety timeout: ensure loading is NEVER stuck true forever (prevents blank screen)
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading((prev) => (prev ? false : prev));
      }
    }, 2800);

    const runAuthResolution = async () => {
      const wasRedirectInProgress =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('auth_redirect_in_progress') === 'true';

      // Step 1: Subscribe immediately to onAuthStateChanged so the app gets auth state without delay
      authStateUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!isMounted) return;
        setUser(currentUser);

        // Clean up previous real-time profile subscription
        if (liveProfileUnsubRef.current) {
          liveProfileUnsubRef.current();
          liveProfileUnsubRef.current = null;
        }

        if (currentUser) {
          try {
            const profile = await fetchInstitutionProfile(currentUser.uid, currentUser.email);
            const isSuperAdminEmail =
              currentUser.email && SUPERADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim());

            if (!profile && isSuperAdminEmail) {
              const superAdminProfile: InstitutionProfile = {
                ownerUid: currentUser.uid,
                ownerEmail: currentUser.email || '',
                institutionName: 'skoolia Global Administration',
                institutionEmail: currentUser.email || '',
                institutionPhone: '+55 11 99999-9999',
                institutionAddress: 'Av. Paulista, 1000, São Paulo - SP',
                technicalContactName: currentUser.displayName || 'Super Admin skoolia',
                technicalContactEmail: currentUser.email || '',
                technicalContactPhone: '+55 11 99999-9999',
                financialContactName: currentUser.displayName || 'Super Admin Financeiro',
                financialContactEmail: currentUser.email || '',
                financialContactPhone: '+55 11 99999-9999',
                studentsCount: 10000,
                teachersCount: 500,
                role: 'SUPER_ADMIN',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              try {
                await saveInstitutionProfile(currentUser.uid, superAdminProfile);
                setInstitution(superAdminProfile);
              } catch {
                setInstitution(superAdminProfile);
              }
            } else if (profile && isSuperAdminEmail && profile.role !== 'SUPER_ADMIN') {
              const updatedProfile: InstitutionProfile = { ...profile, role: 'SUPER_ADMIN' };
              setInstitution(updatedProfile);
              saveInstitutionProfile(currentUser.uid, updatedProfile).catch(() => {});
            } else if (!profile && !isSuperAdminEmail) {
              // Automatically register initial institution profile so SuperAdmin immediately sees this new school
              const defaultName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Nova Instituição');
              const domainPart = currentUser.email ? currentUser.email.split('@')[1] : '';
              const isGeneric = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(domainPart.toLowerCase());
              const newSchoolProfile: InstitutionProfile = {
                ownerUid: currentUser.uid,
                ownerEmail: currentUser.email || '',
                institutionName: defaultName,
                institutionEmail: currentUser.email || '',
                institutionPhone: '',
                institutionAddress: '',
                technicalContactName: currentUser.displayName || defaultName,
                technicalContactEmail: currentUser.email || '',
                technicalContactPhone: '',
                financialContactName: currentUser.displayName || defaultName,
                financialContactEmail: currentUser.email || '',
                financialContactPhone: '',
                studentsCount: 0,
                teachersCount: 0,
                role: 'TENANT_ADMIN',
                status: 'TRIAL',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              try {
                const saved = await saveInstitutionProfile(currentUser.uid, newSchoolProfile);
                setInstitution(saved);
              } catch (e) {
                setInstitution(newSchoolProfile);
              }
            } else {
              setInstitution(profile);
            }

            // Attach Live Real-time Firestore onSnapshot listener to institution doc
            liveProfileUnsubRef.current = subscribeInstitutionProfile(currentUser.uid, (updatedProfile) => {
              if (updatedProfile && isMounted) {
                setInstitution((prev) => {
                  if (!prev) return updatedProfile;
                  return {
                    ...prev,
                    ...updatedProfile,
                    status: updatedProfile.status || prev.status,
                    suspendedReason: updatedProfile.suspendedReason,
                  };
                });
              }
            });
          } catch (err) {
            console.warn('Aviso ao recuperar perfil institucional:', err);
            setInstitution(null);
          }
        } else {
          setInstitution(null);
        }

        // Auth state is now confirmed: complete loading
        if (isMounted) {
          setLoading(false);
        }
      });

      // Step 2: If returning from redirect, process result with protection
      if (wasRedirectInProgress) {
        try {
          const userFromRedirect = await checkRedirectResult();
          if (userFromRedirect && isMounted) {
            setUser(userFromRedirect);
            try {
              sessionStorage.removeItem('auth_redirect_in_progress');
            } catch {}
            const profile = await fetchInstitutionProfile(userFromRedirect.uid);
            if (isMounted) setInstitution(profile);
            if (isMounted) setLoading(false);
          } else if (isMounted) {
            setStorageBlockedFallback(true);
            try {
              sessionStorage.removeItem('auth_redirect_in_progress');
            } catch {}
          }
        } catch (err: any) {
          console.warn('[Firebase Auth] Redirection check error:', err);
          if (isMounted) {
            setStorageBlockedFallback(true);
            try {
              sessionStorage.removeItem('auth_redirect_in_progress');
            } catch {}
          }
        }
      }
    };

    runAuthResolution();

    // 2. Real-time Multi-Tab Broadcast & Custom Event Listener for instant Block/Unblock
    const handleLiveStatusMessage = (msg: any) => {
      if (!msg) return;
      const targetTenantId = msg.tenantId?.replace(/^tenant-/, '');
      setInstitution((prev) => {
        if (!prev) return prev;
        const currentUid = prev.ownerUid || prev.id || user?.uid;
        if (
          !targetTenantId ||
          targetTenantId === currentUid ||
          targetTenantId === user?.uid ||
          msg.tenantId === prev.id ||
          msg.tenantId === `tenant-${currentUid}`
        ) {
          return {
            ...prev,
            status: msg.status,
            suspendedReason: msg.status === 'SUSPENDED' ? msg.suspendedReason || prev.suspendedReason : undefined,
            subscription: prev.subscription
              ? { ...prev.subscription, status: msg.status === 'SUSPENDED' ? 'PAST_DUE' : 'ACTIVE' }
              : prev.subscription,
          };
        }
        return prev;
      });
    };

    if (tenantStatusChannel) {
      tenantStatusChannel.onmessage = (e) => handleLiveStatusMessage(e.data);
    }

    const handleCustomDomEvent = (e: any) => handleLiveStatusMessage(e.detail);
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'skoolia_tenant_status_broadcast' && e.newValue) {
        try {
          handleLiveStatusMessage(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('skoolia_tenant_status_change', handleCustomDomEvent);
      window.addEventListener('storage', handleStorageEvent);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      if (authStateUnsubscribe) {
        authStateUnsubscribe();
      }
      if (liveProfileUnsubRef.current) {
        liveProfileUnsubRef.current();
        liveProfileUnsubRef.current = null;
      }
      if (tenantStatusChannel) {
        tenantStatusChannel.onmessage = null;
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('skoolia_tenant_status_change', handleCustomDomEvent);
        window.removeEventListener('storage', handleStorageEvent);
      }
    };
  }, [user?.uid]);

  const clearRedirectError = useCallback(() => {
    setRedirectError(null);
  }, []);

  const loginWithGoogleProvider = async () => {
    setLoading(true);
    setRedirectError(null);
    try {
      setIsRedirecting(true);
      await loginWithGoogleRedirect();
      // Browser navigates away to Google
    } catch (err: any) {
      setLoading(false);
      setIsRedirecting(false);
      if (err?.code === 'auth/unauthorized-domain') {
        console.error(
          '[Firebase Auth] auth/unauthorized-domain: Configure skoolia.net em Firebase Authentication > Settings > Authorized domains.'
        );
        setRedirectError('Domínio skoolia.net não autorizado no Firebase Console. Adicione aos Domínios Autorizados no Firebase Authentication.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        console.error('[Firebase Auth] auth/operation-not-allowed: Provedor Google não está ativado no Firebase Console.');
        setRedirectError('Provedor Google não está ativado no Firebase Console.');
      } else {
        console.error('[Firebase Auth] Erro ao redirecionar para o Google:', err);
        setRedirectError(err?.message || 'Falha ao iniciar redirecionamento com Google.');
      }
      throw err;
    }
  };

  const loginWithGooglePopupProvider = async () => {
    setLoading(true);
    setRedirectError(null);
    try {
      const loggedUser = await loginWithGooglePopup();
      setUser(loggedUser);
      const profile = await fetchInstitutionProfile(loggedUser.uid);
      setInstitution(profile);
      setLoading(false);
      return loggedUser;
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const loggedUser = await loginWithEmail(email, pass);
      const profile = await fetchInstitutionProfile(loggedUser.uid);
      setInstitution(profile);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmailPassword = async (
    email: string,
    pass: string,
    institutionData: Omit<InstitutionProfile, 'ownerUid' | 'ownerEmail' | 'createdAt' | 'updatedAt'>
  ) => {
    setLoading(true);
    try {
      const newUser = await registerWithEmail(email, pass);
      const savedProfile = await saveInstitutionProfile(newUser.uid, {
        ...institutionData,
        ownerEmail: newUser.email || email,
      });
      setInstitution(savedProfile);

      // Trigger welcome email with current language preference
      try {
        const currentLang =
          (typeof localStorage !== 'undefined' ? localStorage.getItem('skoolia_language') : null) || 'pt';
        fetch('/api/auth/register-notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-language': currentLang,
            'x-user-role': isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN',
            'x-superadmin': isSuperAdmin ? 'true' : 'false',
          },
          body: JSON.stringify({
            email: newUser.email || email,
            name: institutionData.technicalContactName || institutionData.institutionName,
            institutionName: institutionData.institutionName,
            country: institutionData.country,
            phone: institutionData.technicalContactPhone || (institutionData as any).phone || '',
            preferredLanguage: currentLang,
            lang: currentLang,
            createdBySuperAdmin: isSuperAdmin,
            skipWelcomeEmail: isSuperAdmin,
          }),
        }).catch(() => {});
      } catch (_) {}

      return { user: newUser, institution: savedProfile };
    } finally {
      setLoading(false);
    }
  };

  const submitInstitutionProfile = async (
    institutionData: Omit<InstitutionProfile, 'ownerUid' | 'ownerEmail' | 'createdAt' | 'updatedAt'>,
    isNewRegistration?: boolean
  ) => {
    if (!user) throw new Error('Usuário não autenticado.');
    setLoading(true);
    try {
      const isActuallyNew =
        isNewRegistration ??
        (!institution || !institution.institutionName || !institution.technicalContactName);

      const saved = await saveInstitutionProfile(user.uid, {
        ...institutionData,
        ownerEmail: user.email || '',
      });
      setInstitution(saved);

      // Trigger Welcome Email & SuperAdmin Notification for newly registered tenants
      if (isActuallyNew && !isSuperAdmin) {
        const currentLang =
          institutionData.preferredLanguage ||
          (typeof localStorage !== 'undefined' ? localStorage.getItem('skoolia_language') : null) ||
          'pt';

        const contactEmail = (user.email || institutionData.technicalContactEmail || institutionData.institutionEmail || '').trim();
        const contactName = institutionData.technicalContactName || institutionData.institutionName || 'Administrador';
        const contactPhone = institutionData.technicalContactPhone || institutionData.institutionPhone || '';

        // 1. Notify Backend: Send Welcome email to the tenant + Notify SuperAdmin gyrlatam@gmail.com
        try {
          fetch('/api/auth/register-notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-app-language': currentLang,
            },
            body: JSON.stringify({
              email: contactEmail,
              name: contactName,
              institutionName: institutionData.institutionName,
              country: institutionData.country || 'Brasil',
              phone: contactPhone,
              preferredLanguage: currentLang,
              lang: currentLang,
              tenantId: `tenant-${user.uid}`,
              plan: 'Degustação (30 Dias)',
              createdBySuperAdmin: false,
              skipWelcomeEmail: false,
            }),
          }).catch((err) => console.warn('Aviso ao notificar registro de novo tenant:', err));
        } catch (_) {}

        // 2. Register into backend multiTenantData & initialize Stripe trial
        try {
          fetch('/api/tenants', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': 'ADMIN',
            },
            body: JSON.stringify({
              id: `tenant-${user.uid}`,
              name: institutionData.institutionName,
              primaryContactEmail: contactEmail,
              financialContactEmail: institutionData.financialContactEmail || contactEmail,
              country: institutionData.country,
              phone: contactPhone,
              technicalContactName: contactName,
              status: 'TRIAL',
              preferredLanguage: currentLang,
              createdBySuperAdmin: false,
              skipWelcomeEmail: true, // Welcome email already handled by register-notify
            }),
          }).catch((err) => console.warn('Aviso ao sincronizar tenant com backend:', err));
        } catch (_) {}
      }

      return saved;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setInstitution(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        institution,
        loading,
        isProfileComplete,
        isSuperAdmin,
        redirectError,
        isRedirecting,
        storageBlockedFallback,
        clearRedirectError,
        loginWithGoogleProvider,
        loginWithGooglePopupProvider,
        loginWithEmailPassword,
        signupWithEmailPassword,
        submitInstitutionProfile,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
