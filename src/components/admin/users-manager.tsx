"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserCog, Shield, Trash2, Search, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateUserRole, createStaffUser, deleteUser } from "@/actions/user.actions";
import type { Profile, UserRole } from "@/types/database.types";
import { SuperAdminOnly } from "@/components/auth/role-guard";
import { ROLE_LABELS } from "@/lib/auth/permissions";

interface UsersManagerProps {
  initialUsers: Profile[];
}

const roleColors: Record<UserRole, string> = {
  super_admin: "bg-red-500/10 text-red-600 border-red-200",
  admin: "bg-purple-500/10 text-purple-600 border-purple-200",
  cashier: "bg-blue-500/10 text-blue-600 border-blue-200",
  chef: "bg-orange-500/10 text-orange-600 border-orange-200",
  customer: "bg-gray-500/10 text-gray-600 border-gray-200",
};

const STAFF_ROLES: UserRole[] = ["admin", "cashier", "chef"];

export function UsersManager({ initialUsers }: UsersManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<Profile | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "cashier" as UserRole,
  });

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caracteres");
      return;
    }

    startTransition(async () => {
      const result = await createStaffUser({
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        phone: newUser.phone || undefined,
        role: newUser.role,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Utilisateur cree avec succes");
      setShowAddDialog(false);
      setNewUser({ email: "", password: "", full_name: "", phone: "", role: "cashier" });
      router.refresh();
    });
  };

  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Role mis a jour");
      setShowEditDialog(null);
      router.refresh();
    });
  };

  const handleDeleteUser = (user: Profile) => {
    if (!confirm(`Supprimer l'utilisateur "${user.full_name}" ? Cette action est irreversible.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Utilisateur supprime");
      router.refresh();
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CI", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Staff</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold text-purple-600">
            {users.filter((u) => u.role === "admin" || u.role === "super_admin").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Caissiers</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter((u) => u.role === "cashier").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Chefs</p>
          <p className="text-2xl font-bold text-orange-600">
            {users.filter((u) => u.role === "chef").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Super Admins</p>
          <p className="text-2xl font-bold text-red-600">
            {users.filter((u) => u.role === "super_admin").length}
          </p>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou telephone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="size-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cree le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name || "Sans nom"}</p>
                      <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="size-3" />
                      {user.phone}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium", roleColors[user.role])}>
                    <Shield className="size-3 mr-1" />
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowEditDialog(user)}
                      disabled={isPending}
                    >
                      <UserCog className="size-4" />
                    </Button>
                    <SuperAdminOnly>
                      {user.role !== "super_admin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user)}
                          disabled={isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </SuperAdminOnly>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouve
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Creer un nouveau compte pour un membre du personnel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nom complet *</label>
              <Input
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="jean@lateranga.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mot de passe *</label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Minimum 6 caracteres"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telephone</label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="+225 07 00 00 00 00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser({ ...newUser, role: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddUser} disabled={isPending}>
              Creer l&apos;utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!showEditDialog} onOpenChange={() => setShowEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le role</DialogTitle>
            <DialogDescription>
              Modifier le role de {showEditDialog?.full_name}
            </DialogDescription>
          </DialogHeader>
          {showEditDialog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {showEditDialog.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{showEditDialog.full_name}</p>
                  <p className="text-sm text-muted-foreground">{showEditDialog.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Nouveau role</label>
                <Select
                  value={showEditDialog.role}
                  onValueChange={(v) => handleUpdateRole(showEditDialog.id, v as UserRole)}
                  disabled={isPending || showEditDialog.role === "super_admin"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showEditDialog.role === "super_admin" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Le role Super Admin ne peut pas etre modifie
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
