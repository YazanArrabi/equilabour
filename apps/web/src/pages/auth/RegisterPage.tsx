import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { register } from "@/api/auth";
import { ApiError } from "@/api/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["worker", "company"]),
    fullName: z.string().optional(),
    companyName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "worker" && !data.fullName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Full name is required",
        path: ["fullName"],
      });
    }
    if (data.role === "company" && !data.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company name is required",
        path: ["companyName"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      role: "worker",
      fullName: "",
      companyName: "",
    },
  });

  if (user !== null) return <Navigate to="/jobs" replace />;

  const selectedRole = form.watch("role");

  function handleRoleChange(role: "worker" | "company") {
    form.setValue("role", role, { shouldValidate: false });
    if (role === "worker") {
      form.setValue("companyName", "");
      form.clearErrors("companyName");
    } else {
      form.setValue("fullName", "");
      form.clearErrors("fullName");
    }
  }

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      await register({
        email: values.email,
        password: values.password,
        role: values.role,
        ...(values.role === "worker"
          ? { fullName: values.fullName }
          : { companyName: values.companyName }),
      });
      await refresh();
      navigate("/jobs");
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "An unexpected error occurred.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Join EquiLabour today</CardDescription>
        </CardHeader>
        <CardContent>
          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role toggle */}
              <FormField
                control={form.control}
                name="role"
                render={() => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={selectedRole === "worker" ? "default" : "outline"}
                          onClick={() => handleRoleChange("worker")}
                        >
                          Worker
                        </Button>
                        <Button
                          type="button"
                          variant={selectedRole === "company" ? "default" : "outline"}
                          onClick={() => handleRoleChange("company")}
                        >
                          Company
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional field */}
              {selectedRole === "worker" && (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {selectedRole === "company" && (
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm gap-1">
          <span className="text-muted-foreground">Already have an account?</span>
          <Link to="/login" className="font-medium underline underline-offset-4">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
