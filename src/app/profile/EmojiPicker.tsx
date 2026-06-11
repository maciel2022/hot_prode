"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AVATAR_STYLES, buildAvatarUrl } from "@/lib/avatar";
import { updateAvatar } from "./actions";

type Props = {
  currentImage: string | null;
  userName: string;
};

export default function AvatarPicker({ currentImage, userName }: Props) {
  const t = useTranslations("profile");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(style: string) {
    const url = buildAvatarUrl(style as typeof AVATAR_STYLES[number], userName);
    if (url === currentImage) {
      setOpen(false);
      return;
    }
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("style", style);
    const result = await updateAvatar(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="label-bold text-on-surface-variant transition-opacity hover:opacity-80 cursor-pointer"
        style={{ fontSize: "var(--text-label-bold)" }}
      >
        {t("changeAvatar")}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="label-bold text-on-surface-variant tracking-widest" style={{ fontSize: "0.625rem" }}>
        {t("pickAvatar")}
      </p>
      <div
        className="grid grid-cols-3 md:grid-cols-4 gap-3 p-4 rounded-xl w-full max-w-sm"
        style={{
          background: "var(--color-surface-container-high)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        {AVATAR_STYLES.map((style) => {
          const url = buildAvatarUrl(style, userName);
          const isActive = currentImage === url;
          return (
            <button
              key={style}
              onClick={() => handleSelect(style)}
              disabled={pending}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              style={{
                background: isActive
                  ? "color-mix(in srgb, var(--color-primary-fixed) 15%, transparent)"
                  : "transparent",
                border: isActive
                  ? "2px solid var(--color-primary-fixed)"
                  : "2px solid transparent",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={style}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full"
                style={{ background: "var(--color-surface-container)" }}
              />
              <span
                className="text-on-surface-variant truncate w-full text-center"
                style={{ fontSize: "0.55rem", fontWeight: 600 }}
              >
                {style.replace(/-/g, " ")}
              </span>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => { setOpen(false); setError(null); }}
        className="label-bold text-on-surface-variant text-xs tracking-widest cursor-pointer"
      >
        {t("cancel")}
      </button>
      {error && <p className="text-error text-xs font-bold">{error}</p>}
    </div>
  );
}
