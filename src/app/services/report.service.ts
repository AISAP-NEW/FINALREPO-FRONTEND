import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService, User } from './auth.service';

export interface UsersReportRequest {
  startDate?: Date;
  endDate?: Date;
  includeLogo?: boolean;
  logoPath?: string;
}

export interface UsersReportResponse {
  Users: UserReportItem[];
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

export interface UserReportItem {
  UserId: number;
  Username: string;
  Email: string;
  Role: string;
  LastLoginDate?: Date;
  ProjectCount: number;
  IsActive: boolean;
}

export interface ClientsProjectsReportRequest {
  includeLogo?: boolean;
  logoPath?: string;
}

export interface ClientsProjectsReportResponse {
  Clients: ClientProjectReportItem[];
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

export interface ClientProjectReportItem {
  ClientId: number;
  ClientName: string;
  ClientEmail: string;
  ClientPhone: string;
  Projects: ProjectReportItem[];
  TotalProjects: number;
  ActiveProjects: number;
}

export interface ProjectReportItem {
  ProjectId: number;
  ProjectName: string;
  Objectives: string;
  Technologies: string;
  CreatedDate: Date;
  EstimatedTimeline: Date;
  IsActive: boolean;
  TeamMemberCount: number;
}

export interface TrainingSessionReportRequest {
  startDate?: Date;
  endDate?: Date;
  includeLogo?: boolean;
  logoPath?: string;
}

export interface TrainingSessionReportResponse {
  Sessions: TrainingSessionReportItem[];
  TrainingTrends: ChartDataPoint[];
  SuccessRateData: ChartDataPoint[];
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

export interface TrainingSessionReportItem {
  TrainSessionId: number;
  ModelId: number;
  ModelName: string;
  Status: string;
  StartedAt: Date;
  CompletedAt?: Date;
  Duration?: string;
  LearningRate: number;
  TrainingConfig: string;
  Metrics: string;
  ErrorMessage: string;
}

export interface ModelDeploymentReportRequest {
  startDate?: Date;
  endDate?: Date;
  includeLogo?: boolean;
  logoPath?: string;
}

export interface ModelDeploymentReportResponse {
  Deployments: ModelDeploymentReportItem[];
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

export interface ModelDeploymentReportItem {
  DeploymentId: number;
  AppName: string;
  Environment: string;
  Version: string;
  Status: string;
  DateSubmitted: Date;
  ApprovalTimestamp?: Date;
  RequestedBy: string;
  ApprovedBy: string;
  Endpoint: string;
}

export interface DatasetTransactionReportRequest {
  startDate?: Date;
  endDate?: Date;
  includeLogo?: boolean;
  logoPath?: string;
}

export interface DatasetTransactionReportResponse {
  DatasetGroups?: DatasetGroup[];
  TransactionGroups?: DatasetTransactionGroup[]; // Keep for backward compatibility
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

export interface DatasetGroup {
  DatasetName: string;
  DatasetId: string;
  ActionGroups: ActionGroup[];
  TotalActions: number;
  LastActionDate: Date;
}

export interface ActionGroup {
  ActionType: string;
  Transactions: TransactionItem[];
  TotalActions: number;
  LastActionDate: Date;
}

// Keep old interface for backward compatibility
export interface DatasetTransactionGroup {
  DeveloperName: string;
  DeveloperId: number;
  DatasetActions: DatasetActionGroup[];
  TotalActions: number;
  LastActionDate: Date;
}

export interface DatasetActionGroup {
  DatasetName: string;
  DatasetId: string;
  Transactions: TransactionItem[];
  TotalActions: number;
  LastActionDate: Date;
}

export interface TransactionItem {
  TransactionId: string;
  Action: string;
  Details: string;
  Timestamp: Date;
  FileName: string;
}

export interface DatasetStatusReportRequest {
  includeLogo?: boolean;
  logoPath?: string;
}

export interface DatasetStatusReportResponse {
  Datasets: DatasetStatusReportItem[];
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

export interface DatasetStatusReportItem {
  DatasetId: string;
  DatasetName: string;
  Description: string;
  FileType: string;
  Version: string;
  CreatedAt: Date;
  UploadedAt: Date;
  ValidationStatus: string;
  FileCount: number;
  TotalFileSize: number;
  LogCount: number;
  LastActivity?: Date;
}

export interface DatasetTrendsReportRequest {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  includeLogo?: boolean;
  logoPath?: string;
}

export interface DatasetTrendsReportResponse {
  Trends: DatasetTrendItem[];
  UploadTrends: ChartDataPoint[];
  ProcessingTrends: ChartDataPoint[];
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

export interface DatasetTrendItem {
  Period: string;
  UploadCount: number;
  ProcessedCount: number;
  ValidatedCount: number;
  FailedCount: number;
  TotalFileSize: number;
  AverageProcessingTime: number;
  GroupKey: string;
  TotalDatasets: number;
  SuccessRate: number;
  FileTypes: string[];
}

export interface ModelTrainingSummaryReportRequest {
  startDate?: Date;
  endDate?: Date;
  includeLogo?: boolean;
  logoPath?: string;
}

export interface ModelTrainingSummaryReportResponse {
  TrainingGroups: ModelTrainingGroup[];
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

// Model Activity by Experiment Report interfaces
export interface ModelActivityByExperimentReportRequest {
  startDate?: Date;
  endDate?: Date;
  modelName?: string;
  userName?: string;
  includeLogo?: boolean;
  logoPath?: string;
}

export interface ModelActivityByExperimentReportResponse {
  ExperimentGroups: ExperimentStatusGroup[];
  GrandTotals: ExperimentGroupTotals;
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

export interface ExperimentStatusGroup {
  Status: string;
  Experiments: ExperimentReportItem[];
  SubTotals: ExperimentGroupTotals;
  Subtotal: number;
}

export interface ExperimentReportItem {
  ExperimentId: number;
  ExperimentName: string;
  Status: string;
  CreatedDate: string;
  LastModified: string;
  ModelFileName: string;
  FilePath: string;
  FileSize: number;
  FileType: string;
  CreatedByUser: string;
  ModelName: string;
}

export interface ExperimentGroupTotals {
  TotalExperiments: number;
  CompletedExperiments: number;
  RunningExperiments: number;
  FailedExperiments: number;
  TotalFileSize: number;
  AverageFileSize: number;
}

// Model Deployment Status Report interfaces
export interface ModelDeploymentStatusReportRequest {
  includeLogo?: boolean;
  logoPath?: string;
}

export interface ModelDeploymentStatusReportResponse {
  DeploymentGroups: ModelDeploymentStatusGroup[];
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

export interface ModelDeploymentStatusGroup {
  Status: string;
  Deployments: ModelDeploymentStatusItem[];
  Subtotal: number;
}

export interface ModelDeploymentStatusItem {
  DeploymentId: number;
  ModelName: string;
  DeployedBy: string;
  DeployedDate: string;
  AppName: string;
  Environment: string;
  Version: string;
  Status: string;
  DateSubmitted: string;
  ApprovalTimestamp?: string;
  RequestedBy: string;
  ApprovedBy: string;
  Endpoint: string;
}

export interface ModelTrainingGroup {
  ModelType: string;
  TotalSessions: number;
  SuccessfulSessions: number;
  FailedSessions: number;
  AverageAccuracy: number;
  AverageTrainingTime: number;
  SubGroups: ModelTrainingSubGroup[];
  Totals: ModelTrainingTotals;
}

export interface ModelTrainingSubGroup {
  ModelName: string;
  SessionsCount: number;
  SuccessfulCount: number;
  FailedCount: number;
  AverageAccuracy: number;
  AverageTrainingTime: number;
  Sessions: TrainingSessionItem[];
  SubTotals: ModelTrainingTotals;
}

export interface TrainingSessionItem {
  SessionId: string;
  ModelName: string;
  Status: string;
  StartTime: Date;
  EndTime?: Date;
  Accuracy?: number;
  TrainingTime?: number;
  ErrorMessage?: string;
}

export interface ModelTrainingTotals {
  TotalSessions: number;
  TotalSuccessful: number;
  TotalFailed: number;
  OverallAccuracy: number;
  TotalTrainingTime: number;
  SuccessRate: number;
}

export interface ChartDataPoint {
  Label: string;
  Value: number;
  Color: string;
}

export interface ReportSummary {
  TotalRecords: number;
  GeneratedAt: Date;
  GeneratedBy: string;
  GenerationTime: string;
  AdditionalMetrics: { [key: string]: any };
}

export interface ReportMetadata {
  ReportTitle: string;
  ReportType: string;
  StartDate: Date;
  EndDate: Date;
  AppliedFilters: string[];
  LogoPath: string;
  CompanyName: string;
  GeneratedBy: string;
  IncludeLogo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/Report`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Users Report
  generateUsersReport(request: UsersReportRequest): Observable<UsersReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get<UsersReportResponse>(`${this.apiUrl}/users`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath),
          GeneratedBy: currentUser ? (currentUser.username || currentUser.Username || 'System') : 'System',
          GeneratedByEmail: currentUser ? (currentUser.email || currentUser.Email || 'system@aisap.com') : 'system@aisap.com'
        } 
      })),
      catchError(error => {
        console.error('Error generating users report:', error);
        throw error;
      })
    );
  }

  generateUsersReportPdf(request: UsersReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get(`${this.apiUrl}/users/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating users report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateUsersReportJson(request: UsersReportRequest): Observable<UsersReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get<UsersReportResponse>(`${this.apiUrl}/users/json`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath),
          GeneratedBy: currentUser ? (currentUser.username || currentUser.Username || 'System') : 'System',
          GeneratedByEmail: currentUser ? (currentUser.email || currentUser.Email || 'system@aisap.com') : 'system@aisap.com'
        } 
      })),
      catchError(error => {
        console.error('Error generating users report JSON:', error);
        throw error;
      })
    );
  }

