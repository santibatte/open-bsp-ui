import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useBoundStore from "@/stores/useBoundStore";
import { MessageSquarePlus, MessageCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { startConversation } from "@/utils/ConversationUtils";
import { useState } from "react";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import SectionHeader from "@/components/SectionHeader";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { useContacts } from "@/queries/useContacts";
import SectionItem from "@/components/SectionItem";
import SectionBody from "@/components/SectionBody";
import SearchBar from "@/components/SearchBar";
import Avatar from "@/components/Avatar";
import Fuse from "fuse.js";

export const Route = createFileRoute("/_auth/conversations/new")({
  component: NewChat,
});

function NewChat() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: addresses } = useOrganizationsAddresses();
  const { data: contacts } = useContacts();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const localAddress = addresses?.find(
    (address) => address.service === "local",
  );

  const whatsappAddresses = addresses?.filter(
    (address) => address.service === "whatsapp",
  );

  const [phoneNumber, setPhoneNumber] = useState("");

  // Only contacts reachable over WhatsApp make sense here — a scheduled
  // patient synced from base_pacientes/Calendly who never wrote in has a
  // `contacts` row (see useContacts) but no conversation yet, which is
  // exactly the case this screen exists for.
  const whatsappContacts = (contacts ?? []).filter((contact) =>
    contact.addresses?.some((a) => a.service === "whatsapp"),
  );

  let filteredContacts = whatsappContacts;

  if (phoneNumber) {
    const fuse = new Fuse(whatsappContacts, {
      threshold: 0.4,
      keys: ["name", "addresses.address"],
    });
    filteredContacts = fuse.search(phoneNumber).map((r) => r.item);
  }

  function sanitizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");

    // If empty after sanitizing, return empty string
    if (!digits) return "";

    // If it already starts with 549, return as is
    if (digits.startsWith("549")) return digits;

    // If it starts with 54 but not 549, prepend 9
    if (digits.startsWith("54")) return "549" + digits.slice(2);

    // Otherwise prepend 549
    return "549" + digits;
  }

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title={t("Nueva conversación")} />

      <SearchBar
        value={phoneNumber}
        onChange={setPhoneNumber}
        placeholder={t("Buscar nombre o número de teléfono")}
        autoFocus
      />

      <SectionBody>
        {filteredContacts.map((contact) => {
          const whatsappAddress = contact.addresses?.find(
            (a) => a.service === "whatsapp",
          );

          if (!whatsappAddress || !whatsappAddresses?.length || !activeOrgId) {
            return null;
          }

          return (
            <SectionItem
              key={contact.id}
              title={contact.name || t("Sin nombre")}
              description={formatPhoneNumber(whatsappAddress.address)}
              aside={
                <Avatar
                  fallback={contact.name?.substring(0, 2).toUpperCase() || "?"}
                  size={40}
                  className="bg-muted text-muted-foreground"
                />
              }
              onClick={() => {
                const convId = startConversation({
                  organization_id: activeOrgId,
                  organization_address: whatsappAddresses[0].address,
                  contact_address: whatsappAddress.address,
                  service: "whatsapp",
                  name:
                    contact.name || formatPhoneNumber(whatsappAddress.address),
                });

                navigate({ to: "/conversations", hash: convId });
              }}
            />
          );
        })}
        {localAddress && (
          <SectionItem
            title={t("Nueva conversación de prueba")}
            aside={
              <div className="p-[8px] bg-primary/10 rounded-full">
                <MessageSquarePlus className="w-[24px] h-[24px] text-primary" />
              </div>
            }
            onClick={() => {
              if (!activeOrgId) {
                return;
              }

              const convId = startConversation({
                name: t("Conversación de prueba"),
                organization_id: activeOrgId,
                organization_address: localAddress.address,
                service: "local",
              });

              //setActiveConv(convId!);
              navigate({ to: "/conversations", hash: convId });
            }}
          />
        )}

        {!!whatsappAddresses?.length &&
          phoneNumber.replace(/\D/g, "").length >= 10 &&
          !filteredContacts.some((contact) =>
            contact.addresses?.some(
              (a) =>
                a.service === "whatsapp" &&
                a.address === sanitizePhoneNumber(phoneNumber),
            ),
          ) && (
            <SectionItem
              title={formatPhoneNumber(sanitizePhoneNumber(phoneNumber))}
              aside={
                <div className="p-[8px] bg-primary/10 rounded-full">
                  <MessageCircle className="w-[24px] h-[24px] text-primary" />
                </div>
              }
              onClick={() => {
                if (!activeOrgId) return;

                const convId = startConversation({
                  organization_id: activeOrgId,
                  organization_address: whatsappAddresses[0].address,
                  contact_address: sanitizePhoneNumber(phoneNumber),
                  service: "whatsapp",
                  name: formatPhoneNumber(sanitizePhoneNumber(phoneNumber)),
                });

                // setActiveConv(convId!);
                navigate({ to: "/conversations", hash: convId });
              }}
            />
          )}
      </SectionBody>
    </div>
  );
}
