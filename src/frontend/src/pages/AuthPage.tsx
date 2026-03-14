import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppPage } from "../hooks/useAuth";

interface AuthPageProps {
  onRegister: (name: string, role: string) => Promise<void>;
  onLogin: () => void;
  onBack: () => void;
  isLoggingIn: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  currentPage: AppPage;
}

const roleOptions = [
  {
    value: "patient",
    label: "Patient",
    desc: "Book tokens, track queue",
    icon: <User className="w-4 h-4" />,
    color: "text-teal-400",
  },
  {
    value: "doctor",
    label: "Doctor",
    desc: "Manage your patient queue",
    icon: <Stethoscope className="w-4 h-4" />,
    color: "text-emerald-400",
  },
  {
    value: "admin",
    label: "Admin / Reception",
    desc: "Full system management",
    icon: <ShieldCheck className="w-4 h-4" />,
    color: "text-amber-400",
  },
];

export function AuthPage({
  onRegister,
  onLogin,
  onBack,
  isLoggingIn,
  isLoading,
  isAuthenticated,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please connect your wallet first");
      return;
    }
    setIsSubmitting(true);
    try {
      await onRegister(name.trim(), role);
      toast.success("Welcome to ToknFlow!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.11 0.03 255) 0%, oklch(0.09 0.02 260) 50%, oklch(0.10 0.03 240) 100%)",
      }}
    >
      {/* Background orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-15 blur-3xl"
        style={{ background: "oklch(0.72 0.18 195)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: "oklch(0.68 0.22 165)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-4 text-muted-foreground hover:text-foreground gap-2"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <div className="glass-dark rounded-3xl p-8 shadow-card">
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl gradient-teal flex items-center justify-center mx-auto mb-4 shadow-teal">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-display gradient-text">
              ToknFlow
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Smart Doctor Queue Management
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize ${
                  mode === m
                    ? "bg-teal-500/20 text-teal-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <div className="space-y-5">
              <div className="glass rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
                Connect your digital wallet to securely access your ToknFlow
                account. Your identity is verified on-chain.
              </div>

              <Button
                className="w-full gradient-teal text-white font-semibold h-12 rounded-xl btn-glow"
                onClick={onLogin}
                disabled={isLoggingIn || isLoading}
                data-ocid="auth.submit_button"
              >
                {isLoggingIn || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet & Login"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-teal-400 hover:underline"
                  onClick={() => setMode("register")}
                >
                  Register here
                </button>
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => void handleRegister(e)}
              className="space-y-5"
            >
              {!isAuthenticated && (
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-amber-400 font-medium mb-3">
                    Step 1: Connect your wallet first
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                    onClick={onLogin}
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Wallet"
                    )}
                  </Button>
                </div>
              )}

              {isAuthenticated && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  Wallet connected
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Sarah Johnson"
                  className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl"
                  data-ocid="auth.name_input"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger
                    className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl"
                    data-ocid="auth.role_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-800 border-white/10">
                    {roleOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div className="flex items-center gap-2">
                          <span className={r.color}>{r.icon}</span>
                          <div>
                            <span className="font-medium">{r.label}</span>
                            <span className="text-muted-foreground text-xs ml-2">
                              {r.desc}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full gradient-teal text-white font-semibold h-12 rounded-xl btn-glow"
                disabled={isSubmitting || !isAuthenticated}
                data-ocid="auth.submit_button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Already registered?{" "}
                <button
                  type="button"
                  className="text-teal-400 hover:underline"
                  onClick={() => setMode("login")}
                >
                  Login here
                </button>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
