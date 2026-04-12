import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getMyWorkerProfile,
  updateMyWorkerProfile,
  getWorkerAiAnalysis,
  type WorkerProfile,
  type AIAnalysis,
} from "@/api/workers";
import { ApiError } from "@/api/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Briefcase, Mail, Phone, Sparkles, TrendingUp, AlertCircle } from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

function empty(val: string | null | undefined): string {
  return val?.trim() ? val : "—";
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// ─── tag input ────────────────────────────────────────────────────────────────

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInputValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) addTag(inputValue);
        }}
        placeholder={placeholder}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 cursor-default">
              {tag}
              <button
                type="button"
                className="ml-1 hover:text-destructive leading-none"
                onClick={() => onChange(value.filter((t) => t !== tag))}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI analysis card ─────────────────────────────────────────────────────────

function RatingBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color =
    value >= 8 ? "bg-green-500" : value >= 5 ? "bg-primary" : "bg-yellow-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground/70 w-8 text-right">
        {value}<span className="font-normal text-muted-foreground">/10</span>
      </span>
    </div>
  );
}

function CompletenessBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "bg-green-500" : value >= 50 ? "bg-primary" : "bg-yellow-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground/70 w-8 text-right">
        {value}<span className="font-normal text-muted-foreground">%</span>
      </span>
    </div>
  );
}

function AIAnalysisCard({ analysis, isLoading }: { analysis: AIAnalysis | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Profile Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.status === "failed") {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">
            AI analysis will appear here after you save your profile. The more detail you add, the better the insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { matchRecommendations: match, candidateRecommendations: candidate } = analysis;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Profile Analysis
          </CardTitle>
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
            Auto-updated on save
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Skill rating</p>
            <RatingBar value={analysis.skillRating} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Profile completeness</p>
            <CompletenessBar value={candidate.profileCompletenessScore} />
          </div>
        </div>

        {/* Summary */}
        {analysis.skillSummary && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
            <p className="text-sm leading-relaxed text-foreground/80">{analysis.skillSummary}</p>
          </div>
        )}

        {/* Top skills */}
        {analysis.topSkills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Top skills</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.topSkills.map((s) => (
                <Badge key={s} variant="secondary" className="bg-primary/8 text-primary border-0 text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggested roles & industries */}
        {(match.suggestedRoles.length > 0 || match.suggestedIndustries.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {match.suggestedRoles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Suggested roles</p>
                <ul className="space-y-0.5">
                  {match.suggestedRoles.map((r) => (
                    <li key={r} className="text-xs text-foreground/80 flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-primary/50 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {match.suggestedIndustries.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Suggested industries</p>
                <ul className="space-y-0.5">
                  {match.suggestedIndustries.map((i) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-primary/50 shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Recruiter notes */}
        {match.notes && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3 leading-relaxed">
            {match.notes}
          </p>
        )}

        {/* Strengths & areas for improvement */}
        {(candidate.strengths.length > 0 || candidate.areasForImprovement.length > 0) && (
          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-border/60">
            {candidate.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" /> Strengths
                </p>
                <ul className="space-y-0.5">
                  {candidate.strengths.map((s) => (
                    <li key={s} className="text-xs text-foreground/80 flex items-start gap-1">
                      <span className="h-1 w-1 rounded-full bg-green-400 shrink-0 mt-1.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {candidate.areasForImprovement.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Areas to improve</p>
                <ul className="space-y-0.5">
                  {candidate.areasForImprovement.map((a) => (
                    <li key={a} className="text-xs text-foreground/80 flex items-start gap-1">
                      <span className="h-1 w-1 rounded-full bg-yellow-400 shrink-0 mt-1.5" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── form schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  location: z.string().optional(),
  yearsOfExperience: z.number().min(0, "Must be 0 or more"),
  skills: z.array(z.string()),
  workExperienceSummary: z.string().optional(),
  pastJobTitles: z.array(z.string()),
  employmentHistory: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(profile: WorkerProfile): FormValues {
  return {
    fullName: profile.fullName,
    location: profile.location ?? "",
    yearsOfExperience: profile.yearsOfExperience,
    skills: profile.skills,
    workExperienceSummary: profile.workExperienceSummary ?? "",
    pastJobTitles: profile.pastJobTitles,
    employmentHistory: profile.employmentHistory ?? "",
  };
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function WorkerProfilePage() {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      location: "",
      yearsOfExperience: 0,
      skills: [],
      workExperienceSummary: "",
      pastJobTitles: [],
      employmentHistory: "",
    },
  });

  const fetchAnalysis = useCallback(() => {
    setIsAnalysisLoading(true);
    getWorkerAiAnalysis("me")
      .then((res) => setAnalysis(res.analysis))
      .catch(() => setAnalysis(null))
      .finally(() => setIsAnalysisLoading(false));
  }, []);

  useEffect(() => {
    getMyWorkerProfile()
      .then(setProfile)
      .catch((err) => {
        setFetchError(
          err instanceof ApiError ? err.message : "Failed to load profile.",
        );
      })
      .finally(() => setIsLoading(false));

    fetchAnalysis();
  }, [fetchAnalysis]);

  function enterEditMode() {
    if (!profile) return;
    form.reset(toFormValues(profile));
    setApiError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setApiError(null);
  }

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      const updated = await updateMyWorkerProfile({
        fullName: values.fullName,
        location: values.location?.trim() || null,
        yearsOfExperience: values.yearsOfExperience,
        skills: values.skills,
        workExperienceSummary: values.workExperienceSummary?.trim() || null,
        pastJobTitles: values.pastJobTitles,
        employmentHistory: values.employmentHistory?.trim() || null,
      });
      setProfile(updated);
      setIsEditing(false);
      // Refresh AI analysis — the backend runs it synchronously on save
      fetchAnalysis();
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : "An unexpected error occurred.",
      );
    }
  }

  if (isLoading) return <ProfileSkeleton />;

  if (fetchError) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) return null;

  // ── edit mode ──────────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Worker Profile</p>
        </div>

        {apiError && (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Type a skill and press Enter"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="workExperienceSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience summary</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pastJobTitles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Past job titles</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Type a title and press Enter"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment history</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  // ── read mode ──────────────────────────────────────────────────────────────

  const initials = profile.fullName
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const headlineTitle = profile.pastJobTitles[0] ?? null;

  const experienceLabel =
    profile.yearsOfExperience === 0
      ? "< 1 year experience"
      : profile.yearsOfExperience === 1
      ? "1 year experience"
      : `${profile.yearsOfExperience} years experience`;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      {/* Profile hero card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-5 min-w-0">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">{initials}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{profile.fullName}</h1>
              {headlineTitle && (
                <p className="text-muted-foreground text-sm mt-0.5">{headlineTitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {profile.location && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {profile.email}
                </span>
                {profile.phoneNumber && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {profile.phoneNumber}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  {experienceLabel}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={enterEditMode} className="shrink-0">
            Edit profile
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills added yet. Edit your profile to add some.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {empty(profile.workExperienceSummary)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Past job titles</p>
            {profile.pastJobTitles.length === 0 ? (
              <p className="text-sm">—</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.pastJobTitles.map((title) => (
                  <Badge key={title} variant="secondary">
                    {title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Employment history</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {empty(profile.employmentHistory)}
            </p>
          </div>
        </CardContent>
      </Card>

      <AIAnalysisCard analysis={analysis} isLoading={isAnalysisLoading} />
    </div>
  );
}
