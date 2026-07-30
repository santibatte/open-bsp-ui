import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "@tanstack/react-router";
import type { QuickReplyRow } from "@/queries/useQuickReplies";

// Mirrors WhatsApp Business' "/" shortcut popup: shows while composing starts
// with "/", filters as you keep typing, arrow keys + Enter/Tab pick one
// (handled by the caller since the editable div keeps focus — see
// ChatFooter's onKeyDown), click/Escape dismiss without touching the draft.
export default function QuickReplyPicker({
  query,
  replies,
  isLoading,
  highlightedIndex,
  onHighlight,
  onSelect,
  onClose,
}: {
  query: string;
  replies: QuickReplyRow[];
  isLoading?: boolean;
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (reply: QuickReplyRow) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { translate: t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-0 w-full max-h-[320px] overflow-hidden flex flex-col z-20 bg-background rounded-[24px] shadow-lg"
    >
      <div className="px-[16px] pt-[12px] pb-[8px] text-[13px] text-muted-foreground shrink-0">
        {t("Respuestas rápidas")}
      </div>

      <div className="overflow-y-auto px-[8px] pb-[8px]">
        <div className="flex flex-col gap-[2px]">
          {isLoading ? (
            <div className="px-[10px] py-[8px] text-muted-foreground text-[13px]">
              {t("Cargando...")}
            </div>
          ) : !replies.length ? (
            <div className="px-[10px] py-[8px] text-muted-foreground text-[13px]">
              {query
                ? `${t("Sin resultados para")} "/${query}"`
                : t("Todavía no cargaste ninguna respuesta rápida.")}
            </div>
          ) : (
            replies.map((reply, i) => (
              <button
                key={reply.id}
                className={
                  "w-full text-left px-[10px] py-[8px] rounded-xl cursor-pointer" +
                  (i === highlightedIndex ? " bg-accent" : " hover:bg-accent")
                }
                onMouseEnter={() => onHighlight(i)}
                onClick={() => onSelect(reply)}
              >
                <div className="font-medium text-[14px] truncate">
                  /{reply.name}
                </div>
                <div className="text-[13px] text-muted-foreground truncate">
                  {reply.content}
                </div>
              </button>
            ))
          )}
          <div
            className="w-full text-left px-[10px] py-[8px] rounded-xl hover:bg-accent cursor-pointer"
            onClick={() => {
              onClose();
              navigate({
                to: "/settings/quick-replies/new",
                hash: (prevHash) => prevHash!,
              });
            }}
          >
            <div className="font-medium text-[14px] flex items-center gap-[4px]">
              <Plus className="w-[14px] h-[14px]" />
              {t("Crear respuesta rápida")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
