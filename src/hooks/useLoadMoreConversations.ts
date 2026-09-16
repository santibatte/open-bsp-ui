import { supabase } from "@/supabase/client";
import type { ConversationRow, MessageRow } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { DEFAULT_CONVERSATIONS_PAGINATION } from "@/stores/chatSlice";

type ConversationsPageResponse = {
  conversations: (ConversationRow & { last_message_at: string | null })[];
  messages: MessageRow[];
};

const PAGE_LIMIT = 50;
const PAGE_PER_CONVERSATION = 5;

// Scroll-triggered continuation of useInitialDataFetch's list_conversations_page
// calls: same RPC, same p_before cursor convention (oldest last_message_at
// seen so far), just invoked again once the user nears the bottom of the
// conversation list.
export const useLoadMoreConversations = () => {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const pagination = useBoundStore((state) =>
    activeOrgId
      ? (state.chat.conversationsPagination.get(activeOrgId) ??
        DEFAULT_CONVERSATIONS_PAGINATION)
      : DEFAULT_CONVERSATIONS_PAGINATION,
  );
  const setConversationsPagination = useBoundStore(
    (state) => state.chat.setConversationsPagination,
  );
  const pushConversations = useBoundStore(
    (state) => state.chat.pushConversations,
  );
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);

  return async () => {
    if (!activeOrgId || pagination.loading || pagination.exhausted) return;

    setConversationsPagination(activeOrgId, { loading: true });

    const { data } = await supabase
      .rpc("list_conversations_page", {
        p_organization_id: activeOrgId,
        p_limit: PAGE_LIMIT,
        p_per_conversation: PAGE_PER_CONVERSATION,
        p_before: pagination.cursor ?? undefined,
      })
      .throwOnError();

    const page = data as unknown as ConversationsPageResponse;
    pushConversations(page.conversations);
    pushMessages(page.messages);

    let cursor: string | null = null;
    let sawEmptyConv = false;

    for (const c of page.conversations) {
      if (!c.last_message_at) {
        sawEmptyConv = true;
        continue;
      }
      if (!cursor || +new Date(c.last_message_at) < +new Date(cursor)) {
        cursor = c.last_message_at;
      }
    }

    const exhausted = page.conversations.length < PAGE_LIMIT || sawEmptyConv;

    setConversationsPagination(activeOrgId, {
      loading: false,
      exhausted,
      cursor: exhausted ? pagination.cursor : cursor,
    });
  };
};
