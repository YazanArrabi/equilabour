import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-background">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="font-semibold text-lg text-foreground hover:text-primary transition-colors"
        >
          EquiLabour
        </Link>

        <nav className="flex items-center gap-1">
          {user === null ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          ) : user.role === "worker" ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/jobs">Jobs</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/applications/me">My Applications</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/workers/me">Profile</Link>
              </Button>
              <Button variant="outline" onClick={() => void logout()}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/jobs">Jobs</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/jobs/mine">My Jobs</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/companies/me">Profile</Link>
              </Button>
              <Button variant="outline" onClick={() => void logout()}>
                Logout
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
