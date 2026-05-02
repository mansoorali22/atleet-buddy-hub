export type Role = "admin" | "support";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in?: number;
  admin: AdminUser;
}

export interface AdminUser {
  id: number;
  email: string;
  display_name: string;
  role: Role;
}
