export interface JwtPayload {
  id: string;
  email: string;
  workspaceId: string;
  refreshToken?: string;
}