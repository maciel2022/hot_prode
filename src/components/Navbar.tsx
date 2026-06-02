"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useTransition } from "react";
import { CaretDown, SignOut, ShieldStar, UserCircle, GlobeSimple } from "@phosphor-icons/react/dist/ssr";
import { logoutAction } from "@/app/login/actions";
import { useTranslations, useLocale } from "next-intl";
import { setLocale } from "@/app/actions";

type Props = {
  user?: { name: string; email: string; image?: string; isAdmin?: boolean } | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Navbar({ user }: Props) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function toggleLocale() {
    const next = locale === "en" ? "es" : "en";
    startTransition(async () => {
      await setLocale(next);
      window.location.reload();
    });
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 glass-panel rounded-none border-b border-[color-mix(in_srgb,var(--color-outline-variant)_40%,transparent)] flex items-center px-5 md:px-8">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2.5 flex-1 min-w-0 no-underline"
      >
        <Image
          src="/logos/DEPT.png"
          alt="Hot Prode"
          width={32}
          height={32}
          className="h-7 sm:h-9 w-auto shrink-0"
        />
        <span
          className="text-headline-md font-display text-on-surface truncate hidden sm:inline"
          style={{ fontSize: "var(--text-headline-md)", lineHeight: 1 }}
        >
          HOT PRODE 2026
        </span>
        <span
          className="text-headline-md font-display text-on-surface truncate sm:hidden"
          style={{ fontSize: "1.25rem", lineHeight: 1 }}
        >
          HOT PRODE
        </span>
        <Image
          src="/logos/hotchillidevs.png"
          alt="HotChilliDevs"
          width={140}
          height={32}
          className="h-6 w-auto shrink-0 hidden sm:inline"
        />
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-4 shrink-0">
        {/* Locale toggle */}
        <button
          type="button"
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full label-bold tracking-wider text-xs transition-all hover:opacity-80 cursor-pointer"
          style={{
            background: "var(--color-surface-container-high)",
            color: "var(--color-on-surface-variant)",
            border: "1px solid color-mix(in srgb, var(--color-outline-variant) 60%, transparent)",
          }}
        >
          <GlobeSimple size={16} />
          {locale === "en" ? "ES" : "EN"}
        </button>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 cursor-pointer"
              aria-label={t("userMenu")}
              aria-expanded={menuOpen}
            >
              {user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-primary-fixed"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-primary-fixed text-on-primary-fixed font-bold text-sm select-none"
                  style={{ background: "var(--color-primary-fixed)", color: "var(--color-on-primary-fixed)" }}
                >
                  {getInitials(user.name)}
                </div>
              )}
              <CaretDown
                size={20}
                className="text-on-surface-variant transition-transform"
                style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 z-[60] rounded-2xl p-2 flex flex-col gap-1 shadow-xl border border-[color-mix(in_srgb,var(--color-outline-variant)_60%,transparent)]"
                style={{ background: "var(--color-surface-container-high)", backdropFilter: "blur(20px)" }}
              >
                <div className="px-3 py-2 border-b border-outline-variant mb-1">
                  <p
                    className="text-on-surface font-semibold truncate"
                    style={{ fontSize: "var(--text-body-md)" }}
                  >
                    {user.name}
                  </p>
                  <p
                    className="text-on-surface-variant truncate"
                    style={{ fontSize: "var(--text-label-bold)" }}
                  >
                    {user.email}
                  </p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-high transition-colors no-underline"
                >
                  <UserCircle size={20} className="text-primary-fixed" />
                  <span
                    className="text-on-surface"
                    style={{ fontSize: "var(--text-body-md)", fontFamily: "var(--font-body)" }}
                  >
                    {t("myProfile")}
                  </span>
                </Link>

                {user.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-high transition-colors no-underline"
                  >
                    <ShieldStar size={20} className="text-coral" />
                    <span
                      className="text-on-surface"
                      style={{ fontSize: "var(--text-body-md)", fontFamily: "var(--font-body)" }}
                    >
                      {t("adminPanel")}
                    </span>
                  </Link>
                )}

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <SignOut size={20} className="text-error" />
                    <span
                      className="text-on-surface"
                      style={{ fontSize: "var(--text-body-md)", fontFamily: "var(--font-body)" }}
                    >
                      {t("signOut")}
                    </span>
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="label-bold text-primary-fixed hover:text-primary-container transition-colors no-underline tracking-widest"
          >
            {t("signIn")}
          </Link>
        )}
      </div>
    </header>
  );
}
