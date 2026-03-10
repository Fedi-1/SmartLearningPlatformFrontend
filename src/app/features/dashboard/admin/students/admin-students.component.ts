// src/app/features/dashboard/admin/students/admin-students.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  StudentSummary
} from '../../../../core/services/admin.service';
import { StudentDrawerComponent } from './student-drawer/student-drawer.component';

type FilterStatus = 'all' | 'active' | 'inactive';
type SortKey = 'name' | 'createdAt' | 'lastLogin' | 'engagementScore';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule, StudentDrawerComponent],
  templateUrl: './admin-students.component.html',
  styleUrl: './admin-students.component.scss'
})
export class AdminStudentsComponent implements OnInit {

  loading = true;
  students: StudentSummary[] = [];

  searchQuery = '';
  filterStatus: FilterStatus = 'all';
  sortKey: SortKey = 'createdAt';

  selectedStudentId: number | null = null;
  drawerOpen = false;

  readonly AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#22c55e',
    '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getAllStudents().subscribe(list => {
      this.students = list;
      this.loading = false;
    });
  }

  get filtered(): StudentSummary[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.students
      .filter(s => {
        const matchesSearch = !q ||
          (s.firstName + ' ' + s.lastName).toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q);
        const matchesStatus =
          this.filterStatus === 'all' ||
          (this.filterStatus === 'active' && s.isActive) ||
          (this.filterStatus === 'inactive' && !s.isActive);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (this.sortKey) {
          case 'name':
            return (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName);
          case 'createdAt':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'lastLogin':
            if (!a.lastLogin) return 1;
            if (!b.lastLogin) return -1;
            return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
          case 'engagementScore':
            return b.engagementScore - a.engagementScore;
          default:
            return 0;
        }
      });
  }

  initials(s: StudentSummary): string {
    return (s.firstName[0] + s.lastName[0]).toUpperCase();
  }

  avatarColor(s: StudentSummary): string {
    let hash = 0;
    const str = s.firstName + s.lastName + s.email;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    }
    return this.AVATAR_COLORS[Math.abs(hash) % this.AVATAR_COLORS.length];
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  daysAgo(iso: string | null): string {
    if (!iso) return 'Never';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
  }

  openDrawer(studentId: number): void {
    this.selectedStudentId = studentId;
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    setTimeout(() => { this.selectedStudentId = null; }, 350);
  }

  onToggleStatus(student: StudentSummary): void {
    this.adminService.toggleStudentStatus(student.id).subscribe(newStatus => {
      student.isActive = newStatus;
    });
  }

  onDrawerToggleStatus(event: { studentId: number; newStatus: boolean }): void {
    const s = this.students.find(st => st.id === event.studentId);
    if (s) s.isActive = event.newStatus;
  }
}
