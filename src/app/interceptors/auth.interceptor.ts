import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const token = localStorage.getItem('token');
    const isApiRequest = req.url.startsWith(environment.apiUrl);
    const hasAuthHeader = req.headers.has('Authorization');

    if (token && isApiRequest && !hasAuthHeader) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  } catch {
    // localStorage might be unavailable in some contexts; ignore
  }

  return next(req);
};


