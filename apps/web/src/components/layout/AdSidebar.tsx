import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, FileText, Users, PlusCircle, Zap } from "lucide-react";

const WORKER_LINKS = [
  { icon: Briefcase, label: "Browse Jobs", to: "/jobs" },
  { icon: FileText, label: "My Applications", to: "/applications/me" },
  { icon: Users, label: "My Profile", to: "/workers/me" },
];

const COMPANY_LINKS = [
  { icon: PlusCircle, label: "Post a Job", to: "/jobs/new" },
  { icon: Briefcase, label: "My Jobs", to: "/jobs/mine" },
  { icon: Users, label: "Browse Workers", to: "/workers" },
];

function PromoCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-white/70 p-4 space-y-3">
      <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">
        Promoted
      </p>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold leading-snug">
          <span className="text-slate-800">Equi</span>
          <span className="text-primary">Labour</span>
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          AI-powered recruitment — connecting the right people with the right roles.
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Zap className="h-3 w-3 text-primary shrink-0" />
        Smart matching · Zero friction
      </div>
    </div>
  );
}

function QuickLinksCard({ role }: { role: "worker" | "company" }) {
  const links = role === "worker" ? WORKER_LINKS : COMPANY_LINKS;

  return (
    <div className="rounded-xl border border-border/60 bg-white/70 p-4 space-y-2">
      <p className="text-xs font-semibold text-foreground/70">Quick access</p>
      <div className="space-y-0.5">
        {links.map(({ icon: Icon, label, to }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-foreground/80 hover:bg-primary/8 hover:text-primary transition-colors"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AdSidebar() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-20 space-y-3">
        <PromoCard />
        <QuickLinksCard role={user.role as "worker" | "company"} />
      </div>
    </aside>
  );
}
