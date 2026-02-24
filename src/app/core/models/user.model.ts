import { UserRole } from '../enums/user-role.enum';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
