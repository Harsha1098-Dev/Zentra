'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../lib/api';
import {
  UserProfileDto,
  OrganizationSummaryDto,
  MeResponseDto,
  AuthResponseDto,
  LoginInput,
} from '@zentra/shared-types';

interface AuthContextType {
  user: UserProfileDto | null;
  activeOrganization: OrganizationSummaryDto | null;
  organizations: OrganizationSummaryDto[];
  roles: string[];
  permissions: string[];
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthResponseDto>;
  selectOrganization: (organizationId: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<OrganizationSummaryDto | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationSummaryDto[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const me: MeResponseDto = await ApiClient.request('/me');
      setUser(me.user);
      setActiveOrganization(me.activeOrganization);
      setRoles(me.roles || []);
      setPermissions(me.permissions || []);

      const orgs: OrganizationSummaryDto[] = await ApiClient.request('/me/organizations');
      setOrganizations(orgs);
    } catch {
      setUser(null);
      setActiveOrganization(null);
      ApiClient.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (input: LoginInput): Promise<AuthResponseDto> => {
    const data: AuthResponseDto = await ApiClient.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    ApiClient.setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setOrganizations(data.organizations);

    if (data.activeOrganizationId) {
      const active = data.organizations.find((o) => o.id === data.activeOrganizationId) || null;
      setActiveOrganization(active);
    } else {
      setActiveOrganization(null);
    }

    await fetchCurrentUser();
    return data;
  };

  const selectOrganization = async (organizationId: string) => {
    const res = await ApiClient.request('/me/select-organization', {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    });

    if (res.accessToken) {
      ApiClient.setTokens(res.accessToken, res.refreshToken);
    }
    await fetchCurrentUser();
  };

  const logout = () => {
    ApiClient.clearTokens();
    setUser(null);
    setActiveOrganization(null);
    setOrganizations([]);
    setRoles([]);
    setPermissions([]);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrganization,
        organizations,
        roles,
        permissions,
        isLoading,
        login,
        selectOrganization,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
