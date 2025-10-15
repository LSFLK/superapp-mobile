/**
 * Role-Based Access Control Component (TypeScript)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { Alert, Button, Card, CardContent, Typography, Stack } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LoginIcon from '@mui/icons-material/Login';
import { extractGroupsFromClaims } from '../constants/auth';
import useAuthInfo from '../hooks/useAuthInfo';

type AuthContextLike = {
  state?: {
    isAuthenticated?: boolean;
    accessToken?: string | null;
    accessTokenPayload?: any;
  };
  getAccessToken?: () => Promise<string | null | undefined>;
  getIDToken?: () => Promise<string | null | undefined>;
  getDecodedIDToken?: () => any;
  getBasicUserInfo?: () => Promise<any>;
  signOut?: () => void | Promise<void>;
};

type RoleBasedAccessControlProps = {
  children?: React.ReactNode;
  requiredGroups?: string[];
};

const Title: React.FC<React.ComponentProps<typeof Typography>> = ({ children, ...props }) => (
  <Typography variant="h4" gutterBottom {...props}>{children}</Typography>
);
const Paragraph: React.FC<React.ComponentProps<typeof Typography>> = ({ children, ...props }) => (
  <Typography variant="body1" {...props}>{children}</Typography>
);

const RoleBasedAccessControl: React.FC<RoleBasedAccessControlProps> = ({
  children,
  requiredGroups = ['superapp_admin'],
}) => {
  const auth = useAuthContext() as unknown as AuthContextLike;
  const { isAuthenticated, groups: userGroups, loading, error, refresh } = useAuthInfo();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const hasRequiredAccess = (userGroups: string[], requiredGroupsList: string[]): boolean => {
    return requiredGroupsList.some((requiredGroup) =>
      userGroups.some((userGroup) => userGroup.toLowerCase().includes(requiredGroup.toLowerCase()))
    );
  };

  useEffect(() => {
    const groups = userGroups;
    const authorized = isAuthenticated && hasRequiredAccess(groups, requiredGroups);
    setIsAuthorized(authorized);
  }, [isAuthenticated, userGroups, JSON.stringify(requiredGroups)]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <Card sx={{ textAlign: 'center', maxWidth: 400 }}>
          <CardContent>
            <Paragraph style={{ marginTop: 16 }}>
              Verifying access permissions...
            </Paragraph>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <Card sx={{ maxWidth: 600, textAlign: 'center', p: 2 }}>
          <ErrorOutlineIcon sx={{ fontSize: 48, color: '#ff4d4f', mb: 2 }} />
          <Title sx={{ color: '#ff4d4f' }}>Access Denied</Title>
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            Unauthorized Access: You are not authorized to access this application. Please contact your administrator if you believe this is an error.
          </Alert>
          <Paragraph>
            <strong>Required Access:</strong> You need to be a member of one of the following groups:
          </Paragraph>

          <ul style={{ textAlign: 'left', marginBottom: '24px' }}>
            {requiredGroups.map((group) => (
              <li key={group}><code>{group}</code></li>
            ))}
          </ul>

          {userGroups.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <Paragraph>
                <strong>Your current groups:</strong>
              </Paragraph>
              <ul style={{ textAlign: 'left' }}>
                {userGroups.map((group) => (
                  <li key={group}><code>{group}</code></li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" startIcon={<LoginIcon />} onClick={() => auth?.signOut?.()}>
              Sign Out
            </Button>
            <Button variant="outlined" onClick={() => refresh()}>
              Retry
            </Button>
          </Stack>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedAccessControl;
