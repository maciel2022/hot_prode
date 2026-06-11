"use client";

import { useState } from "react";
import { PencilSimple, Check, X } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { updateName } from "./actions";

type Props = {
  currentName: string;
};

export default function EditNameForm({ currentName }: Props) {
  const t = useTranslations("profile");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (name.trim() === currentName) {
      setEditing(false);
      return;
    }
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("name", name);
    const result = await updateName(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-on-surface-variant transition-opacity hover:opacity-80 cursor-pointer"
        style={{ fontSize: "var(--text-label-bold)" }}
      >
        <PencilSimple size={14} />
        <span className="label-bold">{t("editName")}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        autoFocus
        className="w-full rounded-lg px-3 py-2 text-center text-on-surface font-semibold text-sm"
        style={{
          background: "var(--color-surface-container-high)",
          border: "1px solid var(--color-outline-variant)",
          outline: "none",
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--color-primary-fixed)"}
        onBlur={(e) => e.target.style.borderColor = "var(--color-outline-variant)"}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") { setEditing(false); setName(currentName); }
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={pending || name.trim().length === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg label-bold text-xs tracking-widest transition-opacity disabled:opacity-50 cursor-pointer"
          style={{
            background: "var(--color-primary-fixed)",
            color: "#003d2e",
          }}
        >
          <Check size={14} weight="bold" />
          {pending ? t("saving") : t("save")}
        </button>
        <button
          onClick={() => { setEditing(false); setName(currentName); setError(null); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg label-bold text-xs tracking-widest cursor-pointer"
          style={{
            background: "var(--color-surface-container-high)",
            color: "var(--color-on-surface)",
          }}
        >
          <X size={14} weight="bold" />
          {t("cancel")}
        </button>
      </div>
      {error && <p className="text-error text-xs font-bold">{error}</p>}
    </div>
  );
}
