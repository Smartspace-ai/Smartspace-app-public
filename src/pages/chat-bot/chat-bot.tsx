import { useQueryWorkspace } from '@/hooks/data/use-workspace';
import { useQueryThread } from '@/hooks/data/use-thread';
import {  useParams } from 'react-router';
import { Toaster } from 'sonner';
import { Loading } from '../loading/loading';
import { useQueryWorkspaces } from '@/hooks/data/use-workspaces';
import { SidebarLayout } from '@/components/sidebar/sidebar-layout/sidebar-layout';
export function ChatBot() {
  const { queryWorkspaces } = useQueryWorkspaces();
  const { isPending: isPendingWorkspaces } = queryWorkspaces;
    return isPendingWorkspaces ? (
      <Loading />
    ) : (
      <>
        <SidebarLayout />
        {/* <SidebarInset className="relative flex-1 flex flex-col min-h-0">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div style={{
              maxWidth: '500px',
              textAlign: 'center',
              background: 'white',
              padding: '40px',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '16px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                No Workspaces Available
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#718096',
                lineHeight: '1.6',
                marginBottom: '24px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                It looks like you don't have access to any workspaces yet. Please contact your administrator to get access to a workspace.
              </p>
            </div>
          </div>
        </SidebarInset> */}
        {/* <SidebarRight  /> */}
        <Toaster />
      </>
    );
  }

