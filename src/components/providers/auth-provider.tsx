"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole, Profile } from "@/types/database.types";
import type { User, SupabaseClient } from "@supabase/supabase-js";
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
}

const STAFF_ROLES: UserRole[] = ["super_admin", "admin", "cashier", "chef"];
const MANAGER_ROLES: UserRole[] = ["super_admin", "admin"];

const AuthContext = createContext<AuthContextType | null>(null);

// Singleton client to avoid multiple instances
let supabaseClient: SupabaseClient<Database> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const supabase = getSupabaseClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Ignore abort errors silently
        if (error.message?.includes("aborted")) return null;
        console.error("Profile fetch error:", error.message);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    // Prevent double initialization in Strict Mode
    if (initializedRef.current) return;
    initializedRef.current = true;

    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!isMounted) return;

        setUser(authUser);
        userIdRef.current = authUser?.id ?? null;

        if (authUser) {
          const userProfile = await fetchProfile(authUser.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        }
      } catch {
        // Silently handle initialization errors
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      const currentUserId = currentUser?.id ?? null;

      // Only update if user actually changed (use ref to avoid stale closure)
      if (currentUserId !== userIdRef.current) {
        userIdRef.current = currentUserId;
        setUser(currentUser);

        if (currentUser) {
          // Show loading while fetching profile for new user
          setIsLoading(true);
          const userProfile = await fetchProfile(currentUser.id);
          if (isMounted) {
            setProfile(userProfile);
            setIsLoading(false);
          }
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

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
