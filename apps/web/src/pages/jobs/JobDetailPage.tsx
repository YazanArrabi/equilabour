import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getJob,
  deleteJob,
  type Job,
  type EmploymentType,
  type ExperienceLevel,
} from "@/api/jobs";
import { applyToJob } from "@/api/applications";
import { ApiError } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: "Entry Level",
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
};

function formatPostedDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyResult, setApplyResult] = useState<"success" | "already_applied" | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId)
      .then(setJob)
      .catch((err) => {
        setFetchError(err instanceof ApiError ? err.message : "Failed to load job.");
      })
      .finally(() => setIsLoading(false));
  }, [jobId]);

  async function handleApply() {
    if (!jobId) return;
    setApplySubmitting(true);
    setApplyError(null);
    try {
      await applyToJob(jobId, { message: applyMessage.trim() || undefined });
      setApplyResult("success");
      setApplyOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === "ALREADY_APPLIED") {
        setApplyResult("already_applied");
        setApplyOpen(false);
      } else {
        setApplyError(err instanceof ApiError ? err.message : "An unexpected error occurred.");
      }
    } finally {
      setApplySubmitting(false);
    }
  }

  async function handleDelete() {
    if (!jobId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteJob(jobId);
      navigate("/jobs/mine");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete job.");
      setIsDeleting(false);
    }
  }

  if (isLoading) return <DetailSkeleton />;

  if (fetchError) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <Link to="/jobs" className="text-sm text-muted-foreground hover:underline">
          ← Back to listings
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
            <Badge variant="secondary">{EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</Badge>
            {job.status !== "active" && (
              <Badge variant={job.status === "deleted" ? "destructive" : "outline"}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {user?.role === "company" && user.profileId === job.companyProfileId && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/jobs/${job.id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        )}
      </div>

      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="mt-0.5">{job.location ?? "Remote / Not specified"}</p>
          </div>
          {(job.salary || job.payMin != null || job.payMax != null) && (
            <div>
              <p className="text-sm text-muted-foreground">Compensation</p>
              <p className="mt-0.5">
                {job.payMin != null && job.payMax != null
                  ? `$${job.payMin.toLocaleString()} – $${job.payMax.toLocaleString()} / yr`
                  : job.payMin != null
                  ? `From $${job.payMin.toLocaleString()} / yr`
                  : job.payMax != null
                  ? `Up to $${job.payMax.toLocaleString()} / yr`
                  : job.salary}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Posted</p>
            <p className="mt-0.5">{formatPostedDate(job.postedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{job.description}</p>
        </CardContent>
      </Card>

      {job.requiredSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((skill) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Worker apply section */}
      {user?.role === "worker" && (
        <div>
          {applyResult === "success" && (
            <p className="text-sm font-medium text-green-700">Application submitted.</p>
          )}
          {applyResult === "already_applied" && (
            <p className="text-sm text-muted-foreground">You have already applied to this job.</p>
          )}
          {applyResult === null && !applyOpen && (
            <Button onClick={() => setApplyOpen(true)}>Apply</Button>
          )}
          {applyOpen && (
            <Card>
              <CardHeader>
                <CardTitle>Apply for this job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {applyError && (
                  <Alert variant="destructive">
                    <AlertDescription>{applyError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Message (optional)</p>
                  <Textarea
                    rows={4}
                    placeholder="Introduce yourself or explain your interest…"
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApply} disabled={applySubmitting}>
                    {applySubmitting ? "Submitting…" : "Submit application"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setApplyOpen(false); setApplyError(null); }}
                    disabled={applySubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
