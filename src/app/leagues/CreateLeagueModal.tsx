"use client";

import { useState, useRef } from "react";
import { Plus, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { createLeague } from "./actions";

const VALID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export default function CreateLeagueModal() {
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    setError(null);
    setSuccess(false);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await createLeague(formData);

    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      formRef.current?.reset();
      setTimeout(() => {
        setExpanded(false);
        setSuccess(false);
      }, 1500);
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => {
          setExpanded((v) => !v);
          setError(null);
          setSuccess(false);
        }}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--color-primary-fixed)" }}
          >
            <Plus size={18} weight="bold" style={{ color: "var(--color-on-primary-fixed)" }} />
          </div>
          <span
            className="font-semibold text-on-surface"
            style={{ fontSize: "var(--text-body-lg)" }}
          >
            Create League
          </span>
        </div>
        <CaretDown
          size={20}
          className="text-on-surface-variant transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {expanded && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="px-5 pb-5 space-y-4 border-t border-outline-variant"
        >
          <div className="pt-4 space-y-2">
            <label
              htmlFor="league-name"
              className="label-bold text-on-surface-variant tracking-widest"
            >
              LEAGUE NAME
            </label>
            <input
              id="league-name"
              name="name"
              type="text"
              required
              maxLength={60}
              placeholder="E.g.: The Office Champions"
              autoComplete="off"
              className="w-full rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant outline-none transition-all focus:ring-2 focus:ring-primary-fixed"
              style={{
                background: "var(--color-surface-container-high)",
                border:
                  "1px solid color-mix(in srgb, var(--color-outline-variant) 60%, transparent)",
                fontSize: "var(--text-body-md)",
              }}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="league-code"
              className="label-bold text-on-surface-variant tracking-widest"
            >
              INVITE CODE{" "}
              <span className="normal-case tracking-normal font-normal opacity-70">
                (optional)
              </span>
            </label>
            <input
              id="league-code"
              name="code"
              type="text"
              maxLength={6}
              placeholder="Auto-generated if empty"
              autoComplete="off"
              onChange={(e) => {
                e.target.value = e.target.value
                  .toUpperCase()
                  .split("")
                  .filter((c) => VALID_CHARS.includes(c))
                  .join("");
              }}
              className="w-full rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant outline-none transition-all focus:ring-2 focus:ring-primary-fixed uppercase tracking-widest font-mono"
              style={{
                background: "var(--color-surface-container-high)",
                border:
                  "1px solid color-mix(in srgb, var(--color-outline-variant) 60%, transparent)",
                fontSize: "var(--text-body-md)",
              }}
            />
            <p
              className="text-on-surface-variant"
              style={{ fontSize: "var(--text-label-bold)" }}
            >
              6 characters · letters and numbers only · no 0, 1, I, O
            </p>
          </div>

          {error && (
            <p className="text-error" style={{ fontSize: "var(--text-label-bold)" }}>
              {error}
            </p>
          )}

          {success && (
            <p className="text-primary-fixed label-bold" style={{ fontSize: "var(--text-label-bold)" }}>
              League created successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg px-4 py-3 label-bold uppercase tracking-widest transition-opacity disabled:opacity-60"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-primary-fixed-dim) 100%)",
              color: "#003d2e",
            }}
          >
            {pending ? "Creating..." : "CREATE LEAGUE"}
          </button>
        </form>
      )}
    </div>
  );
}
