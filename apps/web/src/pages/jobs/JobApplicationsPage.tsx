import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getJobApplications,
  updateApplicationStatus,
  type Application,
  type ApplicationStatus,
} from "@/api/applications";
import { getJob } from "@/api/jobs";
import { ApiError } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

function formatPostedDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === "pending")
    return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">Pending</Badge>;
  if (status === "accepted")
    return <Badge className="bg-green-100 text-green-800 border border-green-200">Accepted</Badge>;
  return <Badge variant="destructive">Rejected</Badge>;
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-1/3" />
      </CardContent>
    </Card>
  );
}

export default function JobApplicationsPage() {
  const { jobId } = useParams<{ jobId: string }>();

  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  // Best-effort job title fetch
  useEffect(() => {
    if (!jobId) return;
    getJob(jobId)
      .then((job) => setJobTitle(job.title))
      .catch(() => {/* degrade gracefully — heading falls back to "Applications" */});
  }, [jobId]);

  // Applications list fetch
  useEffect(() => {
    if (!jobId) return;
    setIsLoading(true);
    setError(null);
    getJobApplications(jobId, { page, limit: 20 })
      .then((result) => {
        setApplications(result.items);
        setPage(result.page);
        setTotalPages(result.totalPages);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load applications.");
      })
      .finally(() => setIsLoading(false));
  }, [jobId, page]);

  async function handleAction(applicationId: string, status: "accepted" | "rejected") {
    setPendingAction(applicationId);
    setActionErrors((prev) => {
      const next = { ...prev };
      delete next[applicationId];
      return next;
    });
    try {
      await updateApplicationStatus(applicationId, status);
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a)),
      );
    } catch (err) {
      setActionErrors((prev) => ({
        ...prev,
        [applicationId]: err instanceof ApiError ? err.message : "Action failed.",
      }));
    } finally {
      setPendingAction(null);
    }
  }

  const heading = jobTitle ? `${jobTitle} — Applications` : "Applications";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <Link
          to={jobId ? `/jobs/${jobId}` : "/jobs/mine"}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to job
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{heading}</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications yet for this job.</p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/workers/${app.workerProfileId}`}
                    className="font-semibold hover:underline"
                  >
                    {app.workerName ?? `Applicant #${app.workerProfileId.slice(0, 8)}`}
                  </Link>
                  <ApplicationStatusBadge status={app.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Applied {formatPostedDate(app.appliedAt)}
                </p>
                {app.message ? (
                  <p className="text-sm whitespace-pre-wrap">{app.message}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No message provided</p>
                )}
                {app.status === "pending" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={pendingAction === app.id}
                        onClick={() => handleAction(app.id, "accepted")}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pendingAction === app.id}
                        onClick={() => handleAction(app.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                    {actionErrors[app.id] && (
                      <p className="text-sm text-destructive">{actionErrors[app.id]}</p>
                    )}
                  </div>
                )}
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
