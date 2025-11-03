import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastContainerComponent } from './shared/components/common/toast-container/toast-container.component';
import { AuthService } from './shared/services/auth.service';
import { InactivityService } from './shared/services/inactivity.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    ToastContainerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Panel de Estadísticas | La Agencias';
  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private inactivityService: InactivityService
  ) {}

  ngOnInit(): void {
    // Watch for authentication state changes
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // Start monitoring inactivity when user logs in
        this.inactivityService.startWatching();
      } else {
        // Stop monitoring when user logs out
        this.inactivityService.stopWatching();
      }
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.inactivityService.stopWatching();
  }
}
