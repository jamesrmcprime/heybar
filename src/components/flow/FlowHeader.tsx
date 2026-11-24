import Link from "next/link";

type FlowHeaderProps = {
  title: string;
  backHref: string;
  backLabel?: string;
};

export function FlowHeader({
  title,
  backHref,
  backLabel = "Back",
}: FlowHeaderProps) {
  return (
    <header className="hb-flow-header">
      <Link
        href={backHref}
        className="hb-flow-header__back"
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
      <h1 className="hb-flow-header__title">{title}</h1>
    </header>
  );
}
