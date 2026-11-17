export interface JwtPayload {
  sub: string; // userId
  email: string;
  organizationId?: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId?: string | null;
  membershipId?: string | null;
  roles?: string[];
  permissions?: string[];
}
