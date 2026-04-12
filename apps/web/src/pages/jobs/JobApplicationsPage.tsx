import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getJobApplications,
  updateApplicationStatus,
  type Application,
  type ApplicationStatus,
} from "@/api/applications";
import { getWorkerAiAnalysis, type AIAnalysis } from "@/api/workers";
import { getJob } from "@/api/jobs";
import { ApiError } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Sparkles } from "lucide-react";

function formatPostedDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === "pending")
    return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">Pending</Badge>;
  if (status === "accepted")
    return <Badge className="bg-green-100 text-green-800 border border-green-200">Accepted</Badge>;
  return <Badge variant="destructive">Rejected</Badge>;
}

function AIScoreBadge({ analysis }: { analysis: AIAnalysis | null | undefined }) {
  if (!analysis || analysis.status === "failed") return null;
  const rating = analysis.skillRating;
  const color =
    rating >= 8
      ? "bg-green-50 text-green-700 border-green-200"
      : rating >= 5
      ? "bg-primary/8 text-primary border-primary/20"
      : "bg-yellow-50 text-yellow-700 border-yellow-200";
  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${color}`}>
      <Sparkles className="h-3 w-3 shrink-0" />
      <span>{rating}/10</span>
      {analysis.topSkills.length > 0 && (
        <span className="text-[10px] font-normal opacity-70 hidden sm:inline">
          · {analysis.topSkills.slice(0, 2).join(", ")}
        </span>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
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
  const [aiScores, setAiScores] = useState<Record<string, AIAnalysis | null>>({});

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
        // Fetch AI analysis for all applicants in parallel (best-effort)
        Promise.allSettled(
          result.items.map((app) =>
            getWorkerAiAnalysis(app.workerProfileId).then((res) => ({
              id: app.workerProfileId,
              analysis: res.analysis,
            })),
          ),
        ).then((results) => {
          const scores: Record<string, AIAnalysis | null> = {};
          for (const r of results) {
            if (r.status === "fulfilled") {
              scores[r.value.id] = r.value.analysis;
            }
          }
          setAiScores(scores);
        });
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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{heading}</h1>
        {!isLoading && applications.length > 0 && (
          <span className="text-sm text-muted-foreground">{applications.length} applicant{applications.length !== 1 ? "s" : ""}</span>
        )}
      </div>

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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-1">No applications yet</h3>
          <p className="text-sm text-muted-foreground">
            Applications will appear here once candidates apply.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const name = app.workerName ?? `Applicant #${app.workerProfileId.slice(0, 8)}`;
            const initials = getInitials(name);

            return (
              <Card key={app.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  {/* Header: avatar + name + status + AI score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/workers/${app.workerProfileId}`}
                          className="font-semibold hover:underline text-foreground"
                        >
                          {name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Applied {formatPostedDate(app.appliedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AIScoreBadge analysis={aiScores[app.workerProfileId]} />
                      <ApplicationStatusBadge status={app.status} />
                    </div>
                  </div>

                  {/* Message */}
                  {app.message ? (
                    <p className="text-sm whitespace-pre-wrap text-foreground/80 leading-relaxed border-l-2 border-border pl-3">
                      {app.message}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No message provided</p>
                  )}

                  {/* Actions */}
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
            );
          })}
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
