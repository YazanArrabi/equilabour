import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCompanyProfile, type CompanyProfile } from "@/api/companies";
import { ApiError } from "@/api/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Layers } from "lucide-react";

function empty(val: string | null | undefined): string {
  return val?.trim() ? val : "—";
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function CompanyPublicProfilePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    getCompanyProfile(companyId)
      .then(setProfile)
      .catch((err) => {
        if (err instanceof ApiError && err.code === "PROFILE_NOT_FOUND") {
          setFetchError("This company profile does not exist.");
        } else {
          setFetchError(
            err instanceof ApiError ? err.message : "Failed to load profile.",
          );
        }
      })
      .finally(() => setIsLoading(false));
  }, [companyId]);

  if (isLoading) return <ProfileSkeleton />;

  if (fetchError) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.companyName
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      {/* Company hero card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-primary">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight">{profile.companyName}</h1>
            {profile.industry && (
              <p className="text-muted-foreground text-sm mt-0.5">{profile.industry}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {profile.location && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {profile.location}
                </span>
              )}
              {profile.industry && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  {profile.industry}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Location</p>
            <p className="mt-0.5 text-sm">{empty(profile.location)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Industry</p>
            <p className="mt-0.5 text-sm">{empty(profile.industry)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contact</p>
            <p className="mt-0.5 text-sm whitespace-pre-wrap">{empty(profile.contactInfo)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      {profile.overview && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{profile.overview}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
