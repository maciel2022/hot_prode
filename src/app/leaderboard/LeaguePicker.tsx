"use client";

import { useRouter, useSearchParams } from "next/navigation";

type League = {
  id: string;
  name: string;
};

export default function LeaguePicker({ leagues }: { leagues: League[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLeague = searchParams.get("league") ?? "";

  function select(leagueId: string) {
    if (leagueId === "") {
      router.push("/leaderboard");
    } else {
      router.push(`/leaderboard?league=${leagueId}`);
    }
  }

  const items = [{ id: "", name: "Global" }, ...leagues];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ WebkitOverflowScrolling: "touch" }}>
      {items.map((league) => {
        const isActive = league.id === activeLeague;
        return (
          <button
            key={league.id}
            onClick={() => select(league.id)}
            className="shrink-0 px-4 py-2 rounded-full label-bold tracking-widest text-xs transition-all whitespace-nowrap"
            style={
              isActive
                ? {
                    background: "linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-primary-fixed-dim) 100%)",
                    color: "#003d2e",
                  }
                : {
                    background: "var(--color-surface-container)",
                    color: "var(--color-on-surface-variant)",
                    border: "1px solid var(--color-outline-variant)",
                  }
            }
          >
            {league.name}
          </button>
        );
      })}
    </div>
  );
}
