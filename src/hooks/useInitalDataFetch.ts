import { supabase } from "@/supabase/client";
import type { ConversationRow, MessageRow } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { useEffect, useRef } from "react";

type ConversationsPageResponse = {
  conversations: (ConversationRow & { last_message_at: string | null })[];
  messages: MessageRow[];
};

// A conversation with no messages at all sorts last (nulls last) — there's
// no cursor to advance past it, so once we see one, treat the page as
// exhausted rather than looping on it forever.
function oldestConversationCursor(
  convs: ConversationsPageResponse["conversations"],
): { cursor: string | null; sawEmptyConv: boolean } {
  let cursor: string | null = null;
  let sawEmptyConv = false;

  for (const c of convs) {
    if (!c.last_message_at) {
      sawEmptyConv = true;
      continue;
    }
    if (!cursor || +new Date(c.last_message_at) < +new Date(cursor)) {
      cursor = c.last_message_at;
    }
  }

  return { cursor, sawEmptyConv };
}

export const useInitialDataFetch = () => {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const lastVisibleAt = useRef<Date | null>(null);

  const pushConversations = useBoundStore(
    (state) => state.chat.pushConversations,
  );
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);
  const setConversationsPagination = useBoundStore(
    (state) => state.chat.setConversationsPagination,
  );

  const PHASE1_CONV_LIMIT = 50;

  // App init: page conversations by their own last-message activity
  // (list_conversations_page), independent of org-wide message volume — a
  // conversation with no recent activity no longer falls out of view just
  // because lots of other conversations were busy since.
  const initData = async () => {
    if (!activeOrgId) return;

    setConversationsPagination(activeOrgId, {
      cursor: null,
      exhausted: false,
      loading: true,
    });

    const { data } = await supabase
      .rpc("list_conversations_page", {
        p_organization_id: activeOrgId,
        p_limit: PHASE1_CONV_LIMIT,
        p_per_conversation: 10,
      })
      .throwOnError();

    const page = data as unknown as ConversationsPageResponse;
    pushConversations(page.conversations);
    pushMessages(page.messages);

    const { cursor, sawEmptyConv } = oldestConversationCursor(
      page.conversations,
    );

    setConversationsPagination(activeOrgId, {
      loading: false,
      exhausted:
        page.conversations.length < PHASE1_CONV_LIMIT || sawEmptyConv,
      cursor,
    });
  };

  // Tab-visibility recovery: flat queries (updated_at-based)
  const loadConvs = async (since: Date) => {
    if (!activeOrgId) return;
    const { data: conversations } = await supabase
      .from("conversations")
      .select()
      .eq("organization_id", activeOrgId)
      .eq("status", "active")
      .gt("updated_at", since.toISOString())
      .order("updated_at", { ascending: false })
      .limit(999)
      .throwOnError();

    pushConversations(conversations);
  };

  const loadMsgs = async (since: Date) => {
    if (!activeOrgId) return;
    const { data: messages } = await supabase
      .from("messages")
      .select()
      .eq("organization_id", activeOrgId)
      .gt("updated_at", since.toISOString())
      .order("updated_at", { ascending: false })
      .limit(999)
      .throwOnError();

    pushMessages(messages);
  };

  useEffect(() => {
    initData();

    lastVisibleAt.current = new Date();
  }, [activeOrgId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastVisibleAt.current = new Date();
      } else if (
        document.visibilityState === "visible" &&
        lastVisibleAt.current
      ) {
        loadConvs(lastVisibleAt.current);
        loadMsgs(lastVisibleAt.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
