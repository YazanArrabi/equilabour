import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Zap, Star } from "lucide-react";

function AdCard() {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Banner */}
      <div className="h-16 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
        <span className="text-white font-black text-xl tracking-tight select-none">
          Equi<span className="opacity-80">Labour</span>
        </span>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          Promoted
        </p>

        <div className="space-y-1">
          <p className="font-semibold text-sm leading-snug">
            Find your next opportunity on EquiLabour
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connect with top companies and skilled workers. AI-powered matching gets you there faster.
          </p>
        </div>

        <div className="space-y-1.5 py-1">
          {[
            { icon: Briefcase, text: "1,000+ active job listings" },
            { icon: Users, text: "Skilled workers across all fields" },
            { icon: Zap, text: "AI-powered profile analysis" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
              {text}
            </div>
          ))}
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={() => navigate("/register")}
        >
          Get started — it's free
        </Button>
      </div>
    </div>
  );
}

function TipCard() {
  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500" />
        <p className="text-xs font-semibold">Profile tip</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Profiles with a complete experience section get <span className="font-medium text-foreground">3× more views</span> from companies. Add your past roles to stand out.
      </p>
    </div>
  );
}

export function AdSidebar() {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20 space-y-3">
        <AdCard />
        <TipCard />
      </div>
    </aside>
  );
}
