import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
        isActive
          ? "text-primary bg-primary/8"
          : "text-foreground/70 hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-0 select-none shrink-0">
          <span className="text-xl font-black tracking-tight text-slate-800">Equi</span>
          <span className="text-xl font-black tracking-tight text-primary">Labour</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {user === null ? null : (
            <>
              <NavLink to="/jobs">Jobs</NavLink>
              <NavLink to="/workers">Workers</NavLink>
            </>
          )}
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-2 shrink-0">
          {user === null ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          ) : user.role === "worker" ? (
            <>
              <NavLink to="/applications/me">My Applications</NavLink>
              <NavLink to="/workers/me">Profile</NavLink>
              <Button variant="outline" size="sm" onClick={() => void logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/jobs/mine">My Jobs</NavLink>
              <NavLink to="/companies/me">Profile</NavLink>
              <Button variant="outline" size="sm" onClick={() => void logout()}>
                Log out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
