import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password        = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  if (confirmPassword?.errors?.['mismatch']) {
    confirmPassword.setErrors(null);
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {

  form!: FormGroup;
  loading = false;
  showPassword = false;
  showConfirm  = false;
  shakeForm    = false;
  passwordStrength = 0; // 0-4

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.form = this.fb.group({
      firstName:       ['', [Validators.required, Validators.minLength(2)]],
      lastName:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      dateOfBirth:     [''],
      phoneNumber:     ['', [Validators.pattern(/^\+?[0-9\s\-]{7,15}$/)]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    this.form.get('password')!.valueChanges.subscribe(v => {
      this.passwordStrength = this.calcStrength(v);
    });
  }

  get firstName()       { return this.form.get('firstName')!; }
  get lastName()        { return this.form.get('lastName')!; }
  get email()           { return this.form.get('email')!; }
  get dateOfBirth()     { return this.form.get('dateOfBirth')!; }
  get phoneNumber()     { return this.form.get('phoneNumber')!; }
  get password()        { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  get strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.passwordStrength];
  }

  get strengthClass(): string {
    return ['', 'weak', 'fair', 'good', 'strong'][this.passwordStrength];
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
  toggleConfirm():  void { this.showConfirm  = !this.showConfirm; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.triggerShake();
      return;
    }

    this.loading = true;
    const { firstName, lastName, email, password, dateOfBirth, phoneNumber } = this.form.value;

    this.authService.register({
      firstName, lastName, email, password,
      dateOfBirth: dateOfBirth || undefined,
      phoneNumber: phoneNumber || undefined
    }).subscribe({
      next: () => {
        this.toastService.success('Account created! Welcome aboard 🎉');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message ?? 'Registration failed. Please try again.';
        this.toastService.error(msg);
        this.triggerShake();
      }
    });
  }

  private triggerShake(): void {
    this.shakeForm = true;
    setTimeout(() => this.shakeForm = false, 600);
  }

  private calcStrength(pwd: string): number {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8)          score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }
}
