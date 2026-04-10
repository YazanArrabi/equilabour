import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listWorkers,
  listWorkerLocations,
  type PublicWorkerProfile,
  type ExperienceLevel,
} from "@/api/workers";
import { ApiError } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationCombobox } from "@/components/ui/location-combobox";

const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: "Entry Level",
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
};

const ALL_EXPERIENCE_LEVELS = Object.keys(EXPERIENCE_LEVEL_LABELS) as ExperienceLevel[];

function WorkerCardSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

interface Filters {
  experienceLevel: ExperienceLevel[];
  location: string;
  skills: string;
}

const DEFAULT_FILTERS: Filters = {
  experienceLevel: [],
  location: "",
  skills: "",
};

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export default function WorkersPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<PublicWorkerProfile[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchWorkers(p: number, q: string, f: Filters) {
    setIsLoading(true);
    setError(null);
    listWorkers({
      page: p,
      limit: 20,
      search: q || undefined,
      location: f.location || undefined,
      experienceLevel: f.experienceLevel.length > 0 ? f.experienceLevel : undefined,
      skills: f.skills || undefined,
    })
      .then((result) => {
        setWorkers(result.items);
        setPage(result.page);
        setTotalPages(result.totalPages);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load workers.");
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchWorkers(1, "", DEFAULT_FILTERS);
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchWorkers(1, value, filters);
    }, 350);
  }

  function handleFilterChange(updated: Partial<Filters>) {
    const next = { ...filters, ...updated };
    setFilters(next);
    setPage(1);
    fetchWorkers(1, search, next);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    fetchWorkers(1, search, DEFAULT_FILTERS);
  }

  const hasActiveFilters =
    filters.experienceLevel.length > 0 ||
    filters.location !== "" ||
    filters.skills !== "";

  const activeFilterCount =
    (filters.experienceLevel.length > 0 ? 1 : 0) +
    (filters.location !== "" ? 1 : 0) +
    (filters.skills !== "" ? 1 : 0);

  function yearsLabel(years: number) {
    if (years === 0) return "< 1 year experience";
    if (years === 1) return "1 year experience";
    return `${years} years experience`;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Browse Workers</h1>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      <Input
        placeholder="Search by name or experience…"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
      />

      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Experience Level — checkboxes */}
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

              {/* Location — combobox */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</p>
                <LocationCombobox
                  value={filters.location}
                  onChange={(loc) => handleFilterChange({ location: loc })}
                  fetchLocations={listWorkerLocations}
                  placeholder="City or country"
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skills (comma-separated)</p>
                <Input
                  className="h-9"
                  placeholder="e.g. React, Node.js"
                  value={filters.skills}
                  onChange={(e) => handleFilterChange({ skills: e.target.value })}
                />
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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <WorkerCardSkeleton key={i} />)}
        </div>
      ) : workers.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-muted-foreground font-medium">No workers found</p>
          {(search || hasActiveFilters) && (
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or clearing the filters.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map((worker) => (
            <Card
              key={worker.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate(`/workers/${worker.id}`)}
            >
              <CardContent className="py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-base">{worker.fullName}</p>
                  {worker.location && (
                    <span className="text-sm text-muted-foreground shrink-0">{worker.location}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{yearsLabel(worker.yearsOfExperience)}</p>
                {worker.pastJobTitles.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {worker.pastJobTitles.slice(0, 3).join(" · ")}
                  </p>
                )}
                {worker.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {worker.skills.slice(0, 6).map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                    {worker.skills.length > 6 && (
                      <Badge variant="outline">+{worker.skills.length - 6}</Badge>
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
            onClick={() => { setPage((p) => p - 1); fetchWorkers(page - 1, search, filters); }}
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
            onClick={() => { setPage((p) => p + 1); fetchWorkers(page + 1, search, filters); }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
