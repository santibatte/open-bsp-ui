import { useTranslation } from "@/hooks/useTranslation";
import { LinkButton } from "@/components/LinkButton";
import { useCurrentOrganization } from "@/queries/useOrganizations";
import { MessageSquarePlus } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export default function Header() {
  const { data: org } = useCurrentOrganization();

  const { translate: t } = useTranslation();

  return (
    <div className="header flex justify-between w-full">
      <div className="flex items-center gap-2 truncate">
        <LogoMark size={24} />
        <div className="text-primary tracking-tighter font-bold text-[24px]">
          {org?.name || "OpenBSP"}
        </div>
      </div>
      <div className="flex justify-end">
        <LinkButton
          to="/conversations/new"
          className="ml-[10px]"
          title={t("Nueva conversación")}
        >
          <MessageSquarePlus className="w-[24px] h-[24px] text-foreground" />
        </LinkButton>
      </div>
    </div>
  );
}
