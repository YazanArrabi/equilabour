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
import { Building2, MapPin, Clock, CheckCircle2 } from "lucide-react";

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

const EMPLOYMENT_TYPE_COLORS: Record<EmploymentType, string> = {
  full_time: "bg-blue-50 text-blue-700 border border-blue-200",
  part_time: "bg-purple-50 text-purple-700 border border-purple-200",
  contract: "bg-orange-50 text-orange-700 border border-orange-200",
  internship: "bg-green-50 text-green-700 border border-green-200",
  freelance: "bg-teal-50 text-teal-700 border border-teal-200",
};

const EXPERIENCE_LEVEL_COLORS: Record<ExperienceLevel, string> = {
  entry: "bg-green-50 text-green-700 border border-green-200",
  junior: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  mid: "bg-orange-50 text-orange-700 border border-orange-200",
  senior: "bg-red-50 text-red-700 border border-red-200",
};

function formatPostedDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function formatPay(job: Job): string | null {
  if (job.payMin != null && job.payMax != null)
    return `$${job.payMin.toLocaleString()} – $${job.payMax.toLocaleString()} / yr`;
  if (job.payMin != null) return `From $${job.payMin.toLocaleString()} / yr`;
  if (job.payMax != null) return `Up to $${job.payMax.toLocaleString()} / yr`;
  return job.salary;
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

  const pay = formatPay(job);
  const isOwner = user?.role === "company" && user.profileId === job.companyProfileId;
  const canApply = user?.role === "worker" && applyResult === null && !applyOpen;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Back link */}
      <Link to="/jobs" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
        ← Back to listings
      </Link>

      {/* Hero section */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight">{job.title}</h1>
            <Link
              to={`/companies/${job.companyProfileId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="font-medium">{job.companyName}</span>
            </Link>
          </div>

          {isOwner && (
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

        {/* Badges + meta */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EMPLOYMENT_TYPE_COLORS[job.employmentType]}`}>
            {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EXPERIENCE_LEVEL_COLORS[job.experienceLevel]}`}>
            {EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}
          </span>
          {job.status !== "active" && (
            <Badge variant={job.status === "deleted" ? "destructive" : "outline"}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />
              {job.location}
            </span>
          )}
          {pay && (
            <span className="text-primary font-semibold text-base">{pay}</span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0" />
            {formatPostedDate(job.postedAt)}
          </span>
        </div>
      </div>

      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      {/* Worker apply CTA — prominent, above the fold */}
      {user?.role === "worker" && (
        <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-between gap-4">
          {applyResult === "success" && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Application submitted successfully!</span>
            </div>
          )}
          {applyResult === "already_applied" && (
            <p className="text-sm text-muted-foreground">You have already applied to this job.</p>
          )}
          {canApply && (
            <>
              <div className="min-w-0">
                <p className="font-medium text-sm">Interested in this role?</p>
                <p className="text-xs text-muted-foreground">Apply now and stand out to {job.companyName}</p>
              </div>
              <Button size="default" className="shrink-0" onClick={() => setApplyOpen(true)}>
                Apply now
              </Button>
            </>
          )}
        </div>
      )}

      {/* Apply form */}
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

      {/* Details card */}
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
              <p className="mt-0.5">{pay}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Posted</p>
            <p className="mt-0.5">{formatPostedDate(job.postedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </CardContent>
      </Card>

      {/* Required Skills */}
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
    </div>
  );
}
