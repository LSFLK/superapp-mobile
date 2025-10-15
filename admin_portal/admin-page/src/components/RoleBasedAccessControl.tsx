/**
 * Role-Based Access Control Component (TypeScript)
 */
import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { Card, CardContent, Typography } from '@mui/material';
import useAuthInfo from '../hooks/useAuthInfo';
import AccessDenied from './common/AccessDenied';

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
      <AccessDenied
        requiredGroups={requiredGroups}
        userGroups={userGroups}
        error={error}
        onSignOut={() => auth?.signOut?.()}
        onRetry={() => refresh()}
      />
    );
  }

  return <>{children}</>;
};

export default RoleBasedAccessControl;
