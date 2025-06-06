import { app, Context } from '@microsoft/teams-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface TeamsContextType {
  isInTeams: boolean;
  teamsContext: Context | null;
  isTeamsInitialized: boolean;
  teamsTheme: string;
  teamsUser: any;
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
  const [teamsContext, setTeamsContext] = useState<Context | null>(null);
  const [isTeamsInitialized, setIsTeamsInitialized] = useState(false);
  const [teamsTheme, setTeamsTheme] = useState('default');
  const [teamsUser, setTeamsUser] = useState(null);

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        // Debug: Log initial state
        console.log('=== TEAMS DEBUG INFO ===');
        console.log('Current URL:', window.location.href);
        console.log('URL params:', window.location.search);
        
        // Check if we're in Teams by looking for the inTeams parameter
        const urlParams = new URLSearchParams(window.location.search);
        const inTeamsParam = urlParams.get('inTeams');
        
        console.log('inTeams param:', inTeamsParam);
        console.log('Parent window check:', window.parent !== window);
        console.log('Teams SDK available:', typeof (window as any).microsoftTeams !== 'undefined');
        console.log('Teams app available:', typeof (window as any)?.microsoftTeams?.app !== 'undefined');
        
        if (inTeamsParam === 'true' || window.parent !== window) {
          console.log('✅ Teams environment detected');
          setIsInTeams(true);
          
          // Initialize Teams SDK
          await app.initialize();
          
          // Get Teams context
          const context = await app.getContext();
          setTeamsContext(context as any);
          
          // Set theme based on Teams theme
          setTeamsTheme(context.app.theme || 'default');
          
          // Listen for theme changes
          app.registerOnThemeChangeHandler((theme: string) => {
            setTeamsTheme(theme);
          });
          
          // Get user information if available
          try {
            const userProfile = context.user;
            setTeamsUser(userProfile as any);
          } catch (error) {
            console.log('Could not get Teams user profile:', error);
          }
          
          setIsTeamsInitialized(true);
        } else {
          // Not in Teams, just set initialized to true
          setIsTeamsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing Teams:', error);
        setIsTeamsInitialized(true);
      }
    };

    initializeTeams();
  }, []);

  const value = {
    isInTeams,
    teamsContext,
    isTeamsInitialized,
    teamsTheme,
    teamsUser,
  };

  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
}; 