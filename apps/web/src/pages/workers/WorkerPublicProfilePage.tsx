import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getWorkerProfile, type WorkerProfile } from "@/api/workers";
import { ApiError } from "@/api/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function WorkerPublicProfilePage() {
  const { workerId } = useParams<{ workerId: string }>();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!workerId) return;
    getWorkerProfile(workerId)
      .then(setProfile)
      .catch((err) => {
        if (err instanceof ApiError && err.code === "PROFILE_NOT_FOUND") {
          setFetchError("This worker profile does not exist.");
        } else {
          setFetchError(
            err instanceof ApiError ? err.message : "Failed to load profile.",
          );
        }
      })
      .finally(() => setIsLoading(false));
  }, [workerId]);

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

  const initials = profile.fullName
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const headlineTitle = profile.pastJobTitles[0] ?? null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold select-none shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight">{profile.fullName}</h1>
          <p className="text-muted-foreground">
            {headlineTitle ?? "Worker Profile"}
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
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="mt-0.5">{empty(profile.phoneNumber)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Experience</p>
            <p className="mt-0.5">
              {profile.yearsOfExperience === 0
                ? "—"
                : `${profile.yearsOfExperience} year${profile.yearsOfExperience === 1 ? "" : "s"}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Summary</p>
            <p className="mt-0.5 whitespace-pre-wrap">
              {empty(profile.workExperienceSummary)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Past job titles</p>
            {profile.pastJobTitles.length === 0 ? (
              <p className="mt-0.5">—</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile.pastJobTitles.map((title) => (
                  <Badge key={title} variant="secondary">
                    {title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Employment history</p>
            <p className="mt-0.5 whitespace-pre-wrap">
              {empty(profile.employmentHistory)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
