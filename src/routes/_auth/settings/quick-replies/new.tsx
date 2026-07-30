import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useCreateQuickReply,
  type QuickReplyInsert,
} from "@/queries/useQuickReplies";
import { useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import Button from "@/components/Button";

export const Route = createFileRoute("/_auth/settings/quick-replies/new")({
  component: AddQuickReply,
});

function AddQuickReply() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createQuickReply = useCreateQuickReply();
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");

  const {
    register,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm<QuickReplyInsert>();

  return (
    <>
      <SectionHeader title={t("Agregar respuesta rápida")} />

      <SectionBody>
        <form
          id="create-quick-reply-form"
          onSubmit={handleSubmit((data) =>
            createQuickReply.mutate(data, {
              onSuccess: (quickReply) =>
                navigate({
                  to: `/settings/quick-replies/${quickReply!.id}`,
                  hash: (prevHash) => prevHash!,
                }),
            }),
          )}
        >
          <fieldset disabled={!isAdmin} className="contents">
            <p>
              {t(
                'El nombre es el atajo que vas a escribir después de "/" en el chat, sin espacios (ej: "plasma"). El contenido es el texto completo que se va a insertar.',
              )}
            </p>

            <label>
              <div className="label">{t("Nombre del atajo")}</div>
              <input
                type="text"
                className="text"
                placeholder={t("plasma")}
                {...register("name", {
                  required: true,
                  // Shortcuts are typed right after "/" while composing — normalize
                  // to a single space-free lowercase token, same spirit as WhatsApp
                  // Business shortcuts.
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
                placeholder={t("Escribe la respuesta completa...")}
                {...register("content", { required: true })}
              />
            </label>
          </fieldset>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="create-quick-reply-form"
          type="submit"
          disabled={!isAdmin}
          invalid={!isValid || !isDirty}
          loading={createQuickReply.isPending}
          disabledReason={t("Requiere permisos de administrador")}
          className="primary"
        >
          {t("Crear")}
        </Button>
      </SectionFooter>
    </>
  );
}
