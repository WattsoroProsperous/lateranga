"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole, Profile } from "@/types/database.types";
import type { User, SupabaseClient, AuthChangeEvent } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  isManager: boolean;
  supabase: SupabaseClient<Database>;
  refreshProfile: () => Promise<void>;
  setUserAndProfile: (user: User | null, profile?: Profile | null) => void;
}

const STAFF_ROLES: UserRole[] = ["super_admin", "admin", "cashier", "chef"];
const MANAGER_ROLES: UserRole[] = ["super_admin", "admin"];

const AuthContext = createContext<AuthContextType | null>(null);

// Create client once at module level
const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profile fetch error:", error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Profile fetch exception:", err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const newProfile = await fetchProfile(user.id);
    setProfile(newProfile);
  }, [user, fetchProfile]);

  // Allow login form to set user and profile directly to avoid race conditions
  const setUserAndProfile = useCallback((newUser: User | null, newProfile?: Profile | null) => {
    setUser(newUser);
    setProfile(newProfile ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Handler for auth state changes
    const handleAuthChange = async (event: AuthChangeEvent, currentUser: User | null) => {
      if (!isMounted) return;

      console.log("[Auth] Event:", event, "User:", currentUser?.email ?? "none");

      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchProfile(currentUser.id);
        if (isMounted) {
          setProfile(userProfile);
        }
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleAuthChange("INITIAL_SESSION", session?.user ?? null);
      } catch (err) {
        console.error("[Auth] Init error:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip INITIAL_SESSION as we handle it above
        if (event === "INITIAL_SESSION") return;
        await handleAuthChange(event, session?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const role = profile?.role ?? null;

  const value: AuthContextType = {
    user,
    profile,
    role,
    isLoading,
    isAuthenticated: !!user,
    isStaff: role !== null && STAFF_ROLES.includes(role),
    isManager: role !== null && MANAGER_ROLES.includes(role),
    supabase,
    refreshProfile,
    setUserAndProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
