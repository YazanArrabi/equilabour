import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Building2, Zap, Search, PlusCircle, FileText, Users, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: Briefcase,
    title: "For Workers",
    description: "Browse open roles and apply with one click. Your next opportunity is waiting.",
  },
  {
    icon: Building2,
    title: "For Companies",
    description: "Post jobs and manage applicants in one place. Find the right talent fast.",
  },
  {
    icon: Zap,
    title: "AI-Powered",
    description: "Smart profile analysis helps match the right candidates to the right roles.",
  },
];

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  // Authenticated worker dashboard
  if (user?.role === "worker") {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Ready to find your next opportunity?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group"
            onClick={() => navigate("/jobs")}
          >
            <CardContent className="p-5 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Browse Jobs</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Explore open positions that match your skills.
                </p>
              </div>
              <div className="flex items-center text-xs text-primary font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group"
            onClick={() => navigate("/applications/me")}
          >
            <CardContent className="p-5 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">My Applications</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Track the status of your submitted applications.
                </p>
              </div>
              <div className="flex items-center text-xs text-primary font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group"
            onClick={() => navigate("/workers/me")}
          >
            <CardContent className="p-5 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">My Profile</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Keep your profile updated to stand out to employers.
                </p>
              </div>
              <div className="flex items-center text-xs text-primary font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Edit <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Authenticated company dashboard
  if (user?.role === "company") {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Manage your job postings and find the right talent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group"
            onClick={() => navigate("/jobs/new")}
          >
            <CardContent className="p-5 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <PlusCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Post a Job</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Create a new job posting and start receiving applicants.
                </p>
              </div>
              <div className="flex items-center text-xs text-primary font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Create <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group"
            onClick={() => navigate("/jobs/mine")}
          >
            <CardContent className="p-5 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">My Jobs</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  View and manage your active job listings.
                </p>
              </div>
              <div className="flex items-center text-xs text-primary font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Manage <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group"
            onClick={() => navigate("/workers")}
          >
            <CardContent className="p-5 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Browse Workers</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Discover talented candidates available for hire.
                </p>
              </div>
              <div className="flex items-center text-xs text-primary font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Unauthenticated landing page
  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Hero */}
      <div className="py-20 text-center space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
          Find work.<br />
          <span className="text-primary">Find talent.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          EquiLabour connects skilled workers with companies that need them — fast, fair, and straightforward.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button size="lg" onClick={() => navigate("/register")}>
            Get started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/jobs")}>
            Browse jobs
          </Button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pb-16">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="border bg-card">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
