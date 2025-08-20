import { app, authentication } from "@microsoft/teams-js";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface TeamsContextType {
  isInTeams: boolean;
  teamsContext: app.Context | null;
  isTeamsInitialized: boolean;
  teamsTheme: string;
  teamsUser: app.Context["user"] | null;
  message: string;
  getTeamsToken: () => Promise<string>;  // expose for FE consumers too
}

const TeamsContext = createContext<TeamsContextType>({
  isInTeams: false,
  teamsContext: null,
  isTeamsInitialized: false,
  teamsTheme: "default",
  teamsUser: null,
  message: "",
  getTeamsToken: async () => "",
});

export const useTeams = () => useContext(TeamsContext);

interface TeamsProviderProps {
  children: React.ReactNode;
}

export const TeamsProvider: React.FC<TeamsProviderProps> = ({ children }) => {
  const [isInTeams, setIsInTeams] = useState(false);
  const [teamsContext, setTeamsContext] = useState<app.Context | null>(null);
  const [isTeamsInitialized, setIsTeamsInitialized] = useState(false);
  const [teamsTheme, setTeamsTheme] = useState("default");
  const [message, setMessage] = useState("");
  const [teamsUser, setTeamsUser] = useState<app.Context["user"] | null>(null);

  // Helper is stable (doesn't change identity each render)
  const getTeamsToken = useMemo(
    () => async () => {
      // Works when Teams SSO is configured (manifest.webApplicationInfo / access_as_user)
      return authentication.getAuthToken(); // returns a Promise<string>
    },
    []
  );

  // Expose state + helpers for axios interceptors (which may load before React mounts)
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__teamsState = {
      isInTeams,
      isInitialized: isTeamsInitialized,
      teamsContext,
      teamsUser,
      message,
    };
    // also expose callable helpers (preferred by interceptors)
    (window as any).__teams = {
      getContext: () => app.getContext(),
      getToken: getTeamsToken,
      getState: () => (window as any).__teamsState,
    };
  }, [isInTeams, isTeamsInitialized, teamsContext, teamsUser, message, getTeamsToken]);

  useEffect(() => {
    let cancelled = false;

    const initializeTeams = async () => {
      try {
        await app.initialize();
        setIsInTeams(true);

        const context = await app.getContext();
        if (cancelled) return;

        setTeamsContext(context);
        setTeamsUser(context.user ?? null);
        setTeamsTheme(context.app?.theme || "default");

        app.registerOnThemeChangeHandler((theme) => setTeamsTheme(theme));

        // Let the host know we’re ready (helps on mobile)
        if (!cancelled) {
          app.notifyAppLoaded();
          app.notifySuccess();
        }
      } catch (err) {
        if (cancelled) return;
        setMessage(
          err instanceof Error ? err.message : JSON.stringify(err, null, 2)
        );
        setIsInTeams(false);
        setTeamsContext(null);
        setTeamsUser(null);
      } finally {
        if (!cancelled) setIsTeamsInitialized(true);
      }
    };

    initializeTeams();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TeamsContext.Provider
      value={{
        isInTeams,
        teamsContext,
        isTeamsInitialized,
        teamsTheme,
        teamsUser,
        message,
        getTeamsToken,
      }}
    >
      {children}
    </TeamsContext.Provider>
  );
};
