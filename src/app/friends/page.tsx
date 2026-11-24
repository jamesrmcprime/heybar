import type { Metadata } from "next";
import { TopBar } from "@/components/drinker/TopBar";
import { FriendsGraph } from "@/components/friends/FriendsGraph";
import {
  buddies,
  discoverPeople,
  incomingRequests,
} from "@/data/friends";
import styles from "./friends.module.css";

export const metadata: Metadata = {
  title: "Friends",
};

/**
 * Friends tab — Night Seal graph shell.
 * Requests + Buddies + Discover (People folded in). No payment/XP rules.
 */
export default function FriendsPage() {
  return (
    <>
      <TopBar title="Friends" />
      <main className="hb-main">
        <FriendsGraph
          requests={incomingRequests()}
          buddies={buddies()}
          discover={discoverPeople()}
        />
        <p className={`hb-caption ${styles.footnote}`}>
          Graph shell · mutations not persisted · sealed bottles only · shared-order
          invite math OPEN until next slice
        </p>
      </main>
    </>
  );
}
