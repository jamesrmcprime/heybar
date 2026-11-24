"use client";

import { useState } from "react";
import styles from "./InviteConfirm.module.css";

type InviteConfirmProps = {
  personName: string;
  orderTitle: string;
};

/**
 * Local UI shell — does not persist invite or mutate shared-order participants.
 */
export function InviteConfirm({ personName, orderTitle }: InviteConfirmProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <p className={styles.shellNote} role="status">
        Invite shell · {personName} marked for {orderTitle} (not persisted)
      </p>
    );
  }

  return (
    <button
      type="button"
      className={styles.primary}
      onClick={() => setConfirmed(true)}
    >
      Confirm invite
    </button>
  );
}
