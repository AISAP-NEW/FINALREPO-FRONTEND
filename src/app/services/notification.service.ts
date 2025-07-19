import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  // Add these for API response compatibility
  NotificationId?: number;
  UserId?: number;
  ProjectId?: number;
  ProjectName?: string;
  SenderId?: number;
  SenderName?: string;
  Type?: string;
  Message?: string;
  CreatedDate?: string;
  IsRead?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = `${environment.apiUrl}/api/notification`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred. Please try again later.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'Notification not found.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private normalizeNotification(apiNotification: any): Notification {
    // Handle null or undefined response
    if (!apiNotification) {
      console.error('Received null or undefined notification');
      return {
        notificationId: 0,
        userId: 0,
        type: 'unknown',
        message: 'Invalid notification',
        createdDate: new Date(),
        isRead: false
      };
    }

    // Log the raw notification for debugging
    console.debug('Raw notification from API:', apiNotification);

    // Handle both camelCase and PascalCase properties
    const notification = {
      notificationId: apiNotification.NotificationId ?? apiNotification.notificationId ?? 0,
      userId: apiNotification.UserId ?? apiNotification.userId ?? 0,
      projectId: apiNotification.ProjectId ?? apiNotification.projectId,
      projectName: apiNotification.ProjectName ?? apiNotification.projectName ?? '',
      senderId: apiNotification.SenderId ?? apiNotification.senderId,
      senderName: apiNotification.SenderName ?? apiNotification.senderName ?? '',
      type: apiNotification.Type ?? apiNotification.type ?? '',
      message: apiNotification.Message ?? apiNotification.message ?? '',
      createdDate: new Date(apiNotification.CreatedDate ?? apiNotification.createdDate ?? new Date()),
      isRead: apiNotification.IsRead ?? apiNotification.isRead ?? false,
      // Keep original properties for API compatibility
      NotificationId: apiNotification.NotificationId ?? apiNotification.notificationId ?? 0,
      UserId: apiNotification.UserId ?? apiNotification.userId ?? 0,
      ProjectId: apiNotification.ProjectId ?? apiNotification.projectId,
      ProjectName: apiNotification.ProjectName ?? apiNotification.projectName ?? '',
      SenderId: apiNotification.SenderId ?? apiNotification.senderId,
      SenderName: apiNotification.SenderName ?? apiNotification.senderName ?? '',
      Type: apiNotification.Type ?? apiNotification.type ?? '',
      Message: apiNotification.Message ?? apiNotification.message ?? '',
      CreatedDate: apiNotification.CreatedDate ?? apiNotification.createdDate,
      IsRead: apiNotification.IsRead ?? apiNotification.isRead ?? false
    };

    // Log the normalized notification for debugging
    console.debug('Normalized notification:', notification);

    return notification;
  }

  getNotifications(userId: number): Observable<Notification[]> {
    console.debug('Fetching notifications for userId:', userId);
    return this.http.get<any>(`${this.API_URL}?userId=${userId}`).pipe(
      tap(response => console.debug('Raw API response:', response)),
      map(response => {
        // Handle different response formats
        const notifications = Array.isArray(response) ? response : response.data || response.notifications || [];
        if (!Array.isArray(notifications)) {
          console.error('Invalid notifications response:', response);
          throw new Error('Invalid response format from server');
        }
        return notifications.map(notification => this.normalizeNotification(notification));
      }),
      tap(notifications => console.debug('Normalized notifications:', notifications)),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        return this.handleError(error);
      })
    );
  }

  getUnreadNotifications(userId: number): Observable<Notification[]> {
    console.debug('Fetching unread notifications for userId:', userId);
    return this.http.get<any>(`${this.API_URL}/unread?userId=${userId}`).pipe(
      tap(response => console.debug('Raw API response:', response)),
      map(response => {
        // Handle different response formats
        const notifications = Array.isArray(response) ? response : response.data || response.notifications || [];
        if (!Array.isArray(notifications)) {
          console.error('Invalid notifications response:', response);
          throw new Error('Invalid response format from server');
        }
        return notifications.map(notification => this.normalizeNotification(notification));
      }),
      tap(notifications => console.debug('Normalized notifications:', notifications)),
      catchError(error => {
        console.error('Error fetching unread notifications:', error);
        return this.handleError(error);
      })
    );
  }

  markAsRead(notificationId: number): Observable<void> {
    console.debug('Marking notification as read:', notificationId);
    const url = `${this.API_URL}/markAsRead`;
    const body = {
      NotificationId: notificationId
    };

    return this.http.put<void>(url, body).pipe(
      tap(() => console.debug('Successfully marked notification as read:', notificationId)),
      catchError(error => {
        // If it's a 204 No Content, consider it a success
        if (error.status === 204) {
          console.debug('Received 204 No Content - treating as success');
          return of(undefined);
        }
        console.error('Error marking notification as read:', error);
        return this.handleError(error);
      })
    );
  }

  markAllAsRead(userId: number): Observable<void> {
    console.debug('Marking all notifications as read for userId:', userId);
    const url = `${this.API_URL}/markAllAsRead`;
    const body = {
      UserId: userId
    };

    return this.http.put<void>(url, body).pipe(
      tap(() => console.debug('Successfully marked all notifications as read for userId:', userId)),
      catchError(error => {
        // If it's a 204 No Content, consider it a success
        if (error.status === 204) {
          console.debug('Received 204 No Content - treating as success');
          return of(undefined);
        }
        console.error('Error marking all notifications as read:', error);
        return this.handleError(error);
      })
    );
  }

  createNotification(notification: {
    userId: number;
    projectId?: number;
    senderId?: number;
    type: string;
    message: string;
  }): Observable<void> {
    console.debug('Creating notification:', notification);
    const body = {
      UserId: notification.userId,
      ProjectId: notification.projectId,
      SenderId: notification.senderId,
      Type: notification.type,
      Message: notification.message
    };

    return this.http.post<void>(this.API_URL, body).pipe(
      tap(() => console.debug('Successfully created notification')),
      catchError(error => {
        // If it's a 204 No Content, consider it a success
        if (error.status === 204) {
          console.debug('Received 204 No Content - treating as success');
          return of(undefined);
        }
        console.error('Error creating notification:', error);
        return this.handleError(error);
      })
    );
  }
} 