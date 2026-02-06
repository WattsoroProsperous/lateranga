"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, ArrowLeft, Check, X, Clock, AlertTriangle, ChefHat, User, ShieldAlert, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createIngredientRequest, processIngredientRequest, approveWithdrawalRequest, rejectWithdrawalRequest } from "@/actions/stock.actions";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Ingredient } from "@/types";

interface IngredientRequestWithDetails {
  id: string;
  ingredient_id: string;
  requested_by: string | null;
  quantity: number;
  reason: string | null;
  notes: string | null;
  status: string;
  request_type: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string;
  ingredient: {
    id: string;
    name: string;
    unit: string;
    current_quantity: number;
  };
  requested_by_user?: {
    id: string;
    full_name: string;
  } | null;
  approved_by_user?: {
    id: string;
    full_name: string;
  } | null;
}

interface IngredientRequestsManagerProps {
  initialRequests: IngredientRequestWithDetails[];
  ingredients: Ingredient[];
}

const STOCK_UNITS = [
  { value: "unit", label: "Unite" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "l", label: "L" },
  { value: "ml", label: "ml" },
  { value: "piece", label: "piece" },
] as const;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUnitLabel(unit: string) {
  const found = STOCK_UNITS.find((u) => u.value === unit);
  return found ? found.label : unit;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          En attente
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <Check className="h-3 w-3" />
          Approuve
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <X className="h-3 w-3" />
          Rejete
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getRequestTypeBadge(type: string) {
  switch (type) {
    case "withdrawal_approval":
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
          <ShieldAlert className="h-3 w-3" />
          Retrait
        </Badge>
      );
    case "stock_request":
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <Package className="h-3 w-3" />
          Approvisionnement
        </Badge>
      );
  }
}

