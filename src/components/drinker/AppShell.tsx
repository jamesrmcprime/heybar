import { TabBar } from "./TabBar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="hb-app hb-canvas">
      {children}
      <TabBar />
    </div>
  );
}
