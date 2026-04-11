import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getMyWorkerProfile,
  updateMyWorkerProfile,
  type WorkerProfile,
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
import { MapPin, Briefcase, Mail, Phone } from "lucide-react";

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

  useEffect(() => {
    getMyWorkerProfile()
      .then(setProfile)
      .catch((err) => {
        setFetchError(
          err instanceof ApiError ? err.message : "Failed to load profile.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

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
    </div>
  );
}
