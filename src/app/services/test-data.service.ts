import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TestDataService {
	private base = `${environment.apiUrl}/api/TestData`;

	constructor(private http: HttpClient) {}

	generateCsv(): Observable<Blob> {
		return this.http.get(`${this.base}/generate`, { responseType: 'blob' });
	}
}


