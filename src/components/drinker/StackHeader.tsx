import Link from "next/link";

type StackHeaderProps = {
  title: string;
  backHref: string;
  backLabel?: string;
};

/**
 * Nested-route header inside the drinker tab shell (back + title).
 * Keeps Profile tab active for account / guild / rewards stacks.
 */
export function StackHeader({
  title,
  backHref,
  backLabel = "Back",
}: StackHeaderProps) {
  return (
    <header className="hb-stack-header">
      <Link
        href={backHref}
        className="hb-stack-header__back"
        aria-label={backLabel}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="hb-stack-header__title">{title}</h1>
    </header>
  );
}
