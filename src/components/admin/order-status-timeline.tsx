"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OrderStatusTimelineProps {
  currentStatus: string;
  orderType: string;
}

const allStatuses = [
  { key: "pending", label: "En attente" },
  { key: "confirmed", label: "Confirmee" },
  { key: "preparing", label: "En preparation" },
  { key: "ready", label: "Prete" },
  { key: "delivering", label: "En livraison" },
  { key: "completed", label: "Terminee" },
];

export function OrderStatusTimeline({ currentStatus, orderType }: OrderStatusTimelineProps) {
  // Filter out "delivering" for non-delivery orders
  const statuses = orderType === "livraison"
    ? allStatuses
    : allStatuses.filter((s) => s.key !== "delivering");

  const currentIndex = statuses.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg">
        <span className="font-semibold">Commande annulee</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {statuses.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={status.key} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isCurrent && "bg-primary border-primary text-primary-foreground",
                  isPending && "bg-muted border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="size-5" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[80px]",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {status.label}
              </span>
            </div>

            {/* Connector line */}
            {index < statuses.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2",
                  index < currentIndex ? "bg-green-500" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
