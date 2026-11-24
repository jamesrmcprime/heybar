"use client";

import Link from "next/link";
import { useState } from "react";
import { GuildBadge } from "@/components/flow/GuildBadge";
import { GUILDS } from "@/data/guilds";

export function GuildPicker() {
  const [selectedId, setSelectedId] = useState("gin");
  const selected = GUILDS.find((g) => g.id === selectedId) ?? GUILDS[0];

  return (
    <>
      <div
        className="hb-guild-grid"
        role="radiogroup"
        aria-label="Guild"
      >
        {GUILDS.map((guild) => {
          const checked = guild.id === selectedId;
          return (
            <button
              key={guild.id}
              type="button"
              role="radio"
              aria-checked={checked}
              className="hb-guild-tile"
              onClick={() => setSelectedId(guild.id)}
            >
              <span className="hb-guild-tile__top">
                <GuildBadge accent={guild.accent} />
                <span>
                  <span className="hb-guild-tile__name">{guild.name}</span>
                  <span className="hb-guild-tile__hint">
                    {guild.focus}
                    {checked ? " · Selected" : ""}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="hb-caption">
        Selection UI only — no invent earn/claim rules. Badge art is a CSS/SVG
        stand-in until Airtable artwork imports.
      </p>
      <div className="hb-sticky-cta">
        <Link href="/onboarding/terms" className="hb-btn hb-btn--primary">
          Join {selected.name} &amp; continue
        </Link>
      </div>
    </>
  );
}
