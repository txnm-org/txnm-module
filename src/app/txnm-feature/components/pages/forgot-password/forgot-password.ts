import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  step: 'request' | 'reset' = 'request';
  isSubmitting = false;
  errorMessage: string | null = null;

  requestForm: FormGroup;
  resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      otp: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  submitRequest(): void {
    if (this.requestForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.authService.forgotPassword(this.requestForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.step = 'reset';
        // kc-auth-service always responds the same way whether or not the email is registered
        // (see UserController.forgotPassword) - the message here mirrors that intentionally.
        this.snackBar.open('If this email is registered, an OTP was sent', 'Close', { duration: 4000 });
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Something went wrong, please try again';
      }
    });
  }

  submitReset(): void {
    if (this.resetForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.authService.resetPassword({
      email: this.requestForm.value.email,
      otp: this.resetForm.value.otp,
      newPassword: this.resetForm.value.newPassword
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('Password reset - please log in', 'Close', { duration: 4000 });
        this.router.navigate(['/txnm/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Invalid or expired OTP';
      }
    });
  }

  backToRequest(): void {
    this.step = 'request';
    this.errorMessage = null;
  }

  goToLogin(): void {
    this.router.navigate(['/txnm/login']);
  }
}
