import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const token = localStorage.getItem('token');
    const isApiRequest = req.url.startsWith(environment.apiUrl);
    const hasAuthHeader = req.headers.has('Authorization');

    console.log('AuthInterceptor Debug:', {
      url: req.url,
      isApiRequest,
      hasAuthHeader,
      token: token ? `${token.substring(0, 10)}...` : 'null',
      localStorageKeys: Object.keys(localStorage)
    });

    if (token && isApiRequest && !hasAuthHeader) {
      console.log('Adding Authorization header to request');
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else if (isApiRequest && !token) {
      console.warn('API request without token:', req.url);
    }
  } catch (error) {
    console.error('AuthInterceptor error:', error);
    // localStorage might be unavailable in some contexts; ignore
  }

  return next(req);
};


