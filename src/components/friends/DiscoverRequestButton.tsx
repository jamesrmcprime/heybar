"use client";

import { useState } from "react";
import styles from "@/app/friends/friends.module.css";

type DiscoverRequestButtonProps = {
  personName: string;
  size?: "sm" | "lg";
};

/**
 * Outgoing friend-request shell — local UI only.
 */
export function DiscoverRequestButton({
  personName,
  size = "sm",
}: DiscoverRequestButtonProps) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <span className="hb-caption" role="status">
        Requested · {personName} (not saved)
      </span>
    );
  }

  return (
    <button
      type="button"
      className={
        size === "lg"
          ? styles.btnLgGhost
          : `${styles.btnSm} ${styles.ghost}`
      }
      onClick={() => setSent(true)}
      aria-label={`Request ${personName}`}
    >
      Request
    </button>
  );
}
