import { supabase } from "@/supabase/client";
import type { MessageRow } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { DEFAULT_MESSAGE_HISTORY_PAGINATION } from "@/stores/chatSlice";

const PAGE_LIMIT = 30;

// init_data / list_conversations_page only preload a handful of messages per
// conversation. This pages a single conversation's own history further back,
// once it's already open, via get_conversation_history.
export const useLoadOlderMessages = (convId: string | null) => {
  const pagination = useBoundStore((state) =>
    convId
      ? (state.chat.messageHistoryPagination.get(convId) ??
        DEFAULT_MESSAGE_HISTORY_PAGINATION)
      : DEFAULT_MESSAGE_HISTORY_PAGINATION,
  );
  const setMessageHistoryPagination = useBoundStore(
    (state) => state.chat.setMessageHistoryPagination,
  );
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);
  const oldestLoadedTimestamp = useBoundStore((state) => {
    if (!convId) return null;
    const msgs = state.chat.messages.get(convId);
    if (!msgs || msgs.size === 0) return null;
    return Array.from(msgs.values()).reduce(
      (min, m) => (+new Date(m.timestamp) < +new Date(min) ? m.timestamp : min),
      Array.from(msgs.values())[0].timestamp,
    );
  });

  return {
    exhausted: pagination.exhausted,
    loading: pagination.loading,
    // Returns whether any older messages were actually fetched, so callers
    // that optimistically prepare for a DOM update (e.g. to preserve scroll
    // position) can bail out cleanly when there was nothing new.
    loadOlder: async (): Promise<boolean> => {
      if (!convId || pagination.loading || pagination.exhausted) return false;

      const before = pagination.cursor ?? oldestLoadedTimestamp;
      if (!before) return false;

      setMessageHistoryPagination(convId, { loading: true });

      const { data } = await supabase
        .rpc("get_conversation_history", {
          p_conversation_id: convId,
          p_before: before,
          p_limit: PAGE_LIMIT,
        })
        .throwOnError();

      const page = (data as unknown as MessageRow[]) ?? [];
      pushMessages(page);

      const exhausted = page.length < PAGE_LIMIT;
      const oldest = page.length
        ? page.reduce(
            (min, m) =>
              +new Date(m.timestamp) < +new Date(min) ? m.timestamp : min,
            page[0].timestamp,
          )
        : before;

      setMessageHistoryPagination(convId, {
        loading: false,
        exhausted,
        cursor: oldest,
      });

      return page.length > 0;
    },
  };
};
