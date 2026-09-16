import { supabase } from "@/supabase/client";
import type { ConversationRow, MessageRow } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { DEFAULT_CONVERSATIONS_PAGINATION } from "@/stores/chatSlice";

type InitDataResponse = {
  conversations: ConversationRow[];
  messages: MessageRow[];
};

const PAGE_LIMIT = 100;
const PAGE_PER_CONVERSATION = 5;

// Scroll-triggered continuation of useInitialDataFetch's windowed init_data
// calls: same RPC, same p_until cursor convention, just invoked again once
// the user nears the bottom of the conversation list.
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
      .rpc("init_data", {
        p_organization_id: activeOrgId,
        p_limit: PAGE_LIMIT,
        p_per_conversation: PAGE_PER_CONVERSATION,
        p_until: pagination.cursor ?? undefined,
      })
      .throwOnError();

    const page = data as unknown as InitDataResponse;
    pushConversations(page.conversations);
    pushMessages(page.messages);

    const exhausted = page.messages.length < PAGE_LIMIT;
    const oldest = page.messages.length
      ? page.messages.reduce(
          (min, m) =>
            +new Date(m.timestamp) < +new Date(min) ? m.timestamp : min,
          page.messages[0].timestamp,
        )
      : pagination.cursor;

    setConversationsPagination(activeOrgId, {
      loading: false,
      exhausted,
      cursor: exhausted ? pagination.cursor : oldest,
    });
  };
};
