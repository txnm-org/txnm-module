import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

// Lucide icons - thin-stroke line icons (matches Credable's own wcl-admin-frontend's hand-drawn
// SVG icon style) used in Header, TxnmHome, Login, Register and ForgotPassword. Other, untouched
// pages (analytics, transaction-list, etc.) still use Material Symbols Outlined via <mat-icon>.
import {
  LucideActivity,
  LucideBuildingComplex,
  LucideChartColumn,
  LucideCircleUserRound,
  LucideCloudUpload,
  LucideFileText,
  LucideHouse,
  LucideInfo,
  LucideKeyRound,
  LucideLandmark,
  LucideLayoutDashboard,
  LucideLock,
  LucideLogIn,
  LucideMenu,
  LucideShieldCheck,
  LucideTrendingUp,
  LucideUser,
  LucideUserPlus,
  LucideX
} from '@lucide/angular';

// Chart.js Modules
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { TxnmFeatureRoutingModule } from './txnm-feature-routing-module';
import { TxnmFeature } from './txnm-feature';
import { UploadPdf } from './components/upload-pdf/upload-pdf';
import { TxnmHome } from './components/txnm-home/txnm-home';
import { TxnmApi } from './services/txnm-api';
import { NgSelectModule } from '@ng-select/ng-select';
import { ContentProj } from './components/upload-pdf/content-proj/content-proj';

// Import our new services
import { BaseApiService } from './services/base-api.service';
import { AuthService } from './services/auth.service';
import { TransactionService } from './services/transaction.service';
import { Header } from './components/header/header';
import { TransactionList } from './components/transaction-list/transaction-list';
import { Individuals } from './components/pages/individuals/individuals';
import { Businesses } from './components/pages/businesses/businesses';
import { Register } from './components/pages/register/register';
import { Login } from './components/pages/login/login';
import { ForgotPassword } from './components/pages/forgot-password/forgot-password';
import { AboutUs } from './components/pages/about-us/about-us';
import { Analytics } from './components/analytics/analytics';
import { DailyAnalytics } from './components/analytics/daily-analytics/daily-analytics';
import { SummaryCards } from './components/analytics/shared/summary-cards';
import { ChartContainer } from './components/analytics/shared/chart-container';


@NgModule({
  declarations: [
    TxnmFeature,
    UploadPdf,
    TxnmHome,
    ContentProj,
    Header,
    TransactionList,
    Individuals,
    Businesses,
    Register,
    Login,
    ForgotPassword,
    AboutUs,
    Analytics,
    DailyAnalytics,
    SummaryCards,
    ChartContainer
  ],
  providers: [
    TxnmApi,
    provideCharts(withDefaultRegisterables())
  ],
  imports: [
    CommonModule,
    TxnmFeatureRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    // Angular Material Modules
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
    BaseChartDirective,
    LucideActivity,
    LucideBuildingComplex,
    LucideChartColumn,
    LucideCircleUserRound,
    LucideCloudUpload,
    LucideFileText,
    LucideHouse,
    LucideInfo,
    LucideKeyRound,
    LucideLandmark,
    LucideLayoutDashboard,
    LucideLock,
    LucideLogIn,
    LucideMenu,
    LucideShieldCheck,
    LucideTrendingUp,
    LucideUser,
    LucideUserPlus,
    LucideX
  ],
  exports: [
    TxnmFeature
  ]
})
export class TxnmFeatureModule { }
