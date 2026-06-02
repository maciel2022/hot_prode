import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import LocaleToggle from "@/components/LocaleToggle";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign In — PRODEPT 2026" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* FIFA 2026 background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src="/images/backgraound_fifa_2026.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      {/* Card */}
      <div className="glass-panel w-full max-w-md px-6 py-5 sm:px-8 sm:py-6 flex flex-col gap-4 relative z-10">
        {/* Locale toggle */}
        <div className="absolute top-4 right-4">
          <LocaleToggle />
        </div>

        {/* Logos row */}
        <div className="flex items-center justify-center gap-4">
          <Image
            src="/logos/DEPT.png"
            alt="Hot Prode"
            width={64}
            height={64}
            className="h-14 w-auto"
          />
          <span
            className="text-outline-variant text-2xl font-thin select-none"
            aria-hidden="true"
          >
            &times;
          </span>
          <Image
            src="/logos/fifa_mundial_2026.png"
            alt="FIFA World Cup 2026"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
        </div>

        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span
              className="font-display text-on-surface tracking-widest"
              style={{
                fontSize: "var(--text-headline-md)",
                lineHeight: 1,
              }}
            >
              HOT PRODE 2026
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-on-surface-variant text-xs font-body">by</span>
            <Image
              src="/logos/hotchillidevs.png"
              alt="HotChilliDevs"
              width={140}
              height={32}
              className="h-10 sm:h-12 w-auto"
            />
          </div>

          <span className="bg-primary-container text-on-primary-container label-bold rounded-full px-3 py-1">
            {t("exclusiveAccess")}
          </span>

          <p
            className="font-body text-on-surface-variant text-center mt-1"
            style={{
              fontSize: "var(--text-body-md)",
              lineHeight: "var(--text-body-md--line-height)",
            }}
          >
            {t("signInSubtitle")}
          </p>
        </div>

        <LoginForm />

        <div className="flex flex-col items-center gap-2 pt-2 border-t border-outline-variant">
          <p
            className="font-body text-on-surface-variant"
            style={{ fontSize: "var(--text-body-md)" }}
          >
            {t("noAccount")}
          </p>
          <Link
            href="/register"
            className="label-bold text-primary-fixed hover:text-primary-container transition-colors no-underline tracking-widest"
          >
            {t("createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
