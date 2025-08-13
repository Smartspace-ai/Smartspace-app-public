import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material';

export const Loading = () => {
  const lgUp = useMediaQuery(useTheme().breakpoints.up('lg'));
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
};
