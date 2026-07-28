import { useEffect, useMemo, useRef, useState } from "react";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import SearchBar from "@/components/SearchBar";

type EmojiEntry = {
  emoji: string;
  name: string;
  slug: string;
};

type EmojiGroupData = {
  name: string;
  slug: string;
  emojis: EmojiEntry[];
};

// Curated shortcuts for messages this clinic sends often — kept as its own
// tab (always available, no need to wait for the full dataset to load)
// instead of buried inside the generic Unicode groups below.
const CONSULTORIO_EMOJIS = [
  "💆‍♀️",
  "💅",
  "🧴",
  "💄",
  "🪞",
  "🌟",
  "🌸",
  "🌺",
  "🩷",
  "🧖‍♀️",
  "😊",
  "🥳",
  "📅",
  "⏰",
  "✅",
  "📍",
  "📸",
  "🩺",
  "🌞",
  "🌙",
];

// Spanish labels for unicode-emoji-json's (English) group names.
const GROUP_LABELS: Record<string, string> = {
  "Smileys & Emotion": "Caritas",
  "People & Body": "Personas",
  "Animals & Nature": "Animales",
  "Food & Drink": "Comida",
  "Travel & Places": "Viajes",
  Activities: "Actividades",
  Objects: "Objetos",
  Symbols: "Símbolos",
  Flags: "Banderas",
};

export default function EmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  const toggle = useBoundStore((store) => store.ui.toggle);
  const [groups, setGroups] = useState<EmojiGroupData[] | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { translate: t } = useTranslation();

  // Full Unicode emoji set (~1900 emojis) is ~30KB gzipped — load it lazily
  // as its own chunk so it doesn't bloat the app's initial bundle.
  useEffect(() => {
    void import("unicode-emoji-json/data-by-group.json").then((mod) =>
      setGroups(mod.default as EmojiGroupData[]),
    );
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") toggle("emojiPicker", false);
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        toggle("emojiPicker", false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClick);
    };
  }, [toggle]);

  const categories = useMemo(
    () => [
      { icon: "💆‍♀️", label: "Consultorio", emojis: CONSULTORIO_EMOJIS },
      ...(groups || []).map((g) => ({
        icon: g.emojis[0]?.emoji || "🙂",
        label: GROUP_LABELS[g.name] || g.name,
        emojis: g.emojis.map((e) => e.emoji),
      })),
    ],
    [groups],
  );

  // Search matches the dataset's English names/slugs (there's no Spanish
  // names available) — the placeholder below says so explicitly.
  const searchResults = useMemo(() => {
    if (!search.trim() || !groups) return null;
    const q = search.trim().toLowerCase();
    const seen = new Set<string>();
    const results: string[] = [];
    for (const g of groups) {
      for (const e of g.emojis) {
        if (!seen.has(e.emoji) && (e.name.includes(q) || e.slug.includes(q))) {
          seen.add(e.emoji);
          results.push(e.emoji);
        }
      }
    }
    return results;
  }, [search, groups]);

  const shownEmojis = searchResults ?? categories[activeCategory]?.emojis ?? [];

  return (
    <div
      ref={ref}
      className="absolute bottom-0 w-full max-h-[380px] overflow-hidden flex flex-col z-20 bg-background rounded-[24px] shadow-lg"
    >
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t("Buscar emoji (en inglés)...")}
        size="small"
        className="px-[16px] pt-[12px] pb-[8px] flex shrink-0"
      />

      {!search && (
        <div className="flex gap-[4px] px-[16px] pb-[8px] border-b border-border shrink-0 overflow-x-auto">
          {categories.map((cat, i) => (
            <button
              key={cat.label}
              className={
                "text-[18px] px-[8px] py-[4px] rounded-xl cursor-pointer hover:bg-accent shrink-0" +
                (i === activeCategory ? " bg-accent" : "")
              }
              onClick={() => setActiveCategory(i)}
              title={t(cat.label)}
            >
              {cat.icon}
            </button>
          ))}
          {!groups && (
            <span className="self-center text-[12px] text-muted-foreground px-[8px] whitespace-nowrap">
              {t("Cargando más...")}
            </span>
          )}
        </div>
      )}

      <div className="overflow-y-auto px-[16px] py-[8px]">
        {shownEmojis.length === 0 ? (
          <div className="px-[10px] py-[8px] text-muted-foreground text-[13px]">
            {t("Sin resultados")}
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-[4px]">
            {shownEmojis.map((emoji, i) => (
              <button
                key={emoji + i}
                className="text-[22px] leading-none aspect-square flex items-center justify-center rounded-xl hover:bg-accent cursor-pointer"
                onClick={() => onSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
