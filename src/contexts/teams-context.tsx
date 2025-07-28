import { app } from '@microsoft/teams-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface TeamsContextType {
  isInTeams: boolean;
  teamsContext: app.Context | null;
  isTeamsInitialized: boolean;
  teamsTheme: string;
  teamsUser: app.Context['user'] | null;
}

const TeamsContext = createContext<TeamsContextType>({
  isInTeams: false,
  teamsContext: null,
  isTeamsInitialized: false,
  teamsTheme: 'default',
  teamsUser: null,
});

export const useTeams = () => useContext(TeamsContext);

interface TeamsProviderProps {
  children: React.ReactNode;
}

export const TeamsProvider: React.FC<TeamsProviderProps> = ({ children }) => {
  const [isInTeams, setIsInTeams] = useState(false);
  const [teamsContext, setTeamsContext] = useState<app.Context | null>(null);
  const [isTeamsInitialized, setIsTeamsInitialized] = useState(false);
  const [teamsTheme, setTeamsTheme] = useState('default');
  const [teamsUser, setTeamsUser] = useState<app.Context['user'] | null>(null);

  // Expose Teams state globally for axios interceptors
  useEffect(() => {
    (window as any).__teamsState = {
      isInTeams,
      isInitialized: isTeamsInitialized,
      teamsContext,
      teamsUser,
    };
  }, [isInTeams, isTeamsInitialized, teamsContext, teamsUser]);

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        // First try initializing the SDK
        await app.initialize();

        // If that worked, we're in Teams
        setIsInTeams(true);

        // Get context (includes user, theme, locale, etc.)
        const context = await app.getContext();
        setTeamsContext(context);
        setTeamsUser(context.user ?? null);
        setTeamsTheme(context.app?.theme || 'default');

        // Watch for theme changes
        app.registerOnThemeChangeHandler((theme) => {
          setTeamsTheme(theme);
        });
      } catch (err) {
        // We're not in Teams, or SDK failed
        setIsInTeams(false);
        setTeamsContext(null);
        setTeamsUser(null);
      } finally {
        setIsTeamsInitialized(true);
      }
    };

    initializeTeams();
  }, []);

  return (
    <TeamsContext.Provider
      value={{
        isInTeams,
        teamsContext,
        isTeamsInitialized,
        teamsTheme,
        teamsUser,
      }}
    >
      {children}
    </TeamsContext.Provider>
  );
};
