"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseTableRealtimeOptions {
  sessionId: string;
  onOrdersChange?: () => void;
  onSessionEnd?: () => void;
}

export function useTableRealtime({
  sessionId,
  onOrdersChange,
  onSessionEnd,
}: UseTableRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = supabaseRef.current;

    // Create a channel for this table session
    const channel = supabase.channel(`table-session-${sessionId}`);

    // Subscribe to order changes for this session
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `table_session_id=eq.${sessionId}`,
      },
      (payload) => {
        console.log("[Realtime] Order change:", payload.eventType);
        onOrdersChange?.();
      }
    );

    // Subscribe to session changes
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "table_sessions",
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        console.log("[Realtime] Session change:", payload);
        const newData = payload.new as { is_active?: boolean };
        if (newData.is_active === false) {
          onSessionEnd?.();
        }
      }
    );

    // Subscribe to channel
    channel.subscribe((status) => {
      console.log("[Realtime] Subscription status:", status);
    });

    channelRef.current = channel;

    return cleanup;
  }, [sessionId, onOrdersChange, onSessionEnd, cleanup]);

  return { cleanup };
}
