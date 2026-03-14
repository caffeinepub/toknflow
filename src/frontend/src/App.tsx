import { Toaster } from "@/components/ui/sonner";
import { Activity, Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/LandingPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { DoctorDashboard } from "./pages/doctor/DoctorDashboard";
import { PatientDashboard } from "./pages/patient/PatientDashboard";

export default function App() {
  const {
    currentPage,
    userProfile,
    isLoading,
    isAuthenticated,
    isLoggingIn,
    isInitializing,
    identity,
    login,
    logout,
    registerUser,
    navigateTo,
  } = useAuth();

  // Show loading screen while initializing
  if (isInitializing || (isLoading && isAuthenticated)) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.11 0.03 255) 0%, oklch(0.09 0.02 260) 50%, oklch(0.10 0.03 240) 100%)",
        }}
        data-ocid="app.loading_state"
      >
        <div className="w-14 h-14 rounded-2xl gradient-teal flex items-center justify-center shadow-teal animate-pulse">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading ToknFlow...</span>
        </div>
      </div>
    );
  }

  switch (currentPage) {
    case "landing":
      return (
        <>
          <LandingPage onNavigate={navigateTo} />
          <Toaster
            toastOptions={{
              style: {
                background: "oklch(0.17 0.025 245)",
                border: "1px solid oklch(1 0.04 240 / 15%)",
                color: "oklch(0.95 0.01 240)",
              },
            }}
          />
        </>
      );

    case "auth":
      return (
        <>
          <AuthPage
            onRegister={registerUser}
            onLogin={login}
            onBack={() => navigateTo("landing")}
            isLoggingIn={isLoggingIn}
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            currentPage={currentPage}
          />
          <Toaster
            toastOptions={{
              style: {
                background: "oklch(0.17 0.025 245)",
                border: "1px solid oklch(1 0.04 240 / 15%)",
                color: "oklch(0.95 0.01 240)",
              },
            }}
          />
        </>
      );

    case "patient":
      return (
        <>
          <PatientDashboard
            userProfile={userProfile}
            identity={
              identity as
                | { getPrincipal: () => { toString: () => string } }
                | undefined
            }
            onLogout={logout}
            onNavigateTo={navigateTo}
          />
          <Toaster
            toastOptions={{
              style: {
                background: "oklch(0.17 0.025 245)",
                border: "1px solid oklch(1 0.04 240 / 15%)",
                color: "oklch(0.95 0.01 240)",
              },
            }}
          />
        </>
      );

    case "doctor":
      return (
        <>
          <DoctorDashboard
            userProfile={userProfile}
            onLogout={logout}
            onNavigateTo={navigateTo}
          />
          <Toaster
            toastOptions={{
              style: {
                background: "oklch(0.17 0.025 245)",
                border: "1px solid oklch(1 0.04 240 / 15%)",
                color: "oklch(0.95 0.01 240)",
              },
            }}
          />
        </>
      );

    case "admin":
      return (
        <>
          <AdminDashboard
            userProfile={userProfile}
            onLogout={logout}
            onNavigateTo={navigateTo}
          />
          <Toaster
            toastOptions={{
              style: {
                background: "oklch(0.17 0.025 245)",
                border: "1px solid oklch(1 0.04 240 / 15%)",
                color: "oklch(0.95 0.01 240)",
              },
            }}
          />
        </>
      );

    default:
      return (
        <>
          <LandingPage onNavigate={navigateTo} />
          <Toaster />
        </>
      );
  }
}
