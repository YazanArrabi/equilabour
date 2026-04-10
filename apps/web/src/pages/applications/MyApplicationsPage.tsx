import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMyApplications, type Application, type ApplicationStatus } from "@/api/applications";
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
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

export default function MyApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getMyApplications({ page, limit: 20 })
      .then((result) => {
        setApplications(result.items);
        setPage(result.page);
        setTotalPages(result.totalPages);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load applications.");
      })
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">My Applications</h1>

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
        <div className="space-y-3 text-center py-8">
          <p className="text-sm text-muted-foreground">You haven't applied to any jobs yet.</p>
          <Button onClick={() => navigate("/jobs")}>Browse jobs</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const messagePreview = app.message
              ? app.message.length > 120
                ? app.message.slice(0, 120) + "…"
                : app.message
              : null;

            return (
              <Card key={app.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/jobs/${app.jobPostingId}`}
                      className="font-semibold hover:underline"
                    >
                      Job #{app.jobPostingId.slice(0, 8)}
                    </Link>
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applied {formatPostedDate(app.appliedAt)}
                  </p>
                  {messagePreview ? (
                    <p className="text-sm">{messagePreview}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No message provided</p>
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
