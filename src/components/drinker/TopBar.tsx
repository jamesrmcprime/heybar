import Link from "next/link";

type TopBarProps = {
  title?: string;
  showBrandMark?: boolean;
  cartBadge?: boolean;
  /** Profile mockup uses settings gear; other tabs keep cart. */
  action?: "cart" | "settings";
};

function CartIcon() {
  return (
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
  );
}

function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function TopBar({
  title,
  showBrandMark = false,
  cartBadge = false,
  action = "cart",
}: TopBarProps) {
  const isSettings = action === "settings";

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
        href={isSettings ? "/account" : "/bottles"}
        className="hb-icon-btn"
        aria-label={isSettings ? "Settings" : "Cart (stub)"}
        title={isSettings ? "Account & settings" : "Cart sheet — coming soon"}
      >
        {isSettings ? <SettingsIcon /> : <CartIcon />}
        {!isSettings && cartBadge ? (
          <span className="hb-icon-btn__badge" />
        ) : null}
      </Link>
    </header>
  );
}
