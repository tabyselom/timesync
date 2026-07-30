export interface AuthResponse {
  accessToken: string;
  refreshToken: string;

  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };

  workspace: {
    id: string;
    name: string;
    slug: string;
  };

  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
