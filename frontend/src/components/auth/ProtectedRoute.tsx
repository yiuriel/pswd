import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  checkRouteAccess?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  checkRouteAccess = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [routeAccessLoading, setRouteAccessLoading] = useState(checkRouteAccess);
  const [hasRouteAccess, setHasRouteAccess] = useState(true);
  const [accessError, setAccessError] = useState<string>('');

  useEffect(() => {
    const checkAccess = async () => {
      if (!checkRouteAccess || !isAuthenticated || !user) {
        setRouteAccessLoading(false);
        return;
      }

      try {
        const result = await apiService.checkRouteAccess(location.pathname);
        setHasRouteAccess(result.hasAccess);
        if (!result.hasAccess) {
          setAccessError('You do not have permission to access this page.');
        }
      } catch (error) {
        console.error('Route access check failed:', error);
        setHasRouteAccess(false);
        setAccessError('Unable to verify access permissions.');
      } finally {
        setRouteAccessLoading(false);
      }
    };

    if (isAuthenticated && checkRouteAccess) {
      checkAccess();
    } else {
      setRouteAccessLoading(false);
    }
  }, [isAuthenticated, user, location.pathname, checkRouteAccess]);

  // Show loading spinner while checking authentication or route access
  if (isLoading || routeAccessLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          {isLoading ? 'Checking authentication...' : 'Verifying access...'}
        </Typography>
      </Box>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route access check is enabled and user doesn't have access
  if (checkRouteAccess && !hasRouteAccess) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3,
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          {accessError}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Please contact your administrator if you believe this is an error.
        </Typography>
      </Box>
    );
  }

  // If user is authenticated and has access (or no auth required), render children
  return <>{children}</>;
};

// Higher-order component for easier usage
export const withProtectedRoute = (
  Component: React.ComponentType,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  return (props: any) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};
