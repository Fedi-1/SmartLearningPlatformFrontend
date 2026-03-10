import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { UserRole } from '../../../core/enums/user-role.enum';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  form!: FormGroup;
  loading = false;
  showPassword = false;
  shakeForm = false;

  // Unverified-account banner
  showUnverifiedBanner = false;
  unverifiedEmail = '';
  resendLoading = false;
  resendCooldown = false;

  // Suspended-account banner
  showSuspendedBanner = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.currentUser();
      this.router.navigate([user?.role === UserRole.ADMIN ? '/dashboard/admin/overview' : '/dashboard']);
      return;
    }

    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.triggerShake();
      return;
    }

    this.loading = true;
    this.showUnverifiedBanner = false;
    this.showSuspendedBanner = false;

    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.toastService.success('Welcome back!');
        const user = this.authService.currentUser();
        if (user?.role === UserRole.ADMIN) {
          this.router.navigate(['/dashboard/admin/overview']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 403) {
          this.unverifiedEmail = this.form.value.email;
          this.showUnverifiedBanner = true;
        } else if (err.status === 423) {
          this.showSuspendedBanner = true;
        } else {
          this.toastService.error('Invalid email or password');
          this.triggerShake();
        }
      }
    });
  }

  resendVerification(): void {
    if (this.resendCooldown || this.resendLoading) return;
    this.resendLoading = true;
    this.authService.resendVerification(this.unverifiedEmail).subscribe({
      next: () => {
        this.resendLoading = false;
        this.resendCooldown = true;
        this.toastService.success('Verification email sent! Check your inbox.');
        setTimeout(() => this.resendCooldown = false, 45_000);
      },
      error: (err: HttpErrorResponse) => {
        this.resendLoading = false;
        this.toastService.error(err.error?.message ?? 'Could not send email. Try again.');
      }
    });
  }

  private triggerShake(): void {
    this.shakeForm = true;
    setTimeout(() => this.shakeForm = false, 600);
  }
}
