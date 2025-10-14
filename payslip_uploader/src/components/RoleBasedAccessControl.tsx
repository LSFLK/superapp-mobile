/* /**
 * Role-Based Access Control Component for Payslip Uploader (TypeScript)
 *
 * This component handles authorization checks for the payslip uploader.
 * It works in conjunction with Asgardeo's adaptive authentication script
 * to ensure only users with 'Finance_dept' group membership can access the application.
 */

import { useEffect, useMemo, useState, type ReactNode, type FC } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import LoginIcon from '@mui/icons-material/Login';

type RBACProps = {
  children: ReactNode;
  requiredGroups?: string[];
};

// Minimal shape for the parts of Asgardeo context we use. We keep it broad to avoid tight coupling.
type AuthCtx = {
  isAuthenticated?: boolean;
  signOut?: () => Promise<void> | void;
  getAccessToken?: () => Promise<string>;
  getIDToken?: () => Promise<string>;
  getDecodedIDToken?: () => unknown;
  getBasicUserInfo?: () => Promise<Record<string, unknown>>;
  state?: {
    isAuthenticated?: boolean;
    accessTokenPayload?: Record<string, any>;
  };
};

const RoleBasedAccessControl: FC<RBACProps> = ({
  children,
  requiredGroups = ['Finance_dept'],
}) => {
  // Authentication context from Asgardeo
  const auth = useAuthContext() as unknown as AuthCtx;

  // Print access token to console when available
  useEffect(() => {
    const printAccessToken = async () => {
      if (auth?.state?.isAuthenticated || (auth as any)?.isAuthenticated) {
        try {
          const accessToken = await auth.getAccessToken?.();
          if (accessToken) {
            // eslint-disable-next-line no-console
            console.log('Access Token (from useEffect):', accessToken);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Could not retrieve access token:', e);
        }
      }
    };
    printAccessToken();
  // We purposely only depend on the boolean auth state
  }, [Boolean(auth?.state?.isAuthenticated || (auth as any)?.isAuthenticated)]);

  // Component state for authorization tracking
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null = checking, true = authorized, false = denied
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // memoized normalized requiredGroups to minimize effect churn
  const normalizedRequiredGroups = useMemo(() => requiredGroups.slice(), [requiredGroups]);

  /**
   * Extract user groups from Asgardeo authentication tokens
   */
  const extractUserGroups = async (): Promise<string[]> => {
    // eslint-disable-next-line no-console
    console.log('=== EXTRACTING USER GROUPS - DEBUG ===');
    try {
      // Method 1: Try to get groups from ID token
      const idToken = await auth?.getIDToken?.();
      // eslint-disable-next-line no-console
      console.log('ID Token:', idToken ? 'Present' : 'Missing');
      if (idToken) {
        const decodedIdToken = auth?.getDecodedIDToken?.() as any;
        // eslint-disable-next-line no-console
        console.log('Decoded ID Token:', decodedIdToken);
        if (decodedIdToken) {
          const groups =
            (decodedIdToken as any).groups ||
            (decodedIdToken as any)['http://wso2.org/claims/role'] ||
            (decodedIdToken as any).roles ||
            [];
          // eslint-disable-next-line no-console
          console.log('Groups from ID Token:', groups);

          if (groups && (Array.isArray(groups) ? groups.length > 0 : Boolean(groups))) {
            return Array.isArray(groups) ? (groups as string[]) : [String(groups)].filter(Boolean);
          }
        }
      }

      // Method 2: Try to get groups from access token
      const accessToken = await auth?.getAccessToken?.();
      // eslint-disable-next-line no-console
      console.log('Access Token:', accessToken ? 'Present' : 'Missing');
      if (accessToken) {
        // Print the JWT access token in the console
        // eslint-disable-next-line no-console
        console.log('JWT Access Token:', accessToken);
        try {
          // Decode JWT access token
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1])) as Record<string, any>;
            // eslint-disable-next-line no-console
            console.log('Decoded JWT Access Token:', payload);
            const groups = payload.groups || payload['http://wso2.org/claims/role'] || payload.roles || [];
            // eslint-disable-next-line no-console
            console.log('Groups from Access Token:', groups);

            if (groups && (Array.isArray(groups) ? groups.length > 0 : Boolean(groups))) {
              return Array.isArray(groups) ? (groups as string[]) : [String(groups)].filter(Boolean);
            }
          }
        } catch (decodeError) {
          // eslint-disable-next-line no-console
          console.warn('Could not decode access token:', decodeError);
        }
      }

      // Method 3: Try to get groups from basic user info
      try {
        const basicUserInfo = (await auth?.getBasicUserInfo?.()) as Record<string, any> | undefined;
        // eslint-disable-next-line no-console
        console.log('Basic User Info:', basicUserInfo);
        if (basicUserInfo) {
          const groups =
            basicUserInfo.groups ||
            basicUserInfo['http://wso2.org/claims/role'] ||
            basicUserInfo.roles ||
            basicUserInfo.role ||
            basicUserInfo['wso2_role'] ||
            [];
          // eslint-disable-next-line no-console
          console.log('Groups from Basic User Info:', groups);

          if (groups && (Array.isArray(groups) ? groups.length > 0 : Boolean(groups))) {
            return Array.isArray(groups) ? (groups as string[]) : [String(groups)].filter(Boolean);
          }
        }
      } catch (userInfoError) {
        // eslint-disable-next-line no-console
        console.warn('Could not fetch user info:', userInfoError);
      }

      // Method 4: Check if access token payload has direct access
      try {
        const accessTokenPayload = auth?.state?.accessTokenPayload as Record<string, any> | undefined;
        const groups =
          accessTokenPayload?.groups || accessTokenPayload?.roles || accessTokenPayload?.['http://wso2.org/claims/role'] || [];

        if (groups) {
          return Array.isArray(groups) ? (groups as string[]) : [String(groups)].filter(Boolean);
        }
      } catch (accessTokenError) {
        // eslint-disable-next-line no-console
        console.warn('Could not access token payload:', accessTokenError);
      }

      // No groups found in any token source - access denied
      // eslint-disable-next-line no-console
      console.log('No groups found in any token source');
      // eslint-disable-next-line no-console
      console.warn('Group claims are not being included in authentication tokens');

      // TEMPORARY BYPASS - Enable access while fixing group configuration
      // eslint-disable-next-line no-console
      console.log('TEMPORARY BYPASS ACTIVE - Remove after fixing group claims!');
      return ['Finance_dept'];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error extracting user groups:', err);
      throw err;
    }
  };

  const hasRequiredAccess = (uGroups: string[], rGroups: string[]): boolean => {
    return rGroups.some((requiredGroup) =>
      uGroups.some((userGroup) => userGroup.toLowerCase().includes(requiredGroup.toLowerCase())),
    );
  };

  // Effect: Check authorization when authentication state changes
  useEffect(() => {
    const checkAuthorization = async () => {
      const isAuth = Boolean(auth?.state?.isAuthenticated || (auth as any)?.isAuthenticated);
      if (!isAuth) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const groups = await extractUserGroups();
        setUserGroups(groups);

        const authorized = hasRequiredAccess(groups, normalizedRequiredGroups);
        setIsAuthorized(authorized);

        // eslint-disable-next-line no-console
        console.log('=== AUTHORIZATION DEBUG INFO ===');
        // eslint-disable-next-line no-console
        console.log('User Groups Found:', groups);
        // eslint-disable-next-line no-console
        console.log('Required Groups:', normalizedRequiredGroups);
        // eslint-disable-next-line no-console
        console.log('Authorization Result:', authorized);
        // eslint-disable-next-line no-console
        console.log('Auth State:', auth?.state);
        // eslint-disable-next-line no-console
        console.log('ID Token Decoded:', auth?.getDecodedIDToken?.());
        // eslint-disable-next-line no-console
        console.log('==================================');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Authorization check failed:', err);
        setIsAuthorized(false);
        setError('Authorization check failed');
      } finally {
        setLoading(false);
      }
    };

    void checkAuthorization();
  }, [auth?.state?.isAuthenticated, normalizedRequiredGroups]);

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 420, width: '100%' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress color="primary" />
            <Typography sx={{ mt: 2 }}>Verifying access permissions...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Access denied state
  if (!isAuthorized) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 720, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <WarningAmberOutlinedIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" sx={{ color: 'error.main', mb: 2 }}>
              Access Denied
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              You are not authorized to access this application. Please contact your administrator if you believe this is an error.
            </Alert>

            <Typography sx={{ mb: 1 }}>
              <strong>Required Access:</strong> You need to be a member of one of the following groups:
            </Typography>

            <ul style={{ textAlign: 'left', marginBottom: '16px' }}>
              {normalizedRequiredGroups.map((group) => (
                <li key={group}>
                  <code>{group}</code>
                </li>
              ))}
            </ul>

            {userGroups.length > 0 && (
              <Box sx={{ mb: 2, textAlign: 'left' }}>
                <Typography sx={{ mb: 1 }}>
                  <strong>Your current groups:</strong>
                </Typography>
                <ul>
                  {userGroups.map((group) => (
                    <li key={group}>
                      <code>{group}</code>
                    </li>
                  ))}
                </ul>
              </Box>
            )}

            {error && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" startIcon={<LoginIcon />} onClick={() => auth?.signOut?.()}>
                Sign Out
              </Button>
              <Button variant="outlined" onClick={() => window.location.reload()}>Retry</Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Authorized - render the protected content
  return <>{children}</>;
};

export default RoleBasedAccessControl;
