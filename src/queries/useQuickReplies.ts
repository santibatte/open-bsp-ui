import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Database, supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export type QuickReplyRow =
  Database["public"]["Tables"]["quick_replies"]["Row"];
export type QuickReplyInsert =
  Database["public"]["Tables"]["quick_replies"]["Insert"];
export type QuickReplyUpdate =
  Database["public"]["Tables"]["quick_replies"]["Update"];

export function useQuickReplies() {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.quickReplies.all(orgId),
    queryFn: async () =>
      await supabase
        .from("quick_replies")
        .select()
        .eq("organization_id", orgId!)
        .order("name")
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as QuickReplyRow[],
  });
}

export function useQuickReply(id: string) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.quickReplies.detail(orgId, id),
    queryFn: async () =>
      await supabase
        .from("quick_replies")
        .select()
        .eq("id", id)
        .eq("organization_id", orgId!)
        .single()
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as QuickReplyRow,
    experimental_prefetchInRender: true,
  });
}

export function useCreateQuickReply() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: QuickReplyInsert) => {
      if (!orgId) throw new Error("No active organization");

      const { data: quickReply } = await supabase
        .from("quick_replies")
        .insert({ ...data, organization_id: orgId })
        .select()
        .single()
        .throwOnError();

      return quickReply;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.quickReplies.all(orgId),
      });
      queryClient.setQueryData(
        queryKeys.quickReplies.detail(orgId, data.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => (old ? { ...old, data } : { data, error: null }),
      );
    },
  });
}

export function useUpdateQuickReply() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: QuickReplyUpdate) => {
      if (!orgId) throw new Error("No active organization");
      if (!data.id) throw new Error("No quick reply id");

      const { data: quickReply } = await supabase
        .from("quick_replies")
        .update(data)
        .eq("id", data.id)
        .select()
        .single()
        .throwOnError();

      return quickReply;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.quickReplies.all(orgId),
      });
      queryClient.setQueryData(
        queryKeys.quickReplies.detail(orgId, variables.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => (old ? { ...old, data } : old),
      );
    },
  });
}

export function useDeleteQuickReply() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("No active organization");

      await supabase.from("quick_replies").delete().eq("id", id).throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.quickReplies.all(orgId),
      });
    },
  });
}
