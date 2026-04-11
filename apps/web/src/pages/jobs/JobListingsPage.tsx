import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listJobs,
  listJobLocations,
  type Job,
  type EmploymentType,
  type ExperienceLevel,
} from "@/api/jobs";
import { ApiError } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationCombobox } from "@/components/ui/location-combobox";
import { Search, SlidersHorizontal, Building2, MapPin, Clock } from "lucide-react";

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

// Color-coded badge styles for employment type
const EMPLOYMENT_TYPE_COLORS: Record<EmploymentType, string> = {
  full_time: "bg-blue-50 text-blue-700 border border-blue-200",
  part_time: "bg-purple-50 text-purple-700 border border-purple-200",
  contract: "bg-orange-50 text-orange-700 border border-orange-200",
  internship: "bg-green-50 text-green-700 border border-green-200",
  freelance: "bg-teal-50 text-teal-700 border border-teal-200",
};

// Color-coded badge styles for experience level
const EXPERIENCE_LEVEL_COLORS: Record<ExperienceLevel, string> = {
  entry: "bg-green-50 text-green-700 border border-green-200",
  junior: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  mid: "bg-orange-50 text-orange-700 border border-orange-200",
  senior: "bg-red-50 text-red-700 border border-red-200",
};

const ALL_EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[];
const ALL_EXPERIENCE_LEVELS = Object.keys(EXPERIENCE_LEVEL_LABELS) as ExperienceLevel[];

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

interface Filters {
  employmentType: EmploymentType[];
  experienceLevel: ExperienceLevel[];
  location: string;
  payMin: string;
  payMax: string;
}

const DEFAULT_FILTERS: Filters = {
  employmentType: [],
  experienceLevel: [],
  location: "",
  payMin: "",
  payMax: "",
};

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const pay = formatPay(job);
  return (
    <Card
      className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
      onClick={onClick}
    >
      <CardContent className="py-4 space-y-2.5">
        <div className="space-y-0.5">
          <p className="font-semibold text-base leading-snug">{job.title}</p>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{job.companyName}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EMPLOYMENT_TYPE_COLORS[job.employmentType]}`}>
            {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EXPERIENCE_LEVEL_COLORS[job.experienceLevel]}`}>
            {EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {job.location}
            </span>
          )}
          {pay && <span className="text-primary font-medium">{pay}</span>}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatPostedDate(job.postedAt)}
        </p>
      </CardContent>
    </Card>
  );
}

export default function JobListingsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchJobs(p: number, q: string, f: Filters) {
    setIsLoading(true);
    setError(null);
    listJobs({
      page: p,
      limit: 20,
      search: q || undefined,
      location: f.location || undefined,
      employmentType: f.employmentType.length > 0 ? f.employmentType : undefined,
      experienceLevel: f.experienceLevel.length > 0 ? f.experienceLevel : undefined,
      payMin: f.payMin !== "" ? Number(f.payMin) : undefined,
      payMax: f.payMax !== "" ? Number(f.payMax) : undefined,
    })
      .then((result) => {
        setJobs(result.items);
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load jobs.");
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchJobs(1, "", DEFAULT_FILTERS);
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchJobs(1, value, filters);
    }, 350);
  }

  function handleFilterChange(updated: Partial<Filters>) {
    const next = { ...filters, ...updated };
    setFilters(next);
    setPage(1);
    fetchJobs(1, search, next);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    fetchJobs(1, search, DEFAULT_FILTERS);
  }

  const hasActiveFilters =
    filters.employmentType.length > 0 ||
    filters.experienceLevel.length > 0 ||
    filters.location !== "" ||
    filters.payMin !== "" ||
    filters.payMax !== "";

  const activeFilterCount =
    (filters.employmentType.length > 0 ? 1 : 0) +
    (filters.experienceLevel.length > 0 ? 1 : 0) +
    (filters.location !== "" ? 1 : 0) +
    (filters.payMin !== "" ? 1 : 0) +
    (filters.payMax !== "" ? 1 : 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Job Listings</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {total === 0
                ? "No jobs found"
                : total === 1
                ? "1 job available"
                : `${total.toLocaleString()} jobs available`}
            </p>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search jobs by title or description…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Employment Type */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Employment type</p>
                <div className="space-y-1.5">
                  {ALL_EMPLOYMENT_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer text-sm select-none">
                      <input
                        type="checkbox"
                        className="accent-primary h-4 w-4 rounded"
                        checked={filters.employmentType.includes(type)}
                        onChange={() =>
                          handleFilterChange({
                            employmentType: toggleItem(filters.employmentType, type),
                          })
                        }
                      />
                      {EMPLOYMENT_TYPE_LABELS[type]}
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Experience level</p>
                <div className="space-y-1.5">
                  {ALL_EXPERIENCE_LEVELS.map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer text-sm select-none">
                      <input
                        type="checkbox"
                        className="accent-primary h-4 w-4 rounded"
                        checked={filters.experienceLevel.includes(level)}
                        onChange={() =>
                          handleFilterChange({
                            experienceLevel: toggleItem(filters.experienceLevel, level),
                          })
                        }
                      />
                      {EXPERIENCE_LEVEL_LABELS[level]}
                    </label>
                  ))}
                </div>
              </div>

              {/* Right column: location + pay */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</p>
                  <LocationCombobox
                    value={filters.location}
                    onChange={(loc) => handleFilterChange({ location: loc })}
                    fetchLocations={listJobLocations}
                    placeholder="City or country"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min pay (USD/yr)</p>
                  <Input
                    className="h-9"
                    type="number"
                    min={0}
                    placeholder="e.g. 60000"
                    value={filters.payMin}
                    onChange={(e) => handleFilterChange({ payMin: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max pay (USD/yr)</p>
                  <Input
                    className="h-9"
                    type="number"
                    min={0}
                    placeholder="e.g. 120000"
                    value={filters.payMax}
                    onChange={(e) => handleFilterChange({ payMax: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  Clear all filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-muted-foreground font-medium">No jobs found</p>
          {(search || hasActiveFilters) && (
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or clearing the filters.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => navigate(`/jobs/${job.id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => { setPage((p) => p - 1); fetchJobs(page - 1, search, filters); }}
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
            onClick={() => { setPage((p) => p + 1); fetchJobs(page + 1, search, filters); }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
