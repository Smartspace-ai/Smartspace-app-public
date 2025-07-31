// ChatBotLayout.tsx
import { useWorkspaces } from '@/hooks/use-workspaces';
import { WorkspaceSignalRProvider } from '../../signalr_hubs/workspace_signalr_provider';
import { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

export default function ChatBotLayout() {
  const { workspaceId } = useParams<{ workspaceId?: string, threadId?: string }>();
  const navigate = useNavigate();
  const { workspaces, isLoading } = useWorkspaces();

  useEffect(() => {
    if (!workspaceId && !isLoading && workspaces.length > 0) {
      // Redirect to the first workspace if none is in the URL.
      navigate(`/workspace/${workspaces[0].id}`);
    }
  }, [workspaceId, isLoading, workspaces, navigate]);

  // Show the outlet if we have a workspaceId or if there are no workspaces (let ChatBot handle the empty state)
  if (workspaceId || (!isLoading && workspaces.length === 0)) {
    return (
      <WorkspaceSignalRProvider workspaceId={workspaceId}>
        <Outlet />
      </WorkspaceSignalRProvider>
    )
  }
  
  // Nice loading page
  return (
    <div style={{paddingTop: '100px', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: 48,
        height: 48,
        animation: 'spin 1s linear infinite',
        marginBottom: 16
      }}
      />
      <span style={{ fontSize: 18, color: '#555' }}>Loading workspaces...</span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
