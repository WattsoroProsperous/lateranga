"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, canManageUsers } from "@/lib/supabase/admin";
import type { UserRole, Profile } from "@/types/database.types";

export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const canManage = await canManageUsers();
  if (!canManage) {
    return { success: false, error: "Permission refusee" };
  }

  // Prevent changing super_admin role
  const adminClient = createAdminClient();
  const { data: currentUser } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (currentUser?.role === "super_admin") {
    return { success: false, error: "Impossible de modifier le role d'un Super Admin" };
  }

  const { error } = await adminClient
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function createStaffUser(input: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
}): Promise<{ user?: Profile; error?: string }> {
  const canManage = await canManageUsers();
  if (!canManage) {
    return { error: "Permission refusee" };
  }

  // Prevent creating super_admin
  if (input.role === "super_admin") {
    return { error: "Impossible de creer un Super Admin" };
  }

  const adminClient = createAdminClient();

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      phone: input.phone,
    },
  });

  if (authError) {
    console.error("Error creating auth user:", authError);
    if (authError.message.includes("already")) {
      return { error: "Cet email est deja utilise" };
    }
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la creation de l'utilisateur" };
  }

  // Update profile with role (profile is created by trigger)
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .update({
      full_name: input.full_name,
      phone: input.phone || null,
      role: input.role,
    })
    .eq("id", authData.user.id)
    .select()
    .single();

  if (profileError) {
    console.error("Error updating profile:", profileError);
    // Try to clean up auth user
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin/users");
  return { user: profile };
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const canManage = await canManageUsers();
  if (!canManage) {
    return { success: false, error: "Permission refusee" };
  }

  const adminClient = createAdminClient();

  // Check if trying to delete super_admin
  const { data: user } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (user?.role === "super_admin") {
    return { success: false, error: "Impossible de supprimer un Super Admin" };
  }

  // Delete from auth (cascade will delete profile)
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getAllUsers(): Promise<Profile[]> {
  const adminClient = createAdminClient();
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return profiles ?? [];
}

export async function getUserById(userId: string): Promise<Profile | null> {
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return profile;
}
