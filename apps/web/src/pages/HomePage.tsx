import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Building2, Zap, Search, PlusCircle, FileText, Users } from "lucide-react";

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
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground text-base">
            Ready to find your next opportunity?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            onClick={() => navigate("/jobs")}
          >
            <CardContent className="pt-5 pb-5 space-y-2">
              <Search className="h-6 w-6 text-primary" />
              <p className="font-semibold">Browse Jobs</p>
              <p className="text-sm text-muted-foreground">
                Explore open positions that match your skills.
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            onClick={() => navigate("/applications/me")}
          >
            <CardContent className="pt-5 pb-5 space-y-2">
              <FileText className="h-6 w-6 text-primary" />
              <p className="font-semibold">My Applications</p>
              <p className="text-sm text-muted-foreground">
                Track the status of your submitted applications.
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            onClick={() => navigate("/workers/me")}
          >
            <CardContent className="pt-5 pb-5 space-y-2">
              <Users className="h-6 w-6 text-primary" />
              <p className="font-semibold">My Profile</p>
              <p className="text-sm text-muted-foreground">
                Keep your profile updated to stand out to employers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Authenticated company dashboard
  if (user?.role === "company") {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground text-base">
            Manage your job postings and find the right talent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            onClick={() => navigate("/jobs/new")}
          >
            <CardContent className="pt-5 pb-5 space-y-2">
              <PlusCircle className="h-6 w-6 text-primary" />
              <p className="font-semibold">Post a Job</p>
              <p className="text-sm text-muted-foreground">
                Create a new job posting and start receiving applicants.
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            onClick={() => navigate("/jobs/mine")}
          >
            <CardContent className="pt-5 pb-5 space-y-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <p className="font-semibold">My Jobs</p>
              <p className="text-sm text-muted-foreground">
                View and manage your active job listings.
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            onClick={() => navigate("/workers")}
          >
            <CardContent className="pt-5 pb-5 space-y-2">
              <Users className="h-6 w-6 text-primary" />
              <p className="font-semibold">Browse Workers</p>
              <p className="text-sm text-muted-foreground">
                Discover talented candidates available for hire.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Unauthenticated landing page
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
