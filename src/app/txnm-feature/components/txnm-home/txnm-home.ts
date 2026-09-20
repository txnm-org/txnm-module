import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransactionService } from '../../services/transaction.service';
import { AuthService } from '../../services/auth.service';
import { BankConfig } from '../../models/api-response.model';

@Component({
  selector: 'app-txnm-home',
  standalone: false,
  templateUrl: './txnm-home.html',
  styleUrl: './txnm-home.css'
})
export class TxnmHome implements OnInit {
  uploadForm: FormGroup;
  bankConfigs: { [key: string]: BankConfig } = {};
  selectedFile: File | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  isAuthenticated = false;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.uploadForm = this.fb.group({
      selectedBank: ['', Validators.required],
      statementKey: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.bankConfigs = this.transactionService.getBankConfigs();
    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
        this.uploadForm.patchValue({ file: file });
        this.errorMessage = null;
      } else {
        this.errorMessage = 'Please upload a PDF file';
        this.selectedFile = null;
      }
    }
  }

  onBankChange(): void {
    const selectedBank = this.uploadForm.get('selectedBank')?.value;
    this.uploadForm.patchValue({ statementKey: '' });
    this.errorMessage = null;
  }

  onKeyChange(): void {
    const selectedBank = this.uploadForm.get('selectedBank')?.value;
    const statementKey = this.uploadForm.get('statementKey')?.value;
    
    if (selectedBank && statementKey) {
      const isValid = this.transactionService.validateBankKey(selectedBank, statementKey);
      if (!isValid) {
        const config = this.bankConfigs[selectedBank];
        this.errorMessage = `Invalid format. ${config.keyHint}`;
      } else {
        this.errorMessage = null;
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (this.uploadForm.valid && !this.errorMessage && this.selectedFile) {
      try {
        this.isLoading = true;
        this.errorMessage = null;

        // Only create a guest session if there's no real login already - otherwise this would
        // silently overwrite a logged-in user's session with a guest one on every upload.
        if (!this.authService.hasValidSession()) {
          await this.authService.loginAsGuest().toPromise();
        }

        const formData = this.uploadForm.value;
        const transactions = await this.transactionService.parseTransactions(
          this.selectedFile,
          formData.statementKey,
          formData.selectedBank
        ).toPromise();

        if (transactions) {
          this.snackBar.open('Transactions parsed successfully!', 'Close', {
            duration: 3000
          });

          // Navigate to analytics dashboard
          this.router.navigate(['/txnm/analytics'], {
            state: { message: 'Transactions parsed successfully!' }
          });
        }
      } catch (error: any) {
        this.errorMessage = error?.message || 'An error occurred while processing the file';
      } finally {
        this.isLoading = false;
      }
    }
  }

  getSelectedBankConfig(): BankConfig | null {
    const selectedBank = this.uploadForm.get('selectedBank')?.value;
    return selectedBank ? this.bankConfigs[selectedBank] : null;
  }

  getFileName(): string {
    return this.selectedFile ? this.selectedFile.name : 'Upload PDF Statement';
  }

  scrollToUpload(): void {
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
