"use client";

import { useMemo, useState } from "react";
import {
  BOTTLE_FILTERS,
  listBottles,
  type BottleFilter,
} from "@/data/bottles";
import { formatZar } from "@/lib/format";
import styles from "./BottleCatalogue.module.css";

export function BottleCatalogue() {
  const [filter, setFilter] = useState<BottleFilter>("All");
  const bottles = useMemo(() => listBottles(filter), [filter]);

  return (
    <>
      <p className="hb-caption">Sealed bottles only · prices ZAR (prototype)</p>
      <div className={styles.filters} role="tablist" aria-label="Category">
        {BOTTLE_FILTERS.map((chip) => (
          <button
            key={chip}
            type="button"
            role="tab"
            aria-selected={filter === chip}
            className={`hb-chip ${filter === chip ? "hb-chip--on" : ""}`}
            onClick={() => setFilter(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
      <ul className={styles.grid}>
        {bottles.map((bottle) => (
          <li key={bottle.id} className={styles.row}>
            <div
              className={`${styles.thumb} ${THUMB_TONES[toneIndex(bottle.id)]}`}
              aria-hidden="true"
            />
            <div className={styles.meta}>
              <div className={styles.name}>{bottle.name}</div>
              <div className={styles.spec}>
                {bottle.sizeMl} ml
                {bottle.abvPercent != null ? ` · ${bottle.abvPercent}% ABV` : ""}
                {` · ${bottle.category}`}
              </div>
              <div className={styles.foot}>
                <span className="hb-price">{formatZar(bottle.priceZar)}</span>
                <button
                  type="button"
                  className={styles.add}
                  aria-label={`Add ${bottle.name} to cart (stub)`}
                  disabled={!bottle.available}
                >
                  +
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

const THUMB_TONES = [
  styles.tone1,
  styles.tone2,
  styles.tone3,
  styles.tone4,
  styles.tone5,
] as const;

function toneIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % 5;
  }
  return hash;
}
