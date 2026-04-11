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
import { Search, SlidersHorizontal, MapPin, Users } from "lucide-react";

const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: "Entry Level",
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
};

const EXPERIENCE_LEVEL_COLORS: Record<ExperienceLevel, string> = {
  entry: "bg-green-50 text-green-700 border border-green-200",
  junior: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  mid: "bg-orange-50 text-orange-700 border border-orange-200",
  senior: "bg-red-50 text-red-700 border border-red-200",
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function WorkerCard({ worker, onClick }: { worker: PublicWorkerProfile; onClick: () => void }) {
  const experienceLevel = (() => {
    const yrs = worker.yearsOfExperience;
    if (yrs < 1) return "entry" as ExperienceLevel;
    if (yrs < 3) return "junior" as ExperienceLevel;
    if (yrs < 6) return "mid" as ExperienceLevel;
    return "senior" as ExperienceLevel;
  })();

  function yearsLabel(years: number) {
    if (years === 0) return "< 1 year exp.";
    if (years === 1) return "1 year exp.";
    return `${years} years exp.`;
  }

  return (
    <Card
      className="cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-3">
        {/* Name + avatar */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0 select-none">
            {getInitials(worker.fullName)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base leading-tight truncate">{worker.fullName}</p>
            {worker.pastJobTitles.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">
                {worker.pastJobTitles[0]}
              </p>
            )}
          </div>
        </div>

        {/* Experience badge + location */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EXPERIENCE_LEVEL_COLORS[experienceLevel]}`}>
            {yearsLabel(worker.yearsOfExperience)}
          </span>
          {worker.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {worker.location}
            </span>
          )}
        </div>

        {/* Skills */}
        {worker.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {worker.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
            ))}
            {worker.skills.length > 5 && (
              <Badge variant="outline" className="text-xs">+{worker.skills.length - 5}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WorkersPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<PublicWorkerProfile[]>([]);
  const [total, setTotal] = useState(0);
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
        setTotal(result.total);
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Browse Workers</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {total === 0
                ? "No workers found"
                : total === 1
                ? "1 worker available"
                : `${total.toLocaleString()} workers available`}
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
          placeholder="Search by name, job title, or skills…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

              {/* Location */}
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

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <WorkerCardSkeleton key={i} />)}
        </div>
      ) : workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-1">No workers found</h3>
          {(search || hasActiveFilters) ? (
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or clearing the filters.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No workers are registered yet. Check back soon.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onClick={() => navigate(`/workers/${worker.id}`)}
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
