import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  TransactionGroups: DatasetTransactionGroup[];
  Summary: ReportSummary;
  Metadata: ReportMetadata;
}

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

  constructor(private http: HttpClient) {}

  // Users Report
  generateUsersReport(request: UsersReportRequest): Observable<UsersReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<UsersReportResponse>(`${this.apiUrl}/users`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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

    return this.http.get<UsersReportResponse>(`${this.apiUrl}/users/json`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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

    return this.http.get<ClientsProjectsReportResponse>(`${this.apiUrl}/clients-projects`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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

    return this.http.get<ClientsProjectsReportResponse>(`${this.apiUrl}/clients-projects/json`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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

    return this.http.get<ModelDeploymentReportResponse>(`${this.apiUrl}/model-deployments`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetTransactionReportResponse>(`${this.apiUrl}/dataset-transactions`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating dataset transaction report:', error);
        throw error;
      })
    );
  }

  generateDatasetTransactionReportPdf(request: DatasetTransactionReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/dataset-transactions/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating dataset transaction report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateDatasetTransactionReportJson(request: DatasetTransactionReportRequest): Observable<DatasetTransactionReportResponse> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetTransactionReportResponse>(`${this.apiUrl}/dataset-transactions/json`, { params }).pipe(
      map(response => ({ ...response, Metadata: { ...response.Metadata, LogoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating dataset transaction report JSON:', error);
        throw error;
      })
    );
  }

  generateDatasetTransactionReportExcel(request: DatasetTransactionReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
    if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/dataset-transactions/excel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating dataset transaction report Excel:', error);
        return of(new Blob());
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
} 