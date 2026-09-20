import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, User } from '../../services/auth.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAuthenticated = false;
  currentRoute = '';
  isMobileMenuOpen = false;
  private destroy$ = new Subject<void>();

  // Navigation menu items
  menuItems = [
    { label: 'Home', route: '/txnm', icon: 'home' },
    { label: 'Individuals', route: '/txnm/individuals', icon: 'person' },
    { label: 'Enterprise', route: '/txnm/businesses', icon: 'business' },
    { label: 'Register', route: '/txnm/register', icon: 'person_add' },
    { label: 'About Us', route: '/txnm/about', icon: 'info' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to user authentication state
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      });

    // Track current route for active navigation highlighting
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Check if a route is currently active
  isActiveRoute(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  // Navigate to a specific route
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // Handle logout
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.snackBar.open('Logged out successfully', 'Close', {
          duration: 3000
        });
        this.router.navigate(['/txnm']);
      },
      error: (error) => {
        this.snackBar.open('Logout failed', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // Get user display name
  getUserDisplayName(): string {
    if (!this.currentUser) return 'Guest';
    return this.currentUser.fullName || this.currentUser.email || 'User';
  }

  // Get user type display
  getUserTypeDisplay(): string {
    if (!this.currentUser) return 'Guest User';
    return this.currentUser.userType === 'GUEST' ? 'Guest User' : 'Registered User';
  }

  // Single letter shown in the profile avatar
  getUserInitial(): string {
    const name = this.getUserDisplayName();
    return name.charAt(0).toUpperCase();
  }

  // Toggle mobile menu
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
