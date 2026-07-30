import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuickReplies } from "@/queries/useQuickReplies";
import { useCurrentAgent } from "@/queries/useAgents";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Zap } from "lucide-react";

export const Route = createFileRoute("/_auth/settings/quick-replies/")({
  component: ListQuickReplies,
});

function ListQuickReplies() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: quickReplies } = useQuickReplies();
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");

  return (
    <>
      <SectionHeader title={t("Respuestas rápidas")} />

      <SectionBody>
        <p>
          {t(
            'Frases guardadas para responder rápido. Al escribir "/" en un chat aparece la lista para elegir una.',
          )}
        </p>

        <SectionItem
          title={t("Agregar respuesta rápida")}
          aside={
            <div className="p-[8px] bg-primary/10 rounded-full">
              <Plus className="w-[24px] h-[24px] text-primary" />
            </div>
          }
          onClick={() =>
            navigate({
              to: "/settings/quick-replies/new",
              hash: (prevHash) => prevHash!,
            })
          }
          disabled={!isAdmin}
          disabledReason={t("Requiere permisos de administrador")}
        />
        {quickReplies?.map((quickReply) => (
          <SectionItem
            key={quickReply.id}
            title={`/${quickReply.name}`}
            description={quickReply.content}
            aside={
              <div className="p-[8px]">
                <Zap className="w-[24px] h-[24px] text-muted-foreground" />
              </div>
            }
            onClick={() =>
              navigate({
                to: `/settings/quick-replies/${quickReply.id}`,
                hash: (prevHash) => prevHash!,
              })
            }
          />
        ))}
      </SectionBody>
    </>
  );
}
