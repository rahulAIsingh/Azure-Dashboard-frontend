const version = import.meta.env.VITE_APP_VERSION || "1.0.0";
const env = import.meta.env.VITE_APP_ENV || "DEV";

export function Footer() {
  return (
    <footer className="border-t border-border/30 px-4 py-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono">
      <span>Azure FinOps Dashboard</span>
      <span className="opacity-40">•</span>
      <span>v{version}</span>
      <span className="opacity-40">•</span>
      <span className="uppercase">{env}</span>
      <span className="opacity-40">•</span>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  );
}