  generateUsersReportExcel(request: UsersReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get(`${this.apiUrl}/users/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating users report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Clients and Projects Report
  generateClientsProjectsReport(request: ClientsProjectsReportRequest): Observable<ClientsProjectsReportResponse> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get<ClientsProjectsReportResponse>(`${this.apiUrl}/clients-projects`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath),
          GeneratedBy: currentUser ? (currentUser.username || currentUser.Username || 'System') : 'System',
          GeneratedByEmail: currentUser ? (currentUser.email || currentUser.Email || 'system@aisap.com') : 'system@aisap.com'
        } 
      })),
      catchError(error => {
        console.error('Error generating clients projects report:', error);
        throw error;
      })
    );
  }

  generateClientsProjectsReportPdf(request: ClientsProjectsReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get(`${this.apiUrl}/clients-projects/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating clients projects report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateClientsProjectsReportJson(request: ClientsProjectsReportRequest): Observable<ClientsProjectsReportResponse> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get<ClientsProjectsReportResponse>(`${this.apiUrl}/clients-projects/json`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath),
          GeneratedBy: currentUser ? (currentUser.username || currentUser.Username || 'System') : 'System',
          GeneratedByEmail: currentUser ? (currentUser.email || currentUser.Email || 'system@aisap.com') : 'system@aisap.com'
        } 
      })),
      catchError(error => {
        console.error('Error generating clients projects report JSON:', error);
        throw error;
      })
    );
  }

