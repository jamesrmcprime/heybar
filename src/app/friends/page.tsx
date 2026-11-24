import type { Metadata } from "next";
import { TopBar } from "@/components/drinker/TopBar";
import { FriendsGraph } from "@/components/friends/FriendsGraph";
import {
  buddies,
  discoverPeople,
  incomingRequests,
} from "@/data/friends";

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
      </main>
    </>
  );
}
