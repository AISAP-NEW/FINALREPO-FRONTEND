import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Notification {
  notificationId: number;
  userId: number;
  projectId?: number;
  projectName?: string;
  senderId?: number;
  senderName?: string;
  type: string;
  message: string;
  createdDate: Date;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/notification`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 30000; // Poll every 30 seconds

  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Initialize unread count and start polling
    this.refreshUnreadCount();
    this.startPolling();

    // Subscribe to auth state changes
    this.authService.isAuthenticated$.subscribe((isAuthenticated: boolean) => {
      if (isAuthenticated) {
        this.startPolling();
      } else {
        this.stopPolling();
        this.unreadCountSubject.next(0);
      }
    });
  }

  private startPolling() {
    // Stop any existing polling
    this.stopPolling();

    // Start new polling only if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.pollingSubscription = interval(this.POLLING_INTERVAL)
        .subscribe(() => this.refreshUnreadCount());
    }
  }

  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  getNotifications(): Observable<Notification[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of([]);
    
    return this.http.get<Notification[]>(`${this.apiUrl}?userId=${currentUser.userId}`)
      .pipe(
        map(notifications => notifications.map(n => ({
          ...n,
          createdDate: new Date(n.createdDate)
        }))),
        catchError(error => {
          console.error('Error fetching notifications:', error);
          return of([]);
        })
      );
  }

  getUnreadNotifications(): Observable<Notification[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of([]);
    
    return this.http.get<Notification[]>(`${this.apiUrl}/unread?userId=${currentUser.userId}`)
      .pipe(
        map(notifications => notifications.map(n => ({
          ...n,
          createdDate: new Date(n.createdDate)
        }))),
        catchError(error => {
          console.error('Error fetching unread notifications:', error);
          return of([]);
        })
      );
  }

  markAsRead(notificationId: number): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return of(false);
    }

    return this.http.put(`${this.apiUrl}/markAsRead`, { 
      notificationId,
      userId: currentUser.userId 
    }).pipe(
      tap(() => {
        // Update the local unread count
        this.refreshUnreadCount();
        
        // Log for debugging
        console.log('Marked notification as read:', notificationId);
      }),
      catchError(error => {
        console.error('Error marking notification as read:', error);
        throw error;
      })
    );
  }

  markAllAsRead(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/markAllAsRead`, { userId })
      .pipe(
        tap(() => {
          // Update the local unread count
          this.refreshUnreadCount();
          
          // Log for debugging
          console.log('Marked all notifications as read for user:', userId);
        }),
        catchError(error => {
          console.error('Error marking all notifications as read:', error);
          throw error;
        })
      );
  }

  private refreshUnreadCount() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.unreadCountSubject.next(0);
      return;
    }

    this.getUnreadNotifications().subscribe(
      notifications => {
        const count = notifications.length;
        console.log('Updated unread count:', count);
        this.unreadCountSubject.next(count);
      },
      error => {
        console.error('Error refreshing unread count:', error);
        this.unreadCountSubject.next(0);
      }
    );
  }

  // Clean up on service destroy
  ngOnDestroy() {
    this.stopPolling();
  }
} 