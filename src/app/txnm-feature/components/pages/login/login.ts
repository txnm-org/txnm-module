import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('Logged in successfully', 'Close', { duration: 3000 });
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/txnm';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.error_description || err?.error?.message || 'Invalid username or password';
      }
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  goToRegister(): void {
    this.router.navigate(['/txnm/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/txnm/forgot-password']);
  }
}
