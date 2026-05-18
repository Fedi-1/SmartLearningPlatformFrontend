// src/app/features/dashboard/admin/students/student-drawer/student-drawer.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  StudentDetail,
  StudentExamAttemptItem
} from '../../../../../core/services/admin.service';

type DrawerTab = 'profile' | 'courses' | 'certificates' | 'exams';

@Component({
  selector: 'app-student-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-drawer.component.html',
  styleUrl: './student-drawer.component.scss'
})
export class StudentDrawerComponent implements OnChanges {

  @Input() studentId!: number;
  @Input() open = false;
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() statusToggled = new EventEmitter<{ studentId: number; newStatus: boolean }>();
  @Output() profileUpdated = new EventEmitter<StudentDetail>();

  detail: StudentDetail | null = null;
  examAttempts: StudentExamAttemptItem[] = [];
  loading = true;
  activeTab: DrawerTab = 'profile';
  savingProfile = false;
  profileError = '';
  profileSuccess = '';
  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: ''
  };

  readonly AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#22c55e',
    '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'
  ];

  constructor(private adminService: AdminService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['studentId'] && this.studentId) {
      this.load();
    }
  }

  private load(): void {
    this.loading = true;
    this.detail = null;
    this.examAttempts = [];
    this.activeTab = 'profile';
    this.profileError = '';
    this.profileSuccess = '';

    this.adminService.getStudentDetail(this.studentId).subscribe({
      next: detail => {
        this.detail = detail;
        this.populateProfileForm(detail);
        this.adminService.getStudentExamAttempts(this.studentId).subscribe(attempts => {
          this.examAttempts = attempts;
          this.loading = false;
        });
      },
      error: () => { this.loading = false; }
    });
  }

  private populateProfileForm(detail: StudentDetail): void {
    this.profileForm = {
      firstName: detail.firstName,
      lastName: detail.lastName,
      email: detail.email,
      phoneNumber: detail.phoneNumber ?? '',
      dateOfBirth: detail.dateOfBirth ?? ''
    };
  }

  get initials(): string {
    if (!this.detail) return '';
    return (this.detail.firstName[0] + this.detail.lastName[0]).toUpperCase();
  }

  get avatarColor(): string {
    if (!this.detail) return '#6366f1';
    const str = this.detail.firstName + this.detail.lastName + this.detail.email;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    }
    return this.AVATAR_COLORS[Math.abs(hash) % this.AVATAR_COLORS.length];
  }

  get arcDasharray(): string {
    if (!this.detail) return '0 100';
    const score = this.detail.engagementScore;
    const circumference = 2 * Math.PI * 30;
    const filled = (score / 100) * circumference;
    return `${filled.toFixed(1)} ${(circumference - filled).toFixed(1)}`;
  }

  get arcCircumference(): number {
    return 2 * Math.PI * 30;
  }

  onToggleStatus(): void {
    if (!this.detail) return;
    this.adminService.toggleStudentStatus(this.detail.id).subscribe(newStatus => {
      this.detail!.isActive = newStatus;
      this.statusToggled.emit({ studentId: this.detail!.id, newStatus });
    });
  }

  saveProfile(): void {
    if (!this.detail || this.savingProfile) return;
    this.profileError = '';
    this.profileSuccess = '';

    const firstName = this.profileForm.firstName.trim();
    const lastName = this.profileForm.lastName.trim();
    const email = this.profileForm.email.trim();

    if (!firstName || !lastName || !email) {
      this.profileError = 'First name, last name, and email are required.';
      return;
    }

    this.savingProfile = true;
    this.adminService.updateStudentProfile(this.detail.id, {
      firstName,
      lastName,
      email,
      phoneNumber: this.profileForm.phoneNumber.trim() || null,
      dateOfBirth: this.profileForm.dateOfBirth || null
    }).subscribe({
      next: updated => {
        this.detail = updated;
        this.populateProfileForm(updated);
        this.profileUpdated.emit(updated);
        this.profileSuccess = 'Profile updated successfully.';
        this.savingProfile = false;
      },
      error: err => {
        this.profileError = err?.error?.message ?? 'Failed to update profile.';
        this.savingProfile = false;
      }
    });
  }

  close(): void {
    this.closeDrawer.emit();
  }

  setTab(tab: DrawerTab): void {
    this.activeTab = tab;
  }

  formatDate(iso: string | null): string {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  progressPercent(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }
}
