
function isInTeams() {
  // Check if Teams context is available on window (we'll set this from TeamsProvider)
  const teamsState = (window as any).__teamsState;
  if (teamsState?.isInitialized) {
    return teamsState.isInTeams;
  }
  
  // Fallback detection if context isn't available yet
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const inTeamsParam = urlParams.get('inTeams') === 'true';
    const parentCheck = window.parent !== window;
    return inTeamsParam || parentCheck;
  } catch (error) {
    console.log('Teams detection failed, assuming Teams environment:', error);
    return true;
  }
}