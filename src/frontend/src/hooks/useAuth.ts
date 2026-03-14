import { useCallback, useEffect, useState } from "react";
import { UserRole } from "../backend.d";
import type { UserProfile } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type AppPage = "landing" | "auth" | "patient" | "doctor" | "admin";

interface AuthState {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  isLoading: boolean;
  currentPage: AppPage;
}

export function useAuth() {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const { actor, isFetching } = useActor();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userProfile: null,
    userRole: null,
    isLoading: true,
    currentPage: "landing",
  });

  const loadUserData = useCallback(async () => {
    if (!actor || isFetching) return;

    if (!identity) {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        userProfile: null,
        userRole: null,
        isLoading: false,
        currentPage: "landing",
      }));
      return;
    }

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const [profile, role] = await Promise.all([
        actor.getCallerUserProfile(),
        actor.getCallerUserRole(),
      ]);

      // If no profile exists yet, this is a new user — send to auth/register
      if (!profile) {
        setAuthState({
          isAuthenticated: true,
          userProfile: null,
          userRole: role,
          isLoading: false,
          currentPage: "auth",
        });
        return;
      }

      // Route based on the saved profile role (doctor/patient/admin)
      let page: AppPage = "patient";
      if (profile.role === "admin" || role === UserRole.admin) {
        page = "admin";
      } else if (profile.role === "doctor") {
        page = "doctor";
      } else {
        page = "patient";
      }

      setAuthState({
        isAuthenticated: true,
        userProfile: profile,
        userRole: role,
        isLoading: false,
        currentPage: page,
      });
    } catch {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        userProfile: null,
        userRole: null,
        isLoading: false,
        currentPage: "landing",
      }));
    }
  }, [actor, isFetching, identity]);

  useEffect(() => {
    if (!isInitializing && !isFetching) {
      void loadUserData();
    }
  }, [isInitializing, isFetching, loadUserData]);

  const navigateTo = useCallback((page: AppPage) => {
    setAuthState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const logout = useCallback(() => {
    clear();
    setAuthState({
      isAuthenticated: false,
      userProfile: null,
      userRole: null,
      isLoading: false,
      currentPage: "landing",
    });
  }, [clear]);

  const registerUser = useCallback(
    async (name: string, role: string) => {
      if (!actor) throw new Error("Not connected");
      const profile: UserProfile = { name, role };
      await actor.saveCallerUserProfile(profile);

      let page: AppPage = "patient";
      if (role === "admin") page = "admin";
      else if (role === "doctor") page = "doctor";

      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: true,
        userProfile: profile,
        currentPage: page,
      }));
    },
    [actor],
  );

  return {
    ...authState,
    login,
    logout,
    registerUser,
    navigateTo,
    isLoggingIn,
    isInitializing,
    loadUserData,
    identity,
  };
}
