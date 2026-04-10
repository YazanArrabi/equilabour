import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getMyCompanyProfile,
  updateMyCompanyProfile,
  type CompanyProfile,
} from "@/api/companies";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

function empty(val: string | null | undefined): string {
  return val?.trim() ? val : "—";
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

const schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  location: z.string().optional(),
  industry: z.string().optional(),
  contactInfo: z.string().optional(),
  overview: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(profile: CompanyProfile): FormValues {
  return {
    companyName: profile.companyName,
    location: profile.location ?? "",
    industry: profile.industry ?? "",
    contactInfo: profile.contactInfo ?? "",
    overview: profile.overview ?? "",
  };
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      location: "",
      industry: "",
      contactInfo: "",
      overview: "",
    },
  });

  useEffect(() => {
    getMyCompanyProfile()
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
      const updated = await updateMyCompanyProfile({
        companyName: values.companyName,
        location: values.location?.trim() || null,
        industry: values.industry?.trim() || null,
        contactInfo: values.contactInfo?.trim() || null,
        overview: values.overview?.trim() || null,
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
          <p className="text-muted-foreground">Company Profile</p>
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
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company name</FormLabel>
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
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Technology, Healthcare" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact info</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="overview"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overview</FormLabel>
                      <FormControl>
                        <Textarea rows={5} {...field} />
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

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{profile.companyName}</h1>
          <p className="text-muted-foreground">Company Profile</p>
        </div>
        <Button variant="outline" size="sm" onClick={enterEditMode}>
          Edit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="mt-0.5">{empty(profile.location)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Industry</p>
            <p className="mt-0.5">{empty(profile.industry)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Contact</p>
            <p className="mt-0.5 whitespace-pre-wrap">{empty(profile.contactInfo)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{empty(profile.overview)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
