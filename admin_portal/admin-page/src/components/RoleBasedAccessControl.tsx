/**
 * Role-Based Access Control Component
 */
import React, { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { Card, CardContent, Typography } from "@mui/material";
import { COMMON_STYLES } from "../constants/styles";
import { DEFAULT_REQUIRED_GROUPS } from "../constants/accessControl";
import useAuthInfo from "../hooks/useAuthInfo";
import AccessDenied from "./common/AccessDenied";

type RoleBasedAccessControlProps = {
  children?: React.ReactNode;
  requiredGroups?: string[];
};

const Paragraph: React.FC<React.ComponentProps<typeof Typography>> = ({
  children,
  ...props
}) => (
  <Typography variant="body1" {...props}>
    {children}
  </Typography>
);

const RoleBasedAccessControl: React.FC<RoleBasedAccessControlProps> = ({
  children,
  requiredGroups = [...DEFAULT_REQUIRED_GROUPS],
}) => {
  // Use the SDK's context directly; only use signOut here.
  const { signOut } = useAuthContext();
  const {
    isAuthenticated,
    groups: userGroups,
    loading,
    error,
    refresh,
  } = useAuthInfo();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Create a normalized, memoized array for stable deps.
  const normalizedRequiredGroups = useMemo(() => {
    return [...requiredGroups].map((g) => g.toLowerCase()).sort();
  }, [requiredGroups]);

  const hasRequiredAccess = (
    userGroups: string[],
    requiredGroupsList: string[],
  ): boolean => {
    return requiredGroupsList.some((requiredGroup) =>
      userGroups.some((userGroup) =>
        userGroup.toLowerCase().includes(requiredGroup.toLowerCase()),
      ),
    );
  };

  useEffect(() => {
    const authorized =
      isAuthenticated &&
      hasRequiredAccess(userGroups, normalizedRequiredGroups);
    setIsAuthorized(authorized);
  }, [isAuthenticated, userGroups, normalizedRequiredGroups]);

  if (loading) {
    return (
      <div style={COMMON_STYLES.pageCentered}>
        <Card sx={{ textAlign: "center", maxWidth: 400 }}>
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
        onSignOut={async () => {
          try {
            // Execute signOut if available; ignore any return value for compatibility
            await Promise.resolve(signOut?.());
          } catch {
            /* no-op */
          }
        }}
        onRetry={() => refresh()}
      />
    );
  }

  return <>{children}</>;
};

export default RoleBasedAccessControl;
