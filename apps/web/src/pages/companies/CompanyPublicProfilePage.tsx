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

function empty(val: string | null | undefined): string {
  return val?.trim() ? val : "—";
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-32" />
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
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg font-bold select-none shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight">{profile.companyName}</h1>
          <p className="text-muted-foreground">
            {profile.industry ? profile.industry : "Company Profile"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="mt-0.5">{empty(profile.location)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Industry</p>
            <p className="mt-0.5">{empty(profile.industry)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Contact</p>
            <p className="mt-0.5 whitespace-pre-wrap">{empty(profile.contactInfo)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{empty(profile.overview)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
