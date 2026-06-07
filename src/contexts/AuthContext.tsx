'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Cache configuration
const PROFILE_CACHE_KEY = 'user_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface ProfileCache {
  profile: UserProfile;
  timestamp: number;
  userId: string;
}

// Profile cache utilities
const saveProfileToCache = (profile: UserProfile, userId: string) => {
  try {
    const cache: ProfileCache = {
      profile,
      timestamp: Date.now(),
      userId,
    };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
    console.log('Profile cached successfully');
  } catch (error) {
    console.error('Error saving profile to cache:', error);
  }
};

const getProfileFromCache = (userId: string): UserProfile | null => {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) {
      console.log('No cached profile found');
      return null;
    }

    const cache: ProfileCache = JSON.parse(cached);
    
    // Check if cache is for the same user
    if (cache.userId !== userId) {
      console.log('Cached profile is for different user, ignoring');
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    // Check if cache is still valid (within TTL)
    const age = Date.now() - cache.timestamp;
    if (age > PROFILE_CACHE_TTL) {
      console.log(`Cached profile expired (age: ${Math.round(age / 1000)}s)`);
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    console.log(`Using cached profile (age: ${Math.round(age / 1000)}s)`);
    return cache.profile;
  } catch (error) {
    console.error('Error reading profile from cache:', error);
    localStorage.removeItem(PROFILE_CACHE_KEY);
    return null;
  }
};

const clearProfileCache = () => {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
    console.log('Profile cache cleared');
  } catch (error) {
    console.error('Error clearing profile cache:', error);
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, useCache: boolean = true): Promise<UserProfile | null> => {
    try {
      // Try to get from cache first if allowed
      if (useCache) {
        const cachedProfile = getProfileFromCache(userId);
        if (cachedProfile) {
          // Check if cached profile shows user is blocked
          if (cachedProfile.is_blocked) {
            console.log('Cached profile shows user is blocked, signing out...');
            await supabase.auth.signOut();
            clearProfileCache();
            return null;
          }
          return cachedProfile;
        }
      }

      // Fetch from database with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('User profile fetch timed out after 2.5 seconds'));
        }, 2500);
      });

      const { data, error } = await Promise.race([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        timeoutPromise
      ]);

      const profile = data as UserProfile;
      console.log('User profile fetched from database');
      
      // Check if user is blocked
      if (profile.is_blocked) {
        console.log('User is blocked, signing out...');
        await supabase.auth.signOut();
        clearProfileCache();
        return null;
      }
      
      // Save to cache
      saveProfileToCache(profile, userId);
      
      return profile;
    } catch (error) {
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      // Force fetch from database (bypass cache)
      const profile = await fetchUserProfile(user.id, false);
      if (profile) {
        setUserProfile(profile);
        // Broadcast update to other tabs
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profile-updated', { detail: profile }));
        }
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Listen for profile updates from other tabs
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<UserProfile>;
      if (customEvent.detail && mounted) {
        console.log('Profile updated in another tab, syncing...');
        setUserProfile(customEvent.detail);
      }
    };

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === PROFILE_CACHE_KEY && mounted) {
        if (event.newValue) {
          try {
            const cache: ProfileCache = JSON.parse(event.newValue);
            // Get current user from state to avoid stale closure
            setUser((currentUser) => {
              if (currentUser && cache.userId === currentUser.id) {
                console.log('Profile cache updated in another tab, syncing...');
                setUserProfile(cache.profile);
              }
              return currentUser; // Don't modify user state
            });
          } catch (error) {
            console.error('Error parsing profile cache from storage event:', error);
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('profile-updated', handleProfileUpdate);
      window.addEventListener('storage', handleStorageChange);
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log('Component unmounted, aborting auth initialization');
          return;
        }

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('Session retrieved:', session ? 'User logged in' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Fetching user profile for user:', session.user.id);
          // Use cache on initial load for faster startup
          const profile = await fetchUserProfile(session.user.id, true);
          if (mounted) {
            if (profile) {
              console.log('Setting user profile');
              setUserProfile(profile);
            } else {
              console.warn('Profile fetch returned null, not setting profile');
            }
          }
        } else {
          // Clear cache when no session
          clearProfileCache();
        }
        
        if (mounted) {
          console.log('Auth initialization complete, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          console.log('Error occurred, setting loading to false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, 'User ID:', session?.user?.id);

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // On sign in, fetch fresh profile (bypass cache)
        const useCache = event !== 'SIGNED_IN';
        const profile = await fetchUserProfile(session.user.id, useCache);
        if (mounted) {
          if (profile) {
            console.log('Setting user profile:', profile);
            setUserProfile(profile);
          } else {
            console.warn('Failed to fetch user profile, keeping existing profile');
          }
        }
      } else {
        console.log('No session, clearing user profile and cache');
        setUserProfile(null);
        clearProfileCache();
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('profile-updated', handleProfileUpdate);
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      // Clear profile cache on sign out
      clearProfileCache();
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || 'http://localhost:3000/reset-password',
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};