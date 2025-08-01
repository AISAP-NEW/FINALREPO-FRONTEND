import { Injectable } from '@angular/core';
import { 
  HttpClient, 
  HttpEvent, 
  HttpRequest, 
  HttpHeaders, 
  HttpResponse, 
  HttpEventType,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Project {
  projectId: number;
  name: string;
  description?: string;
}

export interface CloudFile {
  id: number;
  name: string;
  originalName: string;
  size: number;
  type: string;
  uploadDate: Date;
  projectId: number | null;
  description: string;
  downloadUrl: string;
}

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = environment.apiUrl;
  private userId = 1; // This would typically come from an auth service
  private uploadsSubject = new BehaviorSubject<UploadProgress[]>([]);
  uploads$ = this.uploadsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Project Management
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/api/Project?userId=${this.userId}`).pipe(
      catchError(this.handleError)
    );
  }

  // File Operations
  uploadFile(file: File, projectId: number, name: string, description: string = ''): Observable<CloudFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('projectId', projectId.toString());

    // Create upload progress entry
    const uploadId = `${Date.now()}-${file.name}`;
    this.updateUploadProgress(uploadId, {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    });

    const req = new HttpRequest(
      'POST',
      `${this.apiUrl}/api/Files/upload`,
      formData,
      {
        reportProgress: true,
        responseType: 'json'
      }
    );

    return new Observable<CloudFile>(subscriber => {
      this.http.request<CloudFile>(req).pipe(
        tap(event => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round((100 * event.loaded) / (event.total || 1));
            this.updateUploadProgress(uploadId, {
              fileName: file.name,
              progress,
              status: 'uploading'
            });
          } else if (event instanceof HttpResponse) {
            this.updateUploadProgress(uploadId, {
              fileName: file.name,
              progress: 100,
              status: 'completed'
            });
          }
        }),
        catchError(error => {
          this.updateUploadProgress(uploadId, {
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: 'Upload failed. Please try again.'
          });
          return throwError(() => this.handleError(error));
        }),
        finalize(() => {
          // Remove completed upload from the list after a delay
          if (this.uploadsSubject.value.find(u => u.fileName === file.name)?.status === 'completed') {
            setTimeout(() => {
              this.removeUploadProgress(uploadId);
            }, 3000);
          }
        })
      ).subscribe({
        next: (event) => {
          if (event instanceof HttpResponse) {
            subscriber.next(event.body as CloudFile);
            subscriber.complete();
          }
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  // Get files for a specific project
  getProjectFiles(projectId: number): Observable<CloudFile[]> {
    return this.http.get<CloudFile[]>(`${this.apiUrl}/api/Files/project/${projectId}`).pipe(
      map(files => files.map(file => ({
        ...file,
        uploadDate: new Date(file.uploadDate)
      }))),
      catchError(this.handleError)
    );
  }

  // Download a file
  downloadFile(fileId: number, fileName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/Files/download/${fileId}`, {
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    }).pipe(
      tap(event => {
        if (event.type === HttpEventType.DownloadProgress && event.total) {
          const progress = Math.round((100 * event.loaded) / event.total);
          console.log(`Download progress: ${progress}%`);
        }
      }),
      map(event => {
        if (event instanceof HttpResponse) {
          return event.body as Blob;
        }
        throw new Error('Unexpected response type');
      }),
      catchError(this.handleError)
    );
  }

  // Delete a file
  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/Files/${fileId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Helper methods for tracking upload progress
  private updateUploadProgress(id: string, progress: Omit<UploadProgress, 'id'>) {
    const uploads = this.uploadsSubject.value;
    const existingIndex = uploads.findIndex(u => u.fileName === progress.fileName);
    
    if (existingIndex >= 0) {
      uploads[existingIndex] = { ...progress, id };
    } else {
      uploads.push({ ...progress, id });
    }
    
    this.uploadsSubject.next([...uploads]);
  }

  private removeUploadProgress(id: string) {
    const uploads = this.uploadsSubject.value.filter(u => u.id !== id);
    this.uploadsSubject.next(uploads);
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      // Try to extract more detailed error message from response
      if (error.error && typeof error.error === 'object') {
        const serverError = error.error as Record<string, any>;
        if (serverError['message']) {
          errorMessage = serverError['message'];
        } else if (serverError['errors']) {
          // Using bracket notation for type safety and compatibility
          const errors = serverError['errors'] as Record<string, string[]>;
          // Replace flat() with a compatible alternative
          const errorMessages = Object.values(errors).reduce<string[]>(
            (acc, val) => acc.concat(Array.isArray(val) ? val : [val]),
            []
          );
          errorMessage = errorMessages.join('\n');
        }
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
