/**
 * Friends graph seed — Night Seal mockup + Glide intent.
 * Display / shell only: no live social backend; invite does not run shared-order math.
 */

import { MEMBERSHIP_TIERS } from "./memberships";
import { RANKS } from "./ranks";

export type FriendRelation =
  | "buddy"
  | "incoming_request"
  | "outgoing_request"
  | "discover";

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
    id: "alex-k",
    initials: "AK",
    firstName: "Alex",
    lastName: "K",
    membershipId: "straight-up",
    rankId: "taster",
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
  },
  {
    id: "riley-m",
    initials: "RM",
    firstName: "Riley",
    lastName: "M",
    membershipId: "the-reserve",
    rankId: "sipper",
    relation: "discover",
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
