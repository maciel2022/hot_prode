"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash } from "@phosphor-icons/react";
import { deleteLeague } from "./actions";

type Props = {
  leagueId: string;
  leagueName: string;
};

export default function DeleteLeagueButton({ leagueId, leagueName }: Props) {
  const t = useTranslations("leagues");
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("leagueId", leagueId);
    const result = await deleteLeague(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-error transition-opacity hover:opacity-80 cursor-pointer"
        style={{
          background: "color-mix(in srgb, var(--color-error-container) 20%, transparent)",
          fontSize: "var(--text-label-bold)",
        }}
      >
        <Trash size={14} />
        <span className="label-bold">{t("delete")}</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-on-surface-variant" style={{ fontSize: "var(--text-label-bold)" }}>
        {t("deleteConfirm", { name: leagueName })}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={pending}
          className="flex-1 rounded-lg py-1.5 label-bold text-xs tracking-widest transition-opacity disabled:opacity-50 cursor-pointer"
          style={{ background: "var(--color-error-container)", color: "var(--color-on-error-container)" }}
        >
          {pending ? t("deleting") : t("confirm")}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          className="flex-1 rounded-lg py-1.5 label-bold text-xs tracking-widest cursor-pointer"
          style={{ background: "var(--color-surface-container-high)", color: "var(--color-on-surface)" }}
        >
          {t("cancel")}
        </button>
      </div>
      {error && <p className="text-error text-xs font-bold">{error}</p>}
    </div>
  );
}
