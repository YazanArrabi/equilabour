import { Link } from "react-router-dom";

const LINKS = [
  { label: "About", to: "/" },
  { label: "Help Center", to: "/" },
  { label: "Privacy Policy", to: "/" },
  { label: "Terms of Service", to: "/" },
  { label: "Accessibility", to: "/" },
  { label: "Contact", to: "/" },
];

export function Footer() {
  return (
    <footer className="border-t bg-white mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          <span className="text-sm font-black tracking-tight mr-2">
            <span className="text-slate-800">Equi</span>
            <span className="text-primary">Labour</span>
          </span>
          {LINKS.map((link, i) => (
            <span key={link.label} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground/40 text-xs">·</span>}
              <Link
                to={link.to}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          EquiLabour Corporation © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
