"use client";

import { useState } from "react";
import Image from "next/image";
import { X, SoccerBall, Star, UsersThree, TrendUp, Question } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

const STEPS_CONFIG = [
  {
    icon: SoccerBall,
    labelKey: "step1Label" as const,
    step: "1",
    descriptionKey: "step1Desc" as const,
  },
  {
    icon: Star,
    labelKey: "step2Label" as const,
    step: "2",
    descriptionKey: "step2Desc" as const,
  },
  {
    icon: UsersThree,
    labelKey: "step3Label" as const,
    step: "3",
    descriptionKey: "step3Desc" as const,
  },
  {
    icon: TrendUp,
    labelKey: "step4Label" as const,
    step: "4",
    descriptionKey: "step4Desc" as const,
  },
];

export default function HowToPlayModal() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("howToPlay");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full label-bold tracking-widest text-[0.6rem] md:text-xs transition-all hover:opacity-80"
        style={{
          background: "rgba(229, 57, 53, 0.15)",
          color: "#e53935",
          border: "1px solid rgba(229, 57, 53, 0.3)",
        }}
      >
        <Question size={14} weight="fill" className="md:hidden" />
        <Question size={16} weight="fill" className="hidden md:block" />
        {t("button")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Red Card */}
          <div
            className="relative w-72 md:w-80"
            style={{
              transform: "rotate(2deg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card body */}
            <div
              className="relative rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "linear-gradient(170deg, #ff6b6b 0%, #e53935 30%, #c62828 70%, #b71c1c 100%)",
                boxShadow: "0 20px 60px rgba(229, 57, 53, 0.3), 0 0 0 1px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              {/* Top accent line */}
              <div
                className="h-1.5 w-full"
                style={{ background: "linear-gradient(90deg, #b71c1c, #e53935, #b71c1c)" }}
              />

              {/* Close button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-colors"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                <X size={16} weight="bold" style={{ color: "rgba(255,255,255,0.8)" }} />
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
                  style={{ color: "#fff", fontSize: "1.3rem" }}
                >
                  {t("title")}
                </h2>
                <div
                  className="w-12 h-0.5 mt-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.25)" }}
                />
              </div>

              {/* Steps list */}
              <div className="px-4 space-y-1.5">
                {STEPS_CONFIG.map((step) => (
                  <div
                    key={step.labelKey}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                    style={{ background: "rgba(0,0,0,0.15)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(0,0,0,0.15)" }}
                    >
                      <step.icon size={18} weight="fill" style={{ color: "rgba(255,255,255,0.9)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <span
                          className="font-bold tracking-wider"
                          style={{ color: "#fff", fontSize: "0.7rem" }}
                        >
                          {t(step.labelKey)}
                        </span>
                        <span
                          className="font-display shrink-0"
                          style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem", lineHeight: 1 }}
                        >
                          {step.step}
                        </span>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem", lineHeight: "1.3" }}>
                        {t(step.descriptionKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer tip */}
              <div className="px-4 pt-2 pb-4">
                <div
                  className="rounded-xl px-3 py-2.5 text-center"
                  style={{ background: "rgba(0,0,0,0.15)" }}
                >
                  <p
                    className="font-bold tracking-wider"
                    style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.6rem", lineHeight: "1.4" }}
                  >
                    {t("tip")}
                  </p>
                </div>

                {/* CTA button */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full mt-2.5 rounded-xl px-4 py-2.5 font-display tracking-wider transition-opacity hover:opacity-90"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "#b71c1c",
                    fontSize: "0.85rem",
                  }}
                >
                  {t("cta")}
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
