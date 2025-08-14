import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, throwError, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BackupResult {
  message?: string;
  path?: string;
  fileName?: string;
  blob?: Blob;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    // Heuristics to find a JWT in storage
    const possibleKeys = ['token', 'authToken', 'accessToken', 'jwt', 'jwtToken'];
    let token: string | null = null;

    for (const key of possibleKeys) {
      const val = localStorage.getItem(key);
      if (val) { token = val; break; }
    }

    // Sometimes token stored inside currentUser
    if (!token) {
      const cu = localStorage.getItem('currentUser');
      if (cu) {
        try {
          const obj = JSON.parse(cu);
          token = obj?.token || obj?.Token || null;
        } catch {}
      }
    }

    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  backupDatabase(backupDirectory?: string | null): Observable<BackupResult> {
    let params = new HttpParams();
    if (backupDirectory) params = params.set('backupDirectory', backupDirectory);

    const candidates = [
      `${this.base}/export/db/backup`,
      `${this.base}/db/backup`,
      `${this.base}/Admin/db/backup`,
      `${this.base}/Maintenance/db/backup`,
      `${this.base}/System/db/backup`,
      `${this.base}/Database/db/backup`
    ];

    return this.tryBackupEndpoint(candidates, 0, params);
  }

  private tryBackupEndpoint(candidates: string[], index: number, params: HttpParams): Observable<BackupResult> {
    if (index >= candidates.length) {
      return throwError(() => new Error('Backup endpoint not found (404). Please verify controller route on backend.'));
    }
    const url = candidates[index];
    console.log('[DB Backup] Trying endpoint:', url);

    return this.http.post(url, null, {
      params,
      observe: 'response',
      responseType: 'blob',
      headers: this.getAuthHeaders()
    }).pipe(
      switchMap((res: HttpResponse<Blob>) => {
        const contentType = res.headers.get('Content-Type') || '';
        const contentDisp = res.headers.get('Content-Disposition') || '';

        if (contentType.includes('application/json')) {
          return this.blobToText(res.body as Blob).pipe(
            map(txt => {
              try {
                const json = JSON.parse(txt);
                return { message: json.message, path: json.path } as BackupResult;
              } catch {
                return { message: txt } as BackupResult;
              }
            })
          );
        }

        const fileName = this.getFileNameFromContentDisposition(contentDisp) || `database_backup_${new Date().toISOString()}.bak`;
        return of({ blob: res.body as Blob, fileName } as BackupResult);
      }),
      catchError(err => {
        if (err?.status === 404) {
          return this.tryBackupEndpoint(candidates, index + 1, params);
        }
        if (err?.error instanceof Blob) {
          return this.blobToText(err.error).pipe(
            switchMap(txt => {
              try {
                const j = JSON.parse(txt);
                return throwError(() => new Error(j?.details || j?.error || 'Backup failed'));
              } catch {
                return throwError(() => new Error(txt || 'Backup failed'));
              }
            })
          );
        }
        return throwError(() => err);
      })
    );
  }

  restoreDatabase(file: File): Observable<{ message: string }> {
    const form = new FormData();
    form.append('backupFile', file);

    const candidates = [
      `${this.base}/export/db/restore`,
      `${this.base}/db/restore`,
      `${this.base}/Admin/db/restore`,
      `${this.base}/Maintenance/db/restore`,
      `${this.base}/System/db/restore`,
      `${this.base}/Database/db/restore`
    ];

    return this.tryRestoreEndpoint(candidates, 0, form);
  }

  private tryRestoreEndpoint(candidates: string[], index: number, form: FormData): Observable<{ message: string }> {
    if (index >= candidates.length) {
      return throwError(() => new Error('Restore endpoint not found (404). Please verify controller route on backend.'));
    }
    const url = candidates[index];
    console.log('[DB Restore] Trying endpoint:', url);

    return this.http.post<{ message: string }>(url, form, { headers: this.getAuthHeaders() }).pipe(
      catchError(err => {
        if (err?.status === 404) {
          return this.tryRestoreEndpoint(candidates, index + 1, form);
        }
        const msg = err?.error?.details || err?.error?.error || err?.message || 'Restore failed';
        return throwError(() => new Error(msg));
      })
    );
  }

  private getFileNameFromContentDisposition(cd: string): string | null {
    if (!cd) return null;
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
    return decodeURIComponent(match?.[1] || match?.[2] || '');
  }

  private blobToText(blob: Blob): Observable<string> {
    return new Observable<string>(observer => {
      const reader = new FileReader();
      reader.onload = () => { observer.next((reader.result as string) || ''); observer.complete(); };
      reader.onerror = () => observer.error(reader.error);
      reader.readAsText(blob);
    });
  }
}
