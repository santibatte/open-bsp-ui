import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useQuickReply,
  useUpdateQuickReply,
  useDeleteQuickReply,
  type QuickReplyUpdate,
} from "@/queries/useQuickReplies";
import { useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";

export const Route = createFileRoute(
  "/_auth/settings/quick-replies/$quickReplyId",
)({
  component: EditQuickReply,
});

function EditQuickReply() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { quickReplyId } = Route.useParams();
  const { data: quickReply } = useQuickReply(quickReplyId);
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");
  const updateQuickReply = useUpdateQuickReply();
  const deleteQuickReply = useDeleteQuickReply();

  const {
    register,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm<QuickReplyUpdate>({
    values: quickReply,
  });

  return (
    quickReply && (
      <>
        <SectionHeader
          title={`/${quickReply.name}`}
          onDelete={() =>
            deleteQuickReply.mutate(quickReplyId, {
              onSuccess: () =>
                navigate({ to: "..", hash: (prevHash) => prevHash! }),
            })
          }
          deleteDisabled={!isAdmin}
          deleteDisabledReason={t("Requiere permisos de administrador")}
          deleteLoading={deleteQuickReply.isPending}
        />

        <SectionBody>
          <form
            id="quick-reply-form"
            onSubmit={handleSubmit((data) =>
              updateQuickReply.mutate({
                id: quickReplyId,
                ...data,
              }),
            )}
          >
            <fieldset disabled={!isAdmin} className="contents">
              <label>
                <div className="label">{t("Nombre del atajo")}</div>
                <input
                  type="text"
                  className="text"
                  {...register("name", {
                    required: true,
                    setValueAs: (value: string) =>
                      value.trim().toLowerCase().replace(/\s+/g, "-"),
                  })}
                />
              </label>

              <label>
                <div className="label">{t("Contenido")}</div>
                <textarea
                  className="text"
                  rows={5}
                  {...register("content", { required: true })}
                />
              </label>
            </fieldset>
          </form>
        </SectionBody>

        <SectionFooter>
          <Button
            form="quick-reply-form"
            type="submit"
            disabled={!isAdmin}
            invalid={!isValid || !isDirty}
            loading={updateQuickReply.isPending}
            disabledReason={t("Requiere permisos de administrador")}
            className="primary"
          >
            {t("Actualizar")}
          </Button>
        </SectionFooter>
      </>
    )
  );
}
