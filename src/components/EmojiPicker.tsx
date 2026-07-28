import { useEffect, useRef, useState } from "react";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";

const CATEGORIES = [
  {
    icon: "😀",
    label: "Caritas",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😋",
      "😛",
      "😜",
      "🤪",
      "🤗",
      "🤭",
      "🤔",
      "🤫",
      "😐",
      "😑",
      "😶",
      "🙄",
      "😏",
      "😒",
      "😬",
      "😌",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
      "🥳",
      "🥺",
      "😢",
      "😭",
      "😤",
      "😠",
      "😡",
      "🥱",
    ],
  },
  {
    icon: "👍",
    label: "Gestos",
    emojis: [
      "👍",
      "👎",
      "👌",
      "🤌",
      "✌️",
      "🤞",
      "🤟",
      "🤙",
      "👋",
      "🤝",
      "🙏",
      "👏",
      "🙌",
      "💪",
      "🤳",
      "👆",
      "👇",
      "👉",
      "👈",
      "☝️",
    ],
  },
  {
    icon: "❤️",
    label: "Corazones",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💯",
      "✨",
      "🎉",
      "🎊",
    ],
  },
  {
    icon: "💆‍♀️",
    label: "Consultorio",
    emojis: [
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
    ],
  },
] as const;

export default function EmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  const toggle = useBoundStore((store) => store.ui.toggle);
  const [activeCategory, setActiveCategory] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { translate: t } = useTranslation();

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

  return (
    <div
      ref={ref}
      className="absolute bottom-0 w-full max-h-[320px] overflow-hidden flex flex-col z-20 bg-background rounded-[24px] shadow-lg"
    >
      {/* Category tabs */}
      <div className="flex gap-[4px] px-[16px] pt-[12px] pb-[8px] border-b border-border shrink-0">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            className={
              "text-[18px] px-[8px] py-[4px] rounded-xl cursor-pointer hover:bg-accent" +
              (i === activeCategory ? " bg-accent" : "")
            }
            onClick={() => setActiveCategory(i)}
            title={t(cat.label)}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="overflow-y-auto px-[16px] py-[8px]">
        <div className="grid grid-cols-8 gap-[4px]">
          {CATEGORIES[activeCategory].emojis.map((emoji, i) => (
            <button
              key={emoji + i}
              className="text-[22px] leading-none aspect-square flex items-center justify-center rounded-xl hover:bg-accent cursor-pointer"
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
