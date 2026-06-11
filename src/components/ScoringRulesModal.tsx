"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Target, CheckCircle, PlusMinus, Trophy, Info } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

const RULES_CONFIG = [
  {
    icon: Target,
    labelKey: "exactScore" as const,
    points: "5",
    descriptionKey: "exactScoreDesc" as const,
    example: "Pred 2-1 · Real 2-1",
  },
  {
    icon: CheckCircle,
    labelKey: "correctResult" as const,
    points: "3",
    descriptionKey: "correctResultDesc" as const,
    example: "Pred 3-1 · Real 2-0",
  },
  {
    icon: PlusMinus,
    labelKey: "goalDifference" as const,
    points: "+1",
    descriptionKey: "goalDifferenceDesc" as const,
    example: "Pred 3-1 · Real 4-2",
  },
  {
    icon: Trophy,
    labelKey: "knockoutBonus" as const,
    points: "+2",
    descriptionKey: "knockoutBonusDesc" as const,
    example: "Knockout stages only",
  },
];

export default function ScoringRulesModal() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("scoring");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full label-bold tracking-widest text-[0.6rem] md:text-xs transition-all hover:opacity-80"
        style={{
          background: "rgba(255, 210, 63, 0.22)",
          color: "#ffe066",
          border: "1px solid rgba(255, 210, 63, 0.5)",
          boxShadow: "0 0 8px rgba(255, 210, 63, 0.2)",
        }}
      >
        <Info size={14} weight="fill" className="md:hidden" />
        <Info size={16} weight="fill" className="hidden md:block" />
        {t("rules")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Referee Card */}
          <div
            className="relative w-72 md:w-80"
            style={{
              transform: "rotate(-2deg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card body */}
            <div
              className="relative rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "linear-gradient(170deg, #ffe066 0%, #ffd23f 30%, #f5c518 70%, #e6b400 100%)",
                boxShadow: "0 20px 60px rgba(255, 210, 63, 0.3), 0 0 0 1px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              {/* Top accent line */}
              <div
                className="h-1.5 w-full"
                style={{ background: "linear-gradient(90deg, #e6b400, #ffd23f, #e6b400)" }}
              />

              {/* Close button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-colors"
                style={{ background: "rgba(0,0,0,0.15)" }}
              >
                <X size={16} weight="bold" style={{ color: "#5a4500" }} />
              </button>

              {/* FIFA logo + header */}
              <div className="flex flex-col items-center pt-4 pb-2 px-4">
                <Image
                  src="/logos/fifa_mundial_2026.png"
                  alt="FIFA World Cup 2026"
                  width={48}
                  height={48}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                />
                <h2
                  className="font-display text-center mt-1.5 leading-none"
                  style={{ color: "#3d2e00", fontSize: "1.3rem" }}
                >
                  {t("title")}
                </h2>
                <div
                  className="w-12 h-0.5 mt-1.5 rounded-full"
                  style={{ background: "rgba(0,0,0,0.15)" }}
                />
              </div>

              {/* Rules list */}
              <div className="px-4 space-y-1.5">
                {RULES_CONFIG.map((rule) => (
                  <div
                    key={rule.labelKey}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                    style={{ background: "rgba(0,0,0,0.08)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(0,0,0,0.1)" }}
                    >
                      <rule.icon size={18} weight="fill" style={{ color: "#5a4500" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <span
                          className="font-bold tracking-wider"
                          style={{ color: "#3d2e00", fontSize: "0.7rem" }}
                        >
                          {t(rule.labelKey)}
                        </span>
                        <span
                          className="font-display shrink-0"
                          style={{ color: "#3d2e00", fontSize: "1.1rem", lineHeight: 1 }}
                        >
                          {rule.points}
                        </span>
                      </div>
                      <p style={{ color: "#6b5300", fontSize: "0.65rem", lineHeight: "1.3" }}>
                        {t(rule.descriptionKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Max points footer */}
              <div className="px-4 pt-2 pb-4">
                <div
                  className="flex gap-2 rounded-xl overflow-hidden"
                  style={{ background: "rgba(0,0,0,0.1)" }}
                >
                  <div className="flex-1 py-2 text-center">
                    <p className="font-display" style={{ color: "#3d2e00", fontSize: "1.4rem", lineHeight: 1 }}>5</p>
                    <p className="font-bold tracking-wider mt-0.5" style={{ color: "#6b5300", fontSize: "0.55rem" }}>
                      {t("maxGroups")}
                    </p>
                  </div>
                  <div
                    className="w-px self-stretch"
                    style={{ background: "rgba(0,0,0,0.1)" }}
                  />
                  <div className="flex-1 py-2 text-center">
                    <p className="font-display" style={{ color: "#3d2e00", fontSize: "1.4rem", lineHeight: 1 }}>7</p>
                    <p className="font-bold tracking-wider mt-0.5" style={{ color: "#6b5300", fontSize: "0.55rem" }}>
                      {t("maxKnockout")}
                    </p>
                  </div>
                </div>

                {/* GOT IT button */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full mt-2.5 rounded-xl px-4 py-2.5 font-display tracking-wider transition-opacity hover:opacity-90"
                  style={{
                    background: "#3d2e00",
                    color: "#ffd23f",
                    fontSize: "0.85rem",
                  }}
                >
                  {t("gotIt")}
                </button>
              </div>
            </div>

            {/* Card shine effect */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
