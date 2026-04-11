import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listMyJobs,
  updateJobStatus,
  deleteJob,
  type Job,
  type EmploymentType,
  type ExperienceLevel,
} from "@/api/jobs";
import { ApiError } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Briefcase } from "lucide-react";

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

function StatusBadge({ status }: { status: Job["status"] }) {
  if (status === "active") {
    return (
      <Badge className="bg-green-100 text-green-800 border border-green-200">
        Active
      </Badge>
    );
  }
  if (status === "deleted") return <Badge variant="destructive">Deleted</Badge>;
  return <Badge variant="secondary">Closed</Badge>;
}

function formatPostedDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function RowSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
      </CardContent>
    </Card>
  );
}

export default function MyJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadJobs = useCallback((p: number) => {
    setIsLoading(true);
    setError(null);
    listMyJobs({ page: p, limit: 20 })
      .then((result) => {
        setJobs(result.items);
        setPage(result.page);
        setTotalPages(result.totalPages);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load jobs.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadJobs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handleStatusToggle(job: Job) {
    const newStatus = job.status === "active" ? "closed" : "active";
    setPendingAction(job.id);
    setActionError(null);
    try {
      await updateJobStatus(job.id, newStatus);
      loadJobs(page);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(jobId: string) {
    setPendingAction(jobId);
    setActionError(null);
    try {
      await deleteJob(jobId);
      loadJobs(page);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to delete job.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Jobs</h1>
        <Button size="sm" onClick={() => navigate("/jobs/new")}>Post a job</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-1">No jobs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Post your first job to start finding candidates.</p>
          <Button size="sm" onClick={() => navigate("/jobs/new")}>Post a job</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="space-y-1.5">
                  <p className="font-semibold text-base">{job.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={job.status} />
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EMPLOYMENT_TYPE_COLORS[job.employmentType]}`}>
                      {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EXPERIENCE_LEVEL_COLORS[job.experienceLevel]}`}>
                      {EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatPostedDate(job.postedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/jobs/${job.id}/applications`)}
                  >
                    View applications
                  </Button>
                  {job.status !== "deleted" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/jobs/${job.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pendingAction === job.id}
                        onClick={() => handleStatusToggle(job)}
                      >
                        {job.status === "active" ? "Close" : "Reactivate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pendingAction === job.id}
                        onClick={() => handleDelete(job.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
