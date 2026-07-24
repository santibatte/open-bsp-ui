import { formatPhoneNumber, nameInitials } from "@/utils/FormatUtils";
import Avatar from "./Avatar";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  useContact,
  useContactByAddress,
  useUpdateContact,
} from "@/queries/useContacts";
import { useContactAddress } from "@/queries/useContactsAddresses";
import type { InstagramContactAddressExtra } from "@/supabase/client";
import { useRef, useState } from "react";

export default function Header() {
  const navigate = useNavigate();

  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

  const conversation = useBoundStore((state) =>
    state.chat.conversations.get(state.ui.activeConvId || ""),
  );

  const { data: contact } = useContactByAddress(
    conversation?.contact_address,
    conversation?.service,
  );
  // Full contact record (with addresses) is needed to safely round-trip
  // through useUpdateContact, which expects the complete addresses list -
  // passing an empty/partial list would unlink the contact's phone numbers.
  const { data: fullContact } = useContact(contact?.id ?? "");
  const { data: contactAddress } = useContactAddress(
    conversation?.contact_address,
    conversation?.service,
  );
  const updateContact = useUpdateContact();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const skipBlurSaveRef = useRef(false);

  const service = conversation?.service;
  // Group conversations (whatsapp-web) have group_address set and no
  // contact_address; the conversation name carries the group subject.
  const isGroup = !!conversation?.group_address;

  const igExtra =
    service === "instagram"
      ? (contactAddress?.extra as InstagramContactAddressExtra | null)
      : null;

  // Name fallback order: conversation.name → contact.name →
  // contactAddress.extra?.name → @username (Instagram) → "?"
  const convName =
    conversation?.name ||
    contact?.name ||
    contactAddress?.extra?.name ||
    (igExtra?.username ? `@${igExtra.username}` : undefined);

  const address = conversation?.contact_address;

  // When there is no name, show the (formatted) contact address instead of "?".
  // WhatsApp addresses are phone numbers; Instagram addresses need no
  // formatting. Groups fall back to their opaque JID.
  const displayName =
    convName ||
    (isGroup
      ? conversation?.group_address
      : address
        ? service === "whatsapp" || service === "whatsapp-web"
          ? formatPhoneNumber(address)
          : address
        : undefined) ||
    "?";

  const convInitials = nameInitials(convName || "?");

  const { translate: t } = useTranslation();

  function startEditingName() {
    setNameDraft(contact?.name ?? "");
    setIsEditingName(true);
  }

  function saveName() {
    setIsEditingName(false);

    if (!contact || !fullContact) return;

    const trimmed = nameDraft.trim();
    if (trimmed === (contact.name ?? "")) return;

    updateContact.mutate({
      id: contact.id,
      name: trimmed || null,
      addresses: fullContact.addresses,
    });
  }

  function cancelEditingName() {
    skipBlurSaveRef.current = true;
    setIsEditingName(false);
  }

  function handleNameBlur() {
    if (skipBlurSaveRef.current) {
      skipBlurSaveRef.current = false;
      return;
    }
    saveName();
  }

  if (!activeConvId) {
    return null;
  }

  // The contact-naming affordance only makes sense for 1:1 conversations
  // that resolved to a contact (groups have no single contact to name).
  const canEditName = !isGroup && !!contact;

  return (
    <div className="header border-b border-border bg-background z-30 shadow-md">
      {/* Back button */}
      <button
        className="mr-4 md:hidden"
        title={t("Volver")}
        onClick={() => navigate({ hash: undefined })}
      >
        <ArrowLeft className="w-[24px] h-[24px] text-foreground" />
      </button>

      {/* Contact info */}
      <div className="profile-picture pr-[15px]">
        <Avatar
          src={igExtra?.profile_picture_url}
          fallback={convInitials}
          size={40}
          className="bg-accent text-accent-foreground border border-border text-[16px]"
        />
      </div>
      <div className="info flex flex-col justify-center mr-[12px] truncate">
        {isEditingName ? (
          <input
            type="text"
            className="text text-[16px]"
            value={nameDraft}
            autoFocus
            placeholder={t("Nombre del contacto")}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                cancelEditingName();
              }
            }}
          />
        ) : (
          <div className="text-[16px] text-foreground truncate">
            {displayName}
          </div>
        )}
        <div className="text-[13px] text-muted-foreground truncate">
          {isGroup && t("Grupo")}
          {service === "local" && t("Contacto de prueba")}
          {(service === "whatsapp" || service === "whatsapp-web") &&
            address &&
            formatPhoneNumber(address)}
          {service === "instagram" &&
            igExtra?.username &&
            `@${igExtra.username}`}
        </div>
      </div>

      {/* Rename contact - lets the user name a contact right from the
          conversation instead of hunting for the phone number in Contacts. */}
      {canEditName && !isEditingName && (
        <div className="options flex justify-end w-full">
          <button
            className="p-[8px] ml-[10px] rounded-full hover:bg-muted transition-colors"
            title={t("Editar nombre")}
            onClick={startEditingName}
          >
            <Pencil className="w-[20px] h-[20px] text-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
