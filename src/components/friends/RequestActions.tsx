"use client";

import { useState } from "react";
import styles from "@/app/friends/friends.module.css";

type RequestActionsProps = {
  personName: string;
  layout?: "row" | "stack";
};

/**
 * Accept / Decline shell — local UI only.
 * Does not persist friendships or invent shared-order membership.
 */
export function RequestActions({
  personName,
  layout = "row",
}: RequestActionsProps) {
  const [state, setState] = useState<"pending" | "accepted" | "declined">(
    "pending",
  );

  if (state === "accepted") {
    return (
      <p className="hb-caption" role="status">
        Accepted shell · {personName} (not saved)
      </p>
    );
  }

  if (state === "declined") {
    return (
      <p className="hb-caption" role="status">
        Declined shell · {personName} (not saved)
      </p>
    );
  }

  return (
    <div
      className={layout === "stack" ? styles.actionsStack : styles.actions}
    >
      <button
        type="button"
        className={`${styles.btnSm} ${styles.accept}`}
        onClick={() => setState("accepted")}
      >
        Accept
      </button>
      <button
        type="button"
        className={`${styles.btnSm} ${styles.ghost}`}
        onClick={() => setState("declined")}
      >
        Decline
      </button>
    </div>
  );
}
