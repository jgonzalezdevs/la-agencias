export interface LoginRequest {
  username: string; // Backend expects 'username' field for email
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  sales_count: number;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  avatar?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface GoogleAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
