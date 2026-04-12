import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Building2, Zap, Search, PlusCircle, FileText, Users, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

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
    <div className="max-w-5xl mx-auto px-4">

      {/* Hero */}
      <div className="pt-16 pb-12 text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          AI-powered matching · Now available
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
          Your next opportunity<br />
          <span className="text-primary">starts here.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          EquiLabour connects skilled workers with great companies across the region — with AI that helps the right people find each other.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Button size="lg" className="gap-2 px-8" onClick={() => navigate("/register")}>
            Create a free account <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/jobs")}>
            Browse open jobs
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">No credit card needed · Free to join</p>
      </div>

      {/* Two paths: worker and company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-12">
        <Card
          className="cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group border-2"
          onClick={() => navigate("/register")}
        >
          <CardContent className="p-7 space-y-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">I'm looking for work</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Create a profile, showcase your skills, and apply to jobs that match who you are.
              </p>
            </div>
            <ul className="space-y-1.5">
              {["Build a profile in minutes", "Get matched to relevant jobs", "Track all your applications"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity pt-1">
              Sign up as a worker <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group border-2"
          onClick={() => navigate("/register")}
        >
          <CardContent className="p-7 space-y-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">I'm hiring talent</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Post roles, browse candidates ranked by AI compatibility, and manage applicants in one place.
              </p>
            </div>
            <ul className="space-y-1.5">
              {["Post jobs in under 2 minutes", "AI ranks the best candidates first", "Accept or decline with one click"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity pt-1">
              Sign up as a company <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <div className="pb-14 space-y-8">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="text-2xl font-bold">Up and running in minutes</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              icon: PlusCircle,
              title: "Create your profile",
              description: "Tell us who you are — your skills, experience, and what you're looking for.",
            },
            {
              step: "2",
              icon: Zap,
              title: "AI works for you",
              description: "Our AI analyses your profile and surfaces the opportunities that fit you best.",
            },
            {
              step: "3",
              icon: Briefcase,
              title: "Apply or hire",
              description: "Workers apply in one click. Companies review ranked candidates and respond fast.",
            },
          ].map(({ step, icon: Icon, title, description }) => (
            <div key={step} className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {step}
                </span>
              </div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA strip */}
      <div className="mb-16 rounded-2xl bg-primary/5 border border-primary/10 p-8 text-center space-y-4">
        <h3 className="text-xl font-bold">Ready to get started?</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Join workers and companies already using EquiLabour to find the perfect match.
        </p>
        <Button size="lg" className="gap-2" onClick={() => navigate("/register")}>
          Create your free account <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <button
            className="font-medium text-primary underline underline-offset-4"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
        </p>
      </div>

    </div>
  );
}
