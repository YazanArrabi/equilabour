import { useState, useRef } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { register, verifyEmail, verifyPhone, resendOtp, type RegisterInput } from "@/api/auth";
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

// ---------------------------------------------------------------------------
// Step 1 — Registration form schema
// ---------------------------------------------------------------------------

const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phoneNumber: z
      .string()
      .trim()
      .regex(
        /^\+[1-9]\d{7,14}$/,
        "Use international format — e.g. +971501234567",
      ),
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

type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Step 2 / 3 — OTP input schema
// ---------------------------------------------------------------------------

const otpSchema = z.object({
  code: z
    .string()
    .length(6, "Must be exactly 6 digits")
    .regex(/^\d{6}$/, "Digits only"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

// ---------------------------------------------------------------------------
// Stepper indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { label: "Account" },
    { label: "Email" },
    { label: "Phone" },
  ];

  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={[
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                done
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "border-2 border-primary text-primary"
                    : "border-2 border-muted text-muted-foreground",
              ].join(" ")}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : n}
            </div>
            <span
              className={`text-xs hidden sm:inline ${active ? "font-medium" : "text-muted-foreground"}`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="h-px w-6 bg-border flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OTP input — 6 individual digit boxes
// ---------------------------------------------------------------------------

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const chars = value.split("").slice(0, 6);
    chars[i] = digit;
    const next = chars.join("").slice(0, 6);
    onChange(next);
    if (digit && i < 5) {
      inputs.current[i + 1]?.focus();
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-10 h-12 text-center text-lg font-semibold border rounded-md
                     focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [pendingToken, setPendingToken] = useState<string>("");
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [registeredPhone, setRegisteredPhone] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [otpValue, setOtpValue] = useState<string>("");

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      phoneNumber: "",
      role: "worker",
      fullName: "",
      companyName: "",
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  if (user !== null) return <Navigate to="/jobs" replace />;

  const selectedRole = registerForm.watch("role");

  function handleRoleChange(role: "worker" | "company") {
    registerForm.setValue("role", role, { shouldValidate: false });
    if (role === "worker") {
      registerForm.setValue("companyName", "");
      registerForm.clearErrors("companyName");
    } else {
      registerForm.setValue("fullName", "");
      registerForm.clearErrors("fullName");
    }
  }

  function startResendCountdown() {
    setResendCountdown(30);
    const interval = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  // Step 1 submit
  async function onRegisterSubmit(values: RegisterFormValues) {
    setApiError(null);
    try {
      const payload: RegisterInput = {
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        role: values.role,
        ...(values.role === "worker"
          ? { fullName: values.fullName }
          : { companyName: values.companyName }),
      };

      const result = await register(payload);
      setPendingToken(result.pendingToken);
      setRegisteredEmail(values.email);
      setRegisteredPhone(values.phoneNumber);
      setOtpValue("");
      setStep(2);
      startResendCountdown();
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_ALREADY_IN_USE") {
        registerForm.setError("email", { message: "This email address is already registered." });
      } else if (err instanceof ApiError && err.code === "PHONE_ALREADY_IN_USE") {
        registerForm.setError("phoneNumber", { message: "This phone number is already registered." });
      } else {
        setApiError(err instanceof ApiError ? err.message : "An unexpected error occurred.");
      }
    }
  }

  // Step 2 submit (email OTP)
  async function onVerifyEmailSubmit(values: OtpFormValues) {
    setApiError(null);
    try {
      const result = await verifyEmail({ pendingToken, code: values.code });
      setPendingToken(result.pendingToken);
      setOtpValue("");
      otpForm.reset();
      setStep(3);
      startResendCountdown();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "An unexpected error occurred.");
    }
  }

  // Step 3 submit (phone OTP)
  async function onVerifyPhoneSubmit(values: OtpFormValues) {
    setApiError(null);
    try {
      await verifyPhone({ pendingToken, code: values.code });
      await refresh();
      navigate("/jobs");
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "An unexpected error occurred.");
    }
  }

  async function handleResend() {
    setApiError(null);
    try {
      await resendOtp({ pendingToken });
      startResendCountdown();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to resend code.");
    }
  }

  // Sync OTP input value into react-hook-form
  function handleOtpChange(v: string) {
    setOtpValue(v);
    otpForm.setValue("code", v, { shouldValidate: v.length === 6 });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      <div className="flex items-center gap-0 select-none">
        <span className="text-2xl font-black tracking-tight text-slate-800">Equi</span>
        <span className="text-2xl font-black tracking-tight text-primary">Labour</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <StepIndicator current={step} />
          {step === 1 && (
            <>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>Join EquiLabour today</CardDescription>
            </>
          )}
          {step === 2 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" /> Verify your email
              </CardTitle>
              <CardDescription>
                We sent a 6-digit code to <strong>{registeredEmail}</strong>
              </CardDescription>
            </>
          )}
          {step === 3 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" /> Verify your phone
              </CardTitle>
              <CardDescription>
                We sent a 6-digit code to <strong>{registeredPhone}</strong>
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* ---- Step 1: Registration form ---- */}
          {step === 1 && (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
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
                  control={registerForm.control}
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
                <FormField
                  control={registerForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+971501234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role toggle */}
                <FormField
                  control={registerForm.control}
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

                {selectedRole === "worker" && (
                  <FormField
                    control={registerForm.control}
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
                    control={registerForm.control}
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
                  disabled={registerForm.formState.isSubmitting}
                >
                  {registerForm.formState.isSubmitting ? "Creating account..." : "Continue"}
                </Button>
              </form>
            </Form>
          )}

          {/* ---- Step 2 & 3: OTP entry ---- */}
          {(step === 2 || step === 3) && (
            <Form {...otpForm}>
              <form
                onSubmit={otpForm.handleSubmit(
                  step === 2 ? onVerifyEmailSubmit : onVerifyPhoneSubmit,
                )}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <OtpInput value={otpValue} onChange={handleOtpChange} />
                  <FormField
                    control={otpForm.control}
                    name="code"
                    render={() => (
                      <FormItem>
                        <FormMessage className="text-center" />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={otpForm.formState.isSubmitting || otpValue.length < 6}
                >
                  {otpForm.formState.isSubmitting ? "Verifying..." : "Verify"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive a code?{" "}
                  {resendCountdown > 0 ? (
                    <span>Resend in {resendCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      className="font-medium text-primary underline underline-offset-4"
                      onClick={handleResend}
                    >
                      Resend
                    </button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </CardContent>

        {step === 1 && (
          <CardFooter className="justify-center text-sm gap-1">
            <span className="text-muted-foreground">Already have an account?</span>
            <Link to="/login" className="font-medium underline underline-offset-4">
              Sign in
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
