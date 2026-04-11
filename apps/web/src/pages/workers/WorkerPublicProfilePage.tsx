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
import { MapPin, Briefcase } from "lucide-react";

function empty(val: string | null | undefined): string {
  return val?.trim() ? val : "—";
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
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

  const experienceLabel =
    profile.yearsOfExperience === 0
      ? "< 1 year experience"
      : profile.yearsOfExperience === 1
      ? "1 year experience"
      : `${profile.yearsOfExperience} years experience`;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      {/* Profile hero card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight">{profile.fullName}</h1>
            {headlineTitle && (
              <p className="text-muted-foreground text-sm mt-0.5">{headlineTitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {profile.location && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {profile.location}
                </span>
              )}
              {profile.yearsOfExperience >= 0 && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  {experienceLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills listed yet.</p>
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

      {/* Experience */}
      {(profile.workExperienceSummary || profile.pastJobTitles.length > 0 || profile.employmentHistory) && (
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.workExperienceSummary && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {profile.workExperienceSummary}
                </p>
              </div>
            )}
            {profile.pastJobTitles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Past job titles</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.pastJobTitles.map((title) => (
                    <Badge key={title} variant="secondary">
                      {title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.employmentHistory && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Employment history</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {empty(profile.employmentHistory)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