  generateClientsProjectsReportExcel(request: ClientsProjectsReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get(`${this.apiUrl}/clients-projects/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating clients projects report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Training Session Report
  generateTrainingSessionReport(request: TrainingSessionReportRequest): Observable<TrainingSessionReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<TrainingSessionReportResponse>(`${this.apiUrl}/training-sessions`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath)
        } 
      })),
      catchError(error => {
        console.error('Error generating training session report:', error);
        throw error;
      })
    );
  }

  generateTrainingSessionReportPdf(request: TrainingSessionReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/training-sessions/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating training session report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateTrainingSessionReportJson(request: TrainingSessionReportRequest): Observable<TrainingSessionReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<TrainingSessionReportResponse>(`${this.apiUrl}/training-sessions/json`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath)
        } 
      })),
      catchError(error => {
        console.error('Error generating training session report JSON:', error);
        throw error;
      })
    );
  }

  generateTrainingSessionReportExcel(request: TrainingSessionReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/training-sessions/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating training session report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Model Deployment Report
  generateModelDeploymentReport(request: ModelDeploymentReportRequest): Observable<ModelDeploymentReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get<ModelDeploymentReportResponse>(`${this.apiUrl}/model-deployments`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath),
          GeneratedBy: currentUser ? (currentUser.username || currentUser.Username || 'System') : 'System',
          GeneratedByEmail: currentUser ? (currentUser.email || currentUser.Email || 'system@aisap.com') : 'system@aisap.com'
        } 
      })),
      catchError(error => {
        console.error('Error generating model deployment report:', error);
        throw error;
      })
    );
  }

  generateModelDeploymentReportPdf(request: ModelDeploymentReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/model-deployments/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating model deployment report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateModelDeploymentReportJson(request: ModelDeploymentReportRequest): Observable<ModelDeploymentReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<ModelDeploymentReportResponse>(`${this.apiUrl}/model-deployments/json`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating model deployment report JSON:', error);
        throw error;
      })
    );
  }

  generateModelDeploymentReportExcel(request: ModelDeploymentReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/model-deployments/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating model deployment report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Dataset Transaction Report
  generateDatasetTransactionReport(request: DatasetTransactionReportRequest): Observable<DatasetTransactionReportResponse> {
    return this.getCurrentUserInfo$().pipe(
      switchMap(userInfo => {
        let params = new HttpParams();
        if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
        if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
        if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
        if (request.logoPath) params = params.set('logoPath', request.logoPath);

        // Ensure backend groups data by action for the on-screen view as well
        params = params.set('groupBy', 'action');

        if (userInfo) {
          params = params.set('currentUser', userInfo.username);
          params = params.set('currentUserEmail', userInfo.email);
          params = params.set('currentUserRole', userInfo.role);
          const generatedBy = `${userInfo.username} (${userInfo.email}) - ${userInfo.role}`.trim();
          params = params.set('generatedBy', generatedBy);
          params = params.set('GeneratedBy', generatedBy);
        }

        return this.http.get<DatasetTransactionReportResponse>(`${this.apiUrl}/dataset-transactions`, { params }).pipe(
          map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
          catchError(error => {
            console.error('Error generating dataset transaction report:', error);
            throw error;
          })
        );
      })
    );
  }

  generateDatasetTransactionReportPdf(request: DatasetTransactionReportRequest): Observable<Blob> {
    return this.getCurrentUserInfo$().pipe(
      switchMap(userInfo => {
        let params = new HttpParams();
        if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
        if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
        if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
        if (request.logoPath) params = params.set('logoPath', request.logoPath);
        
        // Request the backend to group by action if supported
        params = params.set('groupBy', 'action');

        if (userInfo) {
          params = params.set('currentUser', userInfo.username);
          params = params.set('currentUserEmail', userInfo.email);
          params = params.set('currentUserRole', userInfo.role);
          const generatedBy = `${userInfo.username} (${userInfo.email}) - ${userInfo.role}`.trim();
          params = params.set('generatedBy', generatedBy);
          params = params.set('GeneratedBy', generatedBy);
        }

        return this.http.get(`${this.apiUrl}/dataset-transactions/pdf`, { params, responseType: 'blob' }).pipe(
          catchError(error => {
            console.error('Error generating dataset transaction report PDF:', error);
            return of(new Blob());
          })
        );
      })
    );
  }

  generateDatasetTransactionReportJson(request: DatasetTransactionReportRequest): Observable<DatasetTransactionReportResponse> {
    return this.getCurrentUserInfo$().pipe(
      switchMap(userInfo => {
        let params = new HttpParams();
        if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
        if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
        if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
        if (request.logoPath) params = params.set('logoPath', request.logoPath);

        // Request grouping by action if supported
        params = params.set('groupBy', 'action');

        if (userInfo) {
          params = params.set('currentUser', userInfo.username);
          params = params.set('currentUserEmail', userInfo.email);
          params = params.set('currentUserRole', userInfo.role);
          const generatedBy = `${userInfo.username} (${userInfo.email}) - ${userInfo.role}`.trim();
          params = params.set('generatedBy', generatedBy);
          params = params.set('GeneratedBy', generatedBy);
        }

        return this.http.get<DatasetTransactionReportResponse>(`${this.apiUrl}/dataset-transactions/json`, { params }).pipe(
          map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
          catchError(error => {
            console.error('Error generating dataset transaction report JSON:', error);
            throw error;
          })
        );
      })
    );
  }

  generateDatasetTransactionReportExcel(request: DatasetTransactionReportRequest): Observable<Blob> {
    return this.getCurrentUserInfo$().pipe(
      switchMap(userInfo => {
        let params = new HttpParams();
        if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
        if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
        if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
        if (request.logoPath) params = params.set('logoPath', request.logoPath);

        // Request grouping by action if supported
        params = params.set('groupBy', 'action');

        if (userInfo) {
          params = params.set('currentUser', userInfo.username);
          params = params.set('currentUserEmail', userInfo.email);
          params = params.set('currentUserRole', userInfo.role);
          const generatedBy = `${userInfo.username} (${userInfo.email}) - ${userInfo.role}`.trim();
          params = params.set('generatedBy', generatedBy);
          params = params.set('GeneratedBy', generatedBy);
        }

        return this.http.get(`${this.apiUrl}/dataset-transactions/excel`, { params, responseType: 'blob' }).pipe(
          catchError(error => {
            console.error('Error generating dataset transaction report Excel:', error);
            return of(new Blob());
          })
        );
      })
    );
  }

  // Dataset Status Report
  generateDatasetStatusReport(request: DatasetStatusReportRequest): Observable<DatasetStatusReportResponse> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetStatusReportResponse>(`${this.apiUrl}/dataset-status`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating dataset status report:', error);
        throw error;
      })
    );
  }

  generateDatasetStatusReportPdf(request: DatasetStatusReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/dataset-status/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating dataset status report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateDatasetStatusReportJson(request: DatasetStatusReportRequest): Observable<DatasetStatusReportResponse> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetStatusReportResponse>(`${this.apiUrl}/dataset-status/json`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating dataset status report JSON:', error);
        throw error;
      })
    );
  }

  generateDatasetStatusReportExcel(request: DatasetStatusReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/dataset-status/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating dataset status report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Dataset Trends Report
  generateDatasetTrendsReport(request: DatasetTrendsReportRequest): Observable<DatasetTrendsReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.status) params = params.set('status', request.status);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetTrendsReportResponse>(`${this.apiUrl}/dataset-trends`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating dataset trends report:', error);
        throw error;
      })
    );
  }

  generateDatasetTrendsReportPdf(request: DatasetTrendsReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.status) params = params.set('status', request.status);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/dataset-trends/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating dataset trends report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateDatasetTrendsReportJson(request: DatasetTrendsReportRequest): Observable<DatasetTrendsReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.status) params = params.set('status', request.status);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetTrendsReportResponse>(`${this.apiUrl}/dataset-trends/json`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating dataset trends report JSON:', error);
        throw error;
      })
    );
  }

  generateDatasetTrendsReportExcel(request: DatasetTrendsReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.status) params = params.set('status', request.status);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/dataset-trends/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating dataset trends report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Model Training Summary Report
  generateModelTrainingSummaryReport(request: ModelTrainingSummaryReportRequest): Observable<ModelTrainingSummaryReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<ModelTrainingSummaryReportResponse>(`${this.apiUrl}/model-training-summary`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating model training summary report:', error);
        throw error;
      })
    );
  }

  generateModelTrainingSummaryReportPdf(request: ModelTrainingSummaryReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/model-training-summary/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating model training summary report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateModelTrainingSummaryReportJson(request: ModelTrainingSummaryReportRequest): Observable<ModelTrainingSummaryReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<ModelTrainingSummaryReportResponse>(`${this.apiUrl}/model-training-summary/json`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating model training summary report JSON:', error);
        throw error;
      })
    );
  }

  generateModelTrainingSummaryReportExcel(request: ModelTrainingSummaryReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/model-training-summary/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating model training summary report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Model Activity by Experiment Report
  generateModelActivityByExperimentReport(request: ModelActivityByExperimentReportRequest): Observable<ModelActivityByExperimentReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.modelName) params = params.set('modelName', request.modelName);
    if (request.userName) params = params.set('userName', request.userName);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get<ModelActivityByExperimentReportResponse>(`${this.apiUrl}/model-activity-by-experiment`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath),
          GeneratedBy: currentUser ? (currentUser.username || currentUser.Username || 'System') : 'System',
          GeneratedByEmail: currentUser ? (currentUser.email || currentUser.Email || 'system@aisap.com') : 'system@aisap.com'
        } 
      })),
      catchError(error => {
        console.error('Error generating model activity by experiment report:', error);
        throw error;
      })
    );
  }

  generateModelActivityByExperimentReportPdf(request: ModelActivityByExperimentReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.modelName) params = params.set('modelName', request.modelName);
    if (request.userName) params = params.set('userName', request.userName);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get(`${this.apiUrl}/model-activity-by-experiment/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating model activity by experiment report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateModelActivityByExperimentReportJson(request: ModelActivityByExperimentReportRequest): Observable<ModelActivityByExperimentReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.modelName) params = params.set('modelName', request.modelName);
    if (request.userName) params = params.set('userName', request.userName);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get<ModelActivityByExperimentReportResponse>(`${this.apiUrl}/model-activity-by-experiment/json`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath),
          GeneratedBy: currentUser ? (currentUser.username || currentUser.Username || 'System') : 'System',
          GeneratedByEmail: currentUser ? (currentUser.email || currentUser.Email || 'system@aisap.com') : 'system@aisap.com'
        } 
      })),
      catchError(error => {
        console.error('Error generating model activity by experiment report JSON:', error);
        throw error;
      })
    );
  }

  generateModelActivityByExperimentReportExcel(request: ModelActivityByExperimentReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.modelName) params = params.set('modelName', request.modelName);
    if (request.userName) params = params.set('userName', request.userName);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get(`${this.apiUrl}/model-activity-by-experiment/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating model activity by experiment report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Model Deployment Status Report methods
  generateModelDeploymentStatusReport(request: ModelDeploymentStatusReportRequest): Observable<ModelDeploymentStatusReportResponse> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get<ModelDeploymentStatusReportResponse>(`${this.apiUrl}/model-deployments`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath),
          GeneratedBy: currentUser ? (currentUser.username || currentUser.Username || 'System') : 'System',
          GeneratedByEmail: currentUser ? (currentUser.email || currentUser.Email || 'system@aisap.com') : 'system@aisap.com'
        } 
      })),
      catchError(error => {
        console.error('Error generating model deployment status report:', error);
        throw error;
      })
    );
  }

  generateModelDeploymentStatusReportPdf(request: ModelDeploymentStatusReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get(`${this.apiUrl}/model-deployments/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating model deployment status report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateModelDeploymentStatusReportJson(request: ModelDeploymentStatusReportRequest): Observable<ModelDeploymentStatusReportResponse> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get<ModelDeploymentStatusReportResponse>(`${this.apiUrl}/model-deployments/json`, { params }).pipe(
      map(response => ({ 
        ...response, 
        Metadata: { 
          ...response.Metadata, 
          LogoPath: this.getLogoPath(request.includeLogo, request.logoPath),
          GeneratedBy: currentUser ? (currentUser.username || currentUser.Username || 'System') : 'System',
          GeneratedByEmail: currentUser ? (currentUser.email || currentUser.Email || 'system@aisap.com') : 'system@aisap.com'
        } 
      })),
      catchError(error => {
        console.error('Error generating model deployment status report JSON:', error);
        throw error;
      })
    );
  }

  generateModelDeploymentStatusReportExcel(request: ModelDeploymentStatusReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    // Add current user information if available
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      params = params.set('currentUser', currentUser.username || currentUser.Username || '');
      params = params.set('currentUserEmail', currentUser.email || currentUser.Email || '');
      params = params.set('currentUserRole', currentUser.role || currentUser.Role || '');
    }

    return this.http.get(`${this.apiUrl}/model-deployments/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating model deployment status report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Helper method to download blob
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private getLogoPath(includeLogo: boolean | undefined, logoPath: string | undefined): string {
    if (includeLogo === undefined) {
      return '';
    }
    if (includeLogo) {
      return logoPath || '';
    }
    return '';
  }

  private createDefaultSummary(): ReportSummary {
    return {
      TotalRecords: 0,
      GeneratedAt: new Date(),
      GeneratedBy: 'System',
      GenerationTime: '0ms',
      AdditionalMetrics: {}
    };
  }

  private createDefaultMetadata(reportType: string, reportTitle: string): ReportMetadata {
    return {
      ReportTitle: reportTitle,
      ReportType: reportType,
      StartDate: new Date(),
      EndDate: new Date(),
      AppliedFilters: [],
      LogoPath: '',
      CompanyName: 'AISAP',
      GeneratedBy: 'System',
      IncludeLogo: false
    };
  }

  private getCurrentUserFromStorage(): any {
    const user = localStorage.getItem('currentUser');
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }

  private getCurrentUserInfo(): { username: string; email: string; role: string } | null {
    const svcUser: User | null = this.auth?.getCurrentUser ? this.auth.getCurrentUser() : null;
    const storeUser = this.getCurrentUserFromStorage();
    const user = svcUser || storeUser;
    if (!user) return null;
    const username = (user as any).username || (user as any).Username || '';
    const email = (user as any).email || (user as any).Email || '';
    const role = (user as any).role || (user as any).Role || '';
    if (!username && !email && !role) return null;
    return { username, email, role };
  }

  private getCurrentUserInfo$(): Observable<{ username: string; email: string; role: string } | null> {
    const info = this.getCurrentUserInfo();
    if (info) return of(info);
    // Fallback: ask backend for users and pick the first as a best-effort default
    return this.http.get<any[]>(`${environment.apiUrl}/api/User`).pipe(
      map(users => {
        if (!users || users.length === 0) return null;
        const u = users[0];
        return {
          username: u.Username || u.username || '',
          email: u.Email || u.email || '',
          role: u.Role || u.role || ''
        };
      }),
      catchError(() => of(null))
    );
  }
} 