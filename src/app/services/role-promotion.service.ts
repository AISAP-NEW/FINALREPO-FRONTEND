import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CreateRolePromotionRequestDTO {
  userId: number;
  requestedRole: string;
  justification?: string;
}

export interface RolePromotionRequestDTO {
  requestId: number;
  userId: number;
  username: string;
  userEmail: string;
  currentRole: string;
  requestedRole: string;
  justification?: string;
  status: PromotionRequestStatus;
  requestDate: Date;
  reviewedDate?: Date;
  reviewedBy?: number;
  reviewedByUsername?: string;
  adminComments?: string;
  rejectionReason?: string;
}

export interface RolePromotionRequestSummaryDTO {
  RequestId: number;
  UserId: number;
  Username: string;
  CurrentRole: string;
  RequestedRole: string;
  Status: PromotionRequestStatus;
  RequestDate: Date;
  Justification?: string;
}

export interface UserPromotionRequestDTO {
  RequestId: number;
  UserId: number;
  CurrentRole: string;
  RequestedRole: string;
  Justification?: string;
  Status: PromotionRequestStatus;
  RequestDate: Date;
  ReviewedDate?: Date;
  ReviewedByUsername?: string;
  AdminComments?: string;
  RejectionReason?: string;
}

export interface ReviewRolePromotionRequestDTO {
  requestId: number;
  reviewedBy: number;
  isApproved: boolean;
  adminComments?: string;
  rejectionReason?: string;
}

export interface RolePromotionResponseDTO {
  success: boolean;
  message: string;
  request?: RolePromotionRequestDTO;
}

export enum PromotionRequestStatus {
  Pending = 0,
  Approved = 1,
  Denied = 2,
  Cancelled = 3
}

@Injectable({
  providedIn: 'root'
})
export class RolePromotionService {
  private readonly API_URL = `${environment.apiUrl}/api/RolePromotion`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('Role Promotion Service Error:', error);
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
        errorMessage = 'Resource not found.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status >= 400) {
        errorMessage = error.error?.message || error.error || 'Bad request.';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Request role promotion
  requestRolePromotion(request: CreateRolePromotionRequestDTO): Observable<RolePromotionResponseDTO> {
    return this.http.post<RolePromotionResponseDTO>(`${this.API_URL}/request`, request).pipe(
      tap(response => console.log('Role promotion request created:', response)),
      catchError(this.handleError)
    );
  }

  // Get pending requests (Admin only)
  getPendingRequests(): Observable<RolePromotionRequestSummaryDTO[]> {
    return this.http.get<RolePromotionRequestSummaryDTO[]>(`${this.API_URL}/pending`).pipe(
      tap(requests => console.log('Pending role promotion requests:', requests)),
      catchError(this.handleError)
    );
  }

  // Get all requests (Admin only)
  getAllRequests(): Observable<RolePromotionRequestDTO[]> {
    return this.http.get<RolePromotionRequestDTO[]>(`${this.API_URL}/all`).pipe(
      tap(requests => console.log('All role promotion requests:', requests)),
      catchError(this.handleError)
    );
  }

  // Get user's own requests
  getUserRequests(userId: number): Observable<UserPromotionRequestDTO[]> {
    return this.http.get<UserPromotionRequestDTO[]>(`${this.API_URL}/user/${userId}`).pipe(
      tap(requests => console.log('User role promotion requests:', requests)),
      catchError(this.handleError)
    );
  }

  // Review promotion request (Admin only)
  reviewPromotionRequest(review: ReviewRolePromotionRequestDTO): Observable<RolePromotionResponseDTO> {
    return this.http.put<RolePromotionResponseDTO>(`${this.API_URL}/review`, review).pipe(
      tap(response => console.log('Role promotion request reviewed:', response)),
      catchError(this.handleError)
    );
  }

  // Cancel promotion request
  cancelPromotionRequest(requestId: number, userId: number): Observable<RolePromotionResponseDTO> {
    return this.http.delete<RolePromotionResponseDTO>(`${this.API_URL}/cancel/${requestId}?userId=${userId}`).pipe(
      tap(response => console.log('Role promotion request cancelled:', response)),
      catchError(this.handleError)
    );
  }
}
