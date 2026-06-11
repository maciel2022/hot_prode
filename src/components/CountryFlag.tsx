import { Question } from "@phosphor-icons/react/dist/ssr";
import { getIsoCode } from "@/lib/flags";
import { hasFlag } from "country-flag-icons";
import * as Flags from "country-flag-icons/react/3x2";

type Props = {
  code: string;
  className?: string;
};

type FlagComponent = React.ComponentType<{ title: string; className?: string }>;

export default function CountryFlag({ code, className = "" }: Props) {
  if (code === "TBD") {
    return (
      <div
        className={`rounded-md flex items-center justify-center shrink-0 border border-dashed border-on-surface-variant/30 ${className}`}
        style={{ background: "var(--color-surface-container-high)" }}
      >
        <Question size={20} weight="bold" className="text-on-surface-variant/50" />
      </div>
    );
  }

  // Custom flags for England and Scotland (not available in country-flag-icons)
  if (code === "ENG") {
    return (
      <svg viewBox="0 0 1200 800" className={`object-cover rounded-md shrink-0 ${className}`}>
        <title>England</title>
        <rect width="1200" height="800" fill="#fff" />
        <rect x="480" width="240" height="800" fill="#CE1124" />
        <rect y="280" width="1200" height="240" fill="#CE1124" />
      </svg>
    );
  }

  if (code === "SCO") {
    return (
      <svg viewBox="0 0 1200 800" className={`object-cover rounded-md shrink-0 ${className}`}>
        <title>Scotland</title>
        <rect width="1200" height="800" fill="#005EB8" />
        <path d="M0,0 L1200,800 M1200,0 L0,800" stroke="#fff" strokeWidth="120" />
      </svg>
    );
  }

  const iso = getIsoCode(code);
  const FlagComp = (Flags as Record<string, FlagComponent>)[iso];

  if (!FlagComp || !hasFlag(iso)) {
    return (
      <div
        className={`rounded-md flex items-center justify-center shrink-0 ${className}`}
        style={{ background: "var(--color-surface-container-high)" }}
      >
        <span className="text-on-surface-variant font-display text-xs select-none">
          {code}
        </span>
      </div>
    );
  }

  return (
    <FlagComp
      title={code}
      className={`object-cover rounded-md shrink-0 ${className}`}
    />
  );
}
