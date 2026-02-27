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
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
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

          // Add Android Teams detection to body for CSS targeting
          const userAgent = navigator.userAgent.toLowerCase();
          const isAndroid = userAgent.includes('android');
          if (isAndroid) {
            document.body.setAttribute('data-teams-android', 'true');
          }
          
          console.log('Teams initialized successfully');
          break; // Success, exit retry loop
          
        } catch (err) {
          attempts++;
          console.warn(`Teams initialization attempt ${attempts} failed:`, err);
          
          if (attempts < maxAttempts) {
            // Wait before retry with increasing delay
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          } else {
            // Final attempt failed
            console.log('Teams initialization failed after all attempts, assuming not in Teams');
            setIsInTeams(false);
            setTeamsContext(null);
            setTeamsUser(null);
          }
        }
      }
      
      setIsTeamsInitialized(true);
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