export function IngredientRequestsManager({
  initialRequests,
  ingredients,
}: IngredientRequestsManagerProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("pending");
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<IngredientRequestWithDetails | null>(null);
  const [processAction, setProcessAction] = useState<"approved" | "rejected">("approved");

  const [formData, setFormData] = useState({
    ingredient_id: "",
    quantity: 0,
    reason: "",
  });

  const canCreateRequest = user?.role === "chef" || user?.role === "admin" || user?.role === "super_admin";
  const canProcessRequest = user?.role === "admin" || user?.role === "super_admin";

  const filteredRequests = initialRequests.filter((request) => {
    if (activeTab === "all") return true;
    return request.status === activeTab;
  });

  const pendingCount = initialRequests.filter((r) => r.status === "pending").length;

  const handleNewRequest = () => {
    setFormData({
      ingredient_id: "",
      quantity: 0,
      reason: "",
    });
    setShowNewRequestDialog(true);
  };

  const handleProcess = (request: IngredientRequestWithDetails, action: "approved" | "rejected") => {
    setSelectedRequest(request);
    setProcessAction(action);
    setShowProcessDialog(true);
  };

  const submitNewRequest = () => {
    if (!formData.ingredient_id || formData.quantity <= 0) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    startTransition(async () => {
      const result = await createIngredientRequest({
        ingredient_id: formData.ingredient_id,
        quantity: formData.quantity,
        reason: formData.reason || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Demande envoyee");
      setShowNewRequestDialog(false);
      router.refresh();
    });
  };

  const submitProcess = () => {
    if (!selectedRequest) return;

    startTransition(async () => {
      let result;

      // Handle withdrawal approval requests differently
      if (selectedRequest.request_type === "withdrawal_approval") {
        if (processAction === "approved") {
          result = await approveWithdrawalRequest(selectedRequest.id);
        } else {
          result = await rejectWithdrawalRequest(selectedRequest.id);
        }
      } else {
        // Regular stock request
        result = await processIngredientRequest({
          id: selectedRequest.id,
          status: processAction,
        });
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        processAction === "approved"
          ? selectedRequest.request_type === "withdrawal_approval"
            ? "Retrait approuve - stock deduit"
            : "Demande approuvee - stock mis a jour"
          : "Demande rejetee"
      );
      setShowProcessDialog(false);
      router.refresh();
    });
  };

  const selectedIngredient = ingredients.find((i) => i.id === formData.ingredient_id);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/stock">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Demandes d'Ingredients</h1>
            <p className="text-muted-foreground">
              Gerez les demandes d'ingredients de la cuisine
            </p>
          </div>
        </div>
        {canCreateRequest && (
          <Button onClick={handleNewRequest}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Demande
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Approuvees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {initialRequests.filter((r) => r.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <X className="h-4 w-4" />
              Rejetees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {initialRequests.filter((r) => r.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                En Attente
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approuvees</TabsTrigger>
              <TabsTrigger value="rejected">Rejetees</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-center">Quantite</TableHead>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  {canProcessRequest && activeTab === "pending" && (
                    <TableHead className="text-center">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canProcessRequest && activeTab === "pending" ? 8 : 7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Aucune demande
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="text-sm">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell>
                        {getRequestTypeBadge(request.request_type)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.ingredient.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Stock actuel: {request.ingredient.current_quantity}{" "}
                            {getUnitLabel(request.ingredient.unit)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">
                          {request.quantity} {getUnitLabel(request.ingredient.unit)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {request.requested_by_user?.full_name || "Inconnu"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {request.reason || request.notes || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(request.status)}
                        {request.approved_by_user && (
                          <div className="text-xs text-muted-foreground mt-1">
                            par {request.approved_by_user.full_name}
                          </div>
                        )}
                      </TableCell>
                      {canProcessRequest && activeTab === "pending" && (
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleProcess(request, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => handleProcess(request, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Demande d'Ingredient</DialogTitle>
            <DialogDescription>
              Demandez un ingredient pour la preparation des plats
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ingredient">Ingredient</Label>
              <Select
                value={formData.ingredient_id}
                onValueChange={(value) => setFormData({ ...formData, ingredient_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez un ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={ingredient.id}>
                      {ingredient.name} (Stock: {ingredient.current_quantity}{" "}
                      {getUnitLabel(ingredient.unit)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantite demandee</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                  }
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12">
                  {selectedIngredient && getUnitLabel(selectedIngredient.unit)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Raison (optionnel)</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Pourquoi avez-vous besoin de cet ingredient?"
                rows={3}
              />
            </div>
            {selectedIngredient && formData.quantity > 0 && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Stock actuel: </span>
                  <span className="font-medium">
                    {selectedIngredient.current_quantity} {getUnitLabel(selectedIngredient.unit)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Apres approbation: </span>
                  <span
                    className={
                      selectedIngredient.current_quantity - formData.quantity < 0
                        ? "font-medium text-destructive"
                        : "font-medium"
                    }
                  >
                    {Math.max(0, selectedIngredient.current_quantity - formData.quantity)}{" "}
                    {getUnitLabel(selectedIngredient.unit)}
                  </span>
                </p>
                {selectedIngredient.current_quantity - formData.quantity <
                  selectedIngredient.min_threshold && (
                  <p className="text-sm text-orange-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Attention: Stock en dessous du seuil d'alerte
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={submitNewRequest}
              disabled={isPending || !formData.ingredient_id || formData.quantity <= 0}
            >
              {isPending ? "Envoi..." : "Envoyer la Demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processAction === "approved" ? "Approuver la Demande" : "Rejeter la Demande"}
            </DialogTitle>
            <DialogDescription>
              {processAction === "approved"
                ? "La quantite demandee sera deduite du stock."
                : "La demande sera marquee comme rejetee."}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <span className="text-muted-foreground">Ingredient: </span>
                  <span className="font-medium">{selectedRequest.ingredient.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Quantite: </span>
                  <span className="font-medium">
                    {selectedRequest.quantity} {getUnitLabel(selectedRequest.ingredient.unit)}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Demandeur: </span>
                  <span className="font-medium">
                    {selectedRequest.requested_by_user?.full_name || "Inconnu"}
                  </span>
                </p>
                {selectedRequest.reason && (
                  <p>
                    <span className="text-muted-foreground">Raison: </span>
                    <span>{selectedRequest.reason}</span>
                  </p>
                )}
                {processAction === "approved" && (
                  <>
                    <hr className="my-2" />
                    <p>
                      <span className="text-muted-foreground">Stock actuel: </span>
                      <span className="font-medium">
                        {selectedRequest.ingredient.current_quantity}{" "}
                        {getUnitLabel(selectedRequest.ingredient.unit)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Apres approbation: </span>
                      <span className="font-medium">
                        {Math.max(
                          0,
                          selectedRequest.ingredient.current_quantity - selectedRequest.quantity
                        )}{" "}
                        {getUnitLabel(selectedRequest.ingredient.unit)}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              Annuler
            </Button>
            <Button
              variant={processAction === "approved" ? "default" : "destructive"}
              onClick={submitProcess}
              disabled={isPending}
            >
              {isPending
                ? "Traitement..."
                : processAction === "approved"
                ? "Approuver"
                : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
