import React from 'react';
import { useTeams } from '../../contexts/teams-context';

interface TeamsInfoProps {
  className?: string;
}

export const TeamsInfo: React.FC<TeamsInfoProps> = ({ className = '' }) => {
  const { isInTeams, teamsContext, teamsTheme, teamsUser } = useTeams();

  if (!isInTeams) {
    return null;
  }

  return (
    <div className={`teams-info bg-gray-50 p-4 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Teams Context</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Environment:</span> Microsoft Teams
        </div>
        
        <div>
          <span className="font-medium">Theme:</span> {teamsTheme}
        </div>
        
        {teamsUser && (
          <div>
            <span className="font-medium">User:</span> {teamsUser.displayName || teamsUser.userPrincipalName}
          </div>
        )}
        
        {teamsContext && (
          <div>
            <span className="font-medium">Context:</span> Available
          </div>
        )}
      </div>
    </div>
  );
};

// Hook to apply Teams theme to the app
export const useTeamsTheme = () => {
  const { isInTeams, teamsTheme } = useTeams();

  React.useEffect(() => {
    if (isInTeams) {
      // Apply Teams theme to the document body
      document.body.classList.remove('teams-default', 'teams-dark', 'teams-contrast');
      
      switch (teamsTheme) {
        case 'dark':
          document.body.classList.add('teams-dark');
          break;
        case 'contrast':
          document.body.classList.add('teams-contrast');
          break;
        default:
          document.body.classList.add('teams-default');
      }
    }
  }, [isInTeams, teamsTheme]);

  return { isInTeams, teamsTheme };
}; 