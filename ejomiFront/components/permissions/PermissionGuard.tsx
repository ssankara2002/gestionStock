'use client';

import { usePermissions, type Permission } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-provider';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission | Permission[]; // Support ancien format
  permissions?: Permission | Permission[]; // Support nouveau format
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  redirectTo
}: PermissionGuardProps) {
  const { user, loading } = useAuth();
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  const router = useRouter();

  const permsToCheck = permissions || permission;

  const permArray = permsToCheck
    ? (Array.isArray(permsToCheck) ? permsToCheck : [permsToCheck])
    : [];

  const hasAccess = permArray.length === 0 || (requireAll
    ? hasAllPermissions(permArray)
    : hasAnyPermission(permArray));

  useEffect(() => {
    if (loading) return;
    if (!user && redirectTo) {
      router.push(redirectTo);
      return;
    }
    if (!hasAccess && redirectTo) {
      router.push(redirectTo);
    }
  }, [user, loading, hasAccess, redirectTo, router]);

  if (loading) return null;

  if (!user) return <>{fallback}</>;

  if (permsToCheck && !hasAccess) return <>{fallback}</>;

  return <>{children}</>;
}

export default PermissionGuard;
