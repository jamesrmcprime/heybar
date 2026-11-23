import Link from "next/link";

type TopBarProps = {
  title?: string;
  showBrandMark?: boolean;
  cartBadge?: boolean;
};

export function TopBar({
  title,
  showBrandMark = false,
  cartBadge = false,
}: TopBarProps) {
  return (
    <header className="hb-topbar">
      {showBrandMark ? (
        <div className="hb-topbar__mark">
          Hey<em>Bar</em>
        </div>
      ) : (
        <h1 className="hb-topbar__title">{title}</h1>
      )}
      <Link
        href="/bottles"
        className="hb-icon-btn"
        aria-label="Cart (stub)"
        title="Cart sheet — coming soon"
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
          <path d="M6 6h15l-1.5 9h-12z" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M6 6L5 3H2" />
        </svg>
        {cartBadge ? <span className="hb-icon-btn__badge" /> : null}
      </Link>
    </header>
  );
}
