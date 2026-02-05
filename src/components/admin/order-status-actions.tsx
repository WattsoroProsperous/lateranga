"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/order.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Check,
  ChefHat,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: string;
  orderType: string;
}

export function OrderStatusActions({
  orderId,
  currentStatus,
  orderType,
}: OrderStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateOrderStatus({
        id: orderId,
        status: newStatus,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Statut mis a jour: ${newStatus}`);
      router.refresh();
    });
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error("Veuillez indiquer une raison d'annulation");
      return;
    }

    startTransition(async () => {
      const result = await updateOrderStatus({
        id: orderId,
        status: "cancelled",
        cancellation_reason: cancelReason,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Commande annulee");
      setCancelDialogOpen(false);
      router.refresh();
    });
  };

  if (currentStatus === "completed" || currentStatus === "cancelled") {
    return null;
  }

  const getNextActions = () => {
    switch (currentStatus) {
      case "pending":
        return [
          { status: "confirmed", label: "Confirmer", icon: Check, variant: "default" as const },
        ];
      case "confirmed":
        return [
          { status: "preparing", label: "En preparation", icon: ChefHat, variant: "default" as const },
        ];
      case "preparing":
        return [
          { status: "ready", label: "Prete", icon: PackageCheck, variant: "default" as const },
        ];
      case "ready":
        if (orderType === "livraison") {
          return [
            { status: "delivering", label: "En livraison", icon: Truck, variant: "default" as const },
          ];
        }
        return [
          { status: "completed", label: "Terminee", icon: CheckCircle2, variant: "default" as const },
        ];
      case "delivering":
        return [
          { status: "completed", label: "Livree", icon: CheckCircle2, variant: "default" as const },
        ];
      default:
        return [];
    }
  };

  const actions = getNextActions();

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <Button
            key={action.status}
            onClick={() => handleStatusChange(action.status)}
            disabled={isPending}
            variant={action.variant}
          >
            {isPending ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <action.icon className="size-4 mr-2" />
            )}
            {action.label}
          </Button>
        ))}

        <Button
          onClick={() => setCancelDialogOpen(true)}
          disabled={isPending}
          variant="destructive"
        >
          <XCircle className="size-4 mr-2" />
          Annuler
        </Button>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la commande</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">
              Raison de l&apos;annulation *
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Client a demande l'annulation..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isPending}
            >
              Retour
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : null}
              Confirmer l&apos;annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
