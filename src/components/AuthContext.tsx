import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider, handleFirestoreError, OperationType } from '../firebase';
import { Profile } from '../types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  onboardingCompleted: boolean;
  toasts: Toast[];
  blockedUsers: string[];
  blockedByUsers: string[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshProfile: () => Promise<void>;
  refreshBlocks: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [blockedByUsers, setBlockedByUsers] = useState<string[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchProfile = async (uid: string): Promise<Profile | null> => {
    const path = `profiles/${uid}`;
    try {
      const docRef = doc(db, 'profiles', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid,
          username: data.username,
          university: data.university,
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          interests: data.interests || [],
          onboarding_completed: data.onboarding_completed ?? false,
          notification_settings: data.notification_settings,
          privacy_settings: data.privacy_settings,
        };
      }
      return null;
    } catch (err) {
      // Use standard skill-required error handler
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.uid);
      setProfile(p);
      setOnboardingCompleted(p ? p.onboarding_completed : false);
    }
  };

  const refreshBlocks = async () => {
    if (!user) {
      setBlockedUsers([]);
      setBlockedByUsers([]);
      return;
    }
    try {
      const qBlocked = query(collection(db, 'blocks'), where('blocker_id', '==', user.uid));
      const qBlockedBy = query(collection(db, 'blocks'), where('blocked_id', '==', user.uid));
      const [blockedSnap, blockedBySnap] = await Promise.all([
        getDocs(qBlocked),
        getDocs(qBlockedBy)
      ]);
      setBlockedUsers(blockedSnap.docs.map(doc => doc.data().blocked_id));
      setBlockedByUsers(blockedBySnap.docs.map(doc => doc.data().blocker_id));
    } catch (err) {
      console.error("Error loading blocks list:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'profiles', currentUser.uid);
        const qBlocked = query(collection(db, 'blocks'), where('blocker_id', '==', currentUser.uid));
        const qBlockedBy = query(collection(db, 'blocks'), where('blocked_id', '==', currentUser.uid));
        
        try {
          const [profileSnap, blockedSnap, blockedBySnap] = await Promise.all([
            getDoc(docRef),
            getDocs(qBlocked),
            getDocs(qBlockedBy)
          ]);
          
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            const p = {
              uid: currentUser.uid,
              username: data.username,
              university: data.university,
              bio: data.bio || '',
              avatar_url: data.avatar_url || '',
              interests: data.interests || [],
              onboarding_completed: data.onboarding_completed ?? false,
              notification_settings: data.notification_settings,
              privacy_settings: data.privacy_settings,
            };
            setProfile(p);
            setOnboardingCompleted(p.onboarding_completed);
          } else {
            setProfile(null);
            setOnboardingCompleted(false);
          }
          
          setBlockedUsers(blockedSnap.docs.map(d => d.data().blocked_id));
          setBlockedByUsers(blockedBySnap.docs.map(d => d.data().blocker_id));
        } catch (err) {
          console.error("Error initializing auth state:", err);
          setProfile(null);
          setOnboardingCompleted(false);
        }
      } else {
        setProfile(null);
        setOnboardingCompleted(false);
        setBlockedUsers([]);
        setBlockedByUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Logged in with Google!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to login with Google', 'error');
    }
  };

  const loginWithApple = async () => {
    try {
      await signInWithPopup(auth, appleProvider);
      showToast('Logged in with Apple!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to login with Apple', 'error');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setOnboardingCompleted(false);
      showToast('Signed out successfully', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to sign out', 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        onboardingCompleted,
        toasts,
        blockedUsers,
        blockedByUsers,
        showToast,
        removeToast,
        refreshProfile,
        refreshBlocks,
        loginWithGoogle,
        loginWithApple,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
