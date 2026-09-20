import { NgModule, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { authInterceptor } from './txnm-feature/interceptors/auth.interceptor';
import { AuthService } from './txnm-feature/services/auth.service';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { DefAppHome } from './def-app-home/def-app-home';

@NgModule({
  declarations: [
    App,
    DefAppHome
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule,
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
    MatSnackBarModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),  // The HttpClientModule has been replaced with provideHttpClient() in the providers array, which is the modern Angular 20 approach.
    // Recovers a Keycloak session from the httpOnly refresh-token cookie before the app renders,
    // so a page reload doesn't show a logged-out flash for a user who's actually still logged in.
    // See adr04_refresh_token_cookie_flow.md. Never rejects (restoreSession() swallows failures),
    // so a first-time visitor with no cookie still boots normally.
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restoreSession())),
    // Every <mat-icon> app-wide renders via Material Symbols Outlined (index.html's font link)
    // instead of Material Icon's default "material-icons" ligature font - the older filled font
    // read as heavier/more playful at small sizes than this app wants.
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    })
  ],
  bootstrap: [App]
})
export class AppModule { }
