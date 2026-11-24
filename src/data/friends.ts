/**
 * Friends graph seed — Night Seal mockup + Glide intent.
 * Display / shell only: no live social backend; invite does not run shared-order math.
 *
 * Wave 1 Friends mockup roster (VQ-F2):
 *   Buddies = Sam Lady · Dave · Jane
 *   Discover = Alice Card (caption “Straight Up”)
 * Alex K / Riley M stay as order_peer for ORD-8F2A cast resolution only.
 */

import { MEMBERSHIP_TIERS } from "./memberships";
import { RANKS } from "./ranks";

export type FriendRelation =
  | "buddy"
  | "incoming_request"
  | "outgoing_request"
  | "discover"
  /** Present for shared-order personKey lookup — not listed on Friends tab. */
  | "order_peer";

export type FriendPerson = {
  id: string;
  initials: string;
  firstName: string;
  lastName: string;
  membershipId: string;
  rankId: string;
  relation: FriendRelation;
  /** Short caption override when membership · rank is not enough */
  note?: string;
};

export const FRIEND_PEOPLE: FriendPerson[] = [
  {
    id: "james-mcintosh",
    initials: "JM",
    firstName: "James",
    lastName: "McIntosh",
    membershipId: "top-shelf",
    rankId: "sipper",
    relation: "incoming_request",
    note: "Wants to connect",
  },
  {
    id: "sam-lady",
    initials: "SL",
    firstName: "Sam",
    lastName: "Lady",
    membershipId: "the-reserve",
    rankId: "sipper",
    relation: "buddy",
  },
  {
    id: "dave-person",
    initials: "DP",
    firstName: "Dave",
    lastName: "Person",
    membershipId: "neat",
    rankId: "taster",
    relation: "buddy",
  },
  {
    id: "jane-doe",
    initials: "JD",
    firstName: "Jane",
    lastName: "Doe",
    membershipId: "top-shelf",
    rankId: "pour-pro",
    relation: "buddy",
  },
  {
    id: "alice-card",
    initials: "AC",
    firstName: "Alice",
    lastName: "Card",
    membershipId: "straight-up",
    rankId: "taster",
    relation: "discover",
    /** Wave 1 mockup caption is membership only (no · Rank). */
    note: "Straight Up",
  },
  {
    id: "alex-k",
    initials: "AK",
    firstName: "Alex",
    lastName: "K",
    membershipId: "straight-up",
    rankId: "taster",
    relation: "order_peer",
  },
  {
    id: "riley-m",
    initials: "RM",
    firstName: "Riley",
    lastName: "M",
    membershipId: "the-reserve",
    rankId: "sipper",
    relation: "order_peer",
  },
];

export function getPerson(id: string): FriendPerson | undefined {
  return FRIEND_PEOPLE.find((p) => p.id === id);
}

export function displayName(person: FriendPerson): string {
  return `${person.firstName} ${person.lastName}`;
}

export function personCaption(person: FriendPerson): string {
  if (person.note) return person.note;
  const membership = MEMBERSHIP_TIERS.find((t) => t.id === person.membershipId);
  const rank = RANKS.find((r) => r.id === person.rankId);
  const left = membership?.name ?? "Member";
  const right = rank?.name;
  return right ? `${left} · ${right}` : left;
}

export function incomingRequests(): FriendPerson[] {
  return FRIEND_PEOPLE.filter((p) => p.relation === "incoming_request");
}

export function buddies(): FriendPerson[] {
  return FRIEND_PEOPLE.filter((p) => p.relation === "buddy");
}

export function discoverPeople(): FriendPerson[] {
  return FRIEND_PEOPLE.filter((p) => p.relation === "discover");
}

export function allPeople(): FriendPerson[] {
  return FRIEND_PEOPLE;
}

/** People that appear on Friends tab lists / person detail shells. */
export function friendsTabPeople(): FriendPerson[] {
  return FRIEND_PEOPLE.filter(
    (p) =>
      p.relation === "buddy" ||
      p.relation === "discover" ||
      p.relation === "incoming_request" ||
      p.relation === "outgoing_request",
  );
}
