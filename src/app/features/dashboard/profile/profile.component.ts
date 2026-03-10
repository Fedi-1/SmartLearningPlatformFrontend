import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/enums/user-role.enum';

export interface StudentProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  private readonly STUDENT_API = 'http://localhost:8069/api/students';
  private readonly ADMIN_API   = 'http://localhost:8069/api/admin';

  private get API(): string {
    return this.authService.currentUser()?.role === UserRole.ADMIN
      ? this.ADMIN_API
      : this.STUDENT_API;
  }

  loading = true;
  saving  = false;
  pwSaving = false;

  profile: StudentProfile = {
    id: 0, firstName: '', lastName: '',
    email: '', phoneNumber: null, dateOfBirth: null
  };

  pw = { current: '', newPw: '', confirm: '' };

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.http.get<StudentProfile>(`${this.API}/profile`).subscribe({
      next: (p) => { this.profile = p; this.loading = false; },
      error: ()  => {
        this.toast.error('Failed to load profile.');
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    this.saving = true;
    this.http.put<StudentProfile>(`${this.API}/profile`, this.profile).subscribe({
      next: (p) => {
        this.profile = p;
        this.saving = false;
        this.toast.success('Profile updated successfully.');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Failed to update profile.');
      }
    });
  }

  changePassword(): void {
    if (this.pw.newPw !== this.pw.confirm) {
      this.toast.error('New passwords do not match.');
      return;
    }
    if (this.pw.newPw.length < 8) {
      this.toast.error('Password must be at least 8 characters.');
      return;
    }
    this.pwSaving = true;
    this.http.put(`${this.API}/password`, {
      currentPassword: this.pw.current,
      newPassword:     this.pw.newPw
    }).subscribe({
      next: () => {
        this.pwSaving = false;
        this.pw = { current: '', newPw: '', confirm: '' };
        this.toast.success('Password changed successfully.');
      },
      error: (err) => {
        this.pwSaving = false;
        this.toast.error(err?.error?.message ?? 'Failed to change password.');
      }
    });
  }

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === UserRole.ADMIN;
  }

  get initials(): string {
    return `${this.profile.firstName.charAt(0)}${this.profile.lastName.charAt(0)}`.toUpperCase();
  }
}
