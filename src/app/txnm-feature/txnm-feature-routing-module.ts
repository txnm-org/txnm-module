import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TxnmFeature } from './txnm-feature';
import { TxnmHome } from './components/txnm-home/txnm-home';
import { TransactionList } from './components/transaction-list/transaction-list';
import { UploadPdf } from './components/upload-pdf/upload-pdf';
import { Individuals } from './components/pages/individuals/individuals';
import { Businesses } from './components/pages/businesses/businesses';
import { Register } from './components/pages/register/register';
import { Login } from './components/pages/login/login';
import { ForgotPassword } from './components/pages/forgot-password/forgot-password';
import { AboutUs } from './components/pages/about-us/about-us';
import { Analytics } from './components/analytics/analytics';
import { DailyAnalytics } from './components/analytics/daily-analytics/daily-analytics';
// Disabled for now - DataGuard checks a localStorage key ('txnm_session_id') that nothing
// actually writes (session id now lives only in-memory in SessionService), so it always denies
// access. Re-enable once that's fixed - see data-guard.service.ts / data.guard.ts.
// import { DataGuard } from './guards/data.guard';

const routes: Routes = [
  {
    path: '', 
    component: TxnmFeature,
    children: [
      { path: '', component: TxnmHome, pathMatch: 'full' },
      { path: 'transactions', component: TransactionList },
      { path: 'upload', component: UploadPdf },
      { path: 'individuals', component: Individuals },
      { path: 'businesses', component: Businesses },
      { path: 'register', component: Register },
      { path: 'login', component: Login },
      { path: 'forgot-password', component: ForgotPassword },
      { path: 'about', component: AboutUs },
      { path: 'analytics', component: Analytics /*, canActivate: [DataGuard] */ },
      { path: 'analytics/daily', component: DailyAnalytics /*, canActivate: [DataGuard] */ },
      { path: '**', redirectTo: '' }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TxnmFeatureRoutingModule { }
