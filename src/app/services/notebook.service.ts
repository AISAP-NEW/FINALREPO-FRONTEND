import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotebookService {
  constructor(private http: HttpClient) {}

  getCode(id: number): Observable<string> {
    return this.http.get(`${environment.apiUrl}/api/ModelFile/read-file/${id}`, { 
      responseType: 'text' 
    });
  }

  executeCode(code: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/Notebook/execute`, { Code: code });
  }
}
