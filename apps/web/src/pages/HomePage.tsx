import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Building2, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Briefcase,
    title: "For Workers",
    description: "Browse open roles and apply with one click.",
  },
  {
    icon: Building2,
    title: "For Companies",
    description: "Post jobs and manage applicants in one place.",
  },
  {
    icon: Zap,
    title: "AI-Powered",
    description: "Smart profile analysis to match the right people.",
  },
];

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Case A — auth state not yet resolved
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  // Case B — authenticated worker
  if (user?.role === "worker") {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Welcome back, worker.</h1>
          <p className="text-muted-foreground">Find your next opportunity.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/jobs")}>Browse Jobs</Button>
          <Button variant="outline" onClick={() => navigate("/applications/me")}>
            My Applications
          </Button>
        </div>
      </div>
    );
  }

  // Case C — authenticated company
  if (user?.role === "company") {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Welcome back.</h1>
          <p className="text-muted-foreground">
            Manage your job postings and applicants.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/jobs/mine")}>My Jobs</Button>
          <Button variant="outline" onClick={() => navigate("/jobs/new")}>
            Post a Job
          </Button>
        </div>
      </div>
    );
  }

  // Case D — unauthenticated landing page
  return (
    <div className="max-w-2xl mx-auto py-20 px-4 space-y-14">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Find work. Find talent.
        </h1>
        <p className="text-lg text-muted-foreground">
          EquiLabour connects skilled workers with companies that need them.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button size="lg" onClick={() => navigate("/login")}>
            Find jobs
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/register")}>
            Post a job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardContent className="pt-6 space-y-2">
              <Icon className="h-6 w-6 text-muted-foreground" />
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
