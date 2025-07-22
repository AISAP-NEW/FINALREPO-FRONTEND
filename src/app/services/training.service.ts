import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  constructor(private http: HttpClient) {}

  startTraining(config: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/Training/start`, config);
  }

  getStatus(sessionId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/Training/status/${sessionId}`);
  }

  pause(sessionId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/Training/pause/${sessionId}`, {});
  }

  resume(sessionId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/Training/resume/${sessionId}`, {});
  }
}
