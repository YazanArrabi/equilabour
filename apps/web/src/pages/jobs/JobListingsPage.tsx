import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listJobs,
  type Job,
  type EmploymentType,
  type ExperienceLevel,
} from "@/api/jobs";
import { ApiError } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function JobCardSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default function JobListingsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  function loadJobs(p: number, q: string) {
    setIsLoading(true);
    setError(null);
    listJobs({ page: p, limit: 20, search: q || undefined })
      .then((result) => {
        setJobs(result.items);
        setPage(result.page);
        setTotalPages(result.totalPages);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load jobs.");
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadJobs(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInputRef.current?.value ?? "";
    setSearch(q);
    setPage(1);
    loadJobs(1, q);
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Job Listings</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input ref={searchInputRef} placeholder="Search jobs…" defaultValue={search} />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No jobs found.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="cursor-pointer hover:border-foreground/30 transition-colors"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <CardContent className="py-4 space-y-2">
                <p className="font-semibold text-base">{job.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
                  <Badge variant="secondary">{EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {job.location ?? "Remote / Not specified"}
                </p>
                {job.salary && (
                  <p className="text-sm text-muted-foreground">{job.salary}</p>
                )}
                <p className="text-xs text-muted-foreground">{formatPostedDate(job.postedAt)}</p>
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
