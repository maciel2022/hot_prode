"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CaretDown, Globe, Lock, Check } from "@phosphor-icons/react";

type League = {
  id: string;
  name: string;
};

export default function LeaguePicker({ leagues }: { leagues: League[] }) {
  const t = useTranslations("leaderboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLeague = searchParams.get("league") ?? "";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const items = [{ id: "", name: t("global") }, ...leagues];
  const selected = items.find((l) => l.id === activeLeague) ?? items[0];

  function select(leagueId: string) {
    if (leagueId === "") {
      router.push("/leaderboard");
    } else {
      router.push(`/leaderboard?league=${leagueId}`);
    }
    setOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all cursor-pointer"
        style={{
          background: "var(--color-surface-container)",
          border: open
            ? "1px solid var(--color-primary-fixed)"
            : "1px solid var(--color-outline-variant)",
          boxShadow: open
            ? "0 0 12px color-mix(in srgb, var(--color-primary-fixed) 20%, transparent)"
            : "none",
        }}
      >
        {selected.id === "" ? (
          <Globe size={18} weight="fill" className="text-primary-fixed shrink-0" />
        ) : (
          <Lock size={18} weight="fill" className="text-primary-fixed shrink-0" />
        )}
        <span className="flex-1 text-left text-on-surface font-semibold text-sm truncate">
          {selected.name}
        </span>
        <CaretDown
          size={16}
          weight="bold"
          className="text-on-surface-variant shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden py-1"
          style={{
            background: "color-mix(in srgb, var(--color-surface-container-high) 95%, transparent)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--color-outline-variant)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {items.map((league) => {
            const isActive = league.id === activeLeague;
            return (
              <button
                key={league.id}
                onClick={() => select(league.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer"
                style={{
                  background: isActive
                    ? "color-mix(in srgb, var(--color-primary-fixed) 12%, transparent)"
                    : "transparent",
                }}
              >
                {league.id === "" ? (
                  <Globe size={16} weight="fill" className="text-on-surface-variant shrink-0" />
                ) : (
                  <Lock size={16} weight="fill" className="text-on-surface-variant shrink-0" />
                )}
                <span
                  className="flex-1 text-left truncate text-sm"
                  style={{
                    color: isActive
                      ? "var(--color-primary-fixed)"
                      : "var(--color-on-surface)",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {league.name}
                </span>
                {isActive && (
                  <Check size={16} weight="bold" className="text-primary-fixed shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
