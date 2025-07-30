import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UsersReportRequest {
  startDate?: Date;
  endDate?: Date;
  roleFilter?: string;
  isActive?: boolean;
  generatedBy?: string;
  includeLogo?: boolean;
  logoPath?: string;
  reportTitle?: string;
}

export interface UsersReportResponse {
  users: UserReportItem[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface UserReportItem {
  userId: number;
  username: string;
  email: string;
  role: string;
  lastLoginDate?: Date;
  projectCount: number;
  isActive: boolean;
}

export interface ClientsProjectsReportRequest {
  clientId?: number;
  projectActive?: boolean;
  generatedBy?: string;
  includeLogo?: boolean;
  logoPath?: string;
  reportTitle?: string;
}

export interface ClientsProjectsReportResponse {
  clients: ClientProjectReportItem[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface ClientProjectReportItem {
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projects: ProjectReportItem[];
  totalProjects: number;
  activeProjects: number;
}

export interface ProjectReportItem {
  projectId: number;
  projectName: string;
  objectives: string;
  technologies: string;
  createdDate: Date;
  estimatedTimeline: Date;
  isActive: boolean;
  teamMemberCount: number;
}

export interface TrainingSessionReportRequest {
  startDate?: Date;
  endDate?: Date;
  modelId?: number;
  statusFilter?: string;
  includeGraphs?: boolean;
  generatedBy?: string;
  includeLogo?: boolean;
  logoPath?: string;
  reportTitle?: string;
}

export interface TrainingSessionReportResponse {
  sessions: TrainingSessionReportItem[];
  trainingTrends: ChartDataPoint[];
  successRateData: ChartDataPoint[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface TrainingSessionReportItem {
  trainSessionId: number;
  modelId: number;
  modelName: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: string;
  learningRate: number;
  trainingConfig: string;
  metrics: string;
  errorMessage: string;
}

export interface ModelDeploymentReportRequest {
  startDate?: Date;
  endDate?: Date;
  environmentFilter?: string;
  statusFilter?: string;
  generatedBy?: string;
  includeLogo?: boolean;
  logoPath?: string;
  reportTitle?: string;
}

export interface ModelDeploymentReportResponse {
  deployments: ModelDeploymentReportItem[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface ModelDeploymentReportItem {
  deploymentId: number;
  appName: string;
  environment: string;
  version: string;
  status: string;
  dateSubmitted: Date;
  approvalTimestamp?: Date;
  requestedBy: string;
  approvedBy: string;
  endpoint: string;
}

export interface DatasetTransactionReportRequest {
  startDate?: Date;
  endDate?: Date;
  developerFilter?: string;
  datasetFilter?: string;
  actionFilter?: string;
  generatedBy?: string;
  includeLogo?: boolean;
  logoPath?: string;
  reportTitle?: string;
}

export interface DatasetTransactionReportResponse {
  transactionGroups: DatasetTransactionGroup[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface DatasetTransactionGroup {
  developerName: string;
  developerId: number;
  datasetActions: DatasetActionGroup[];
  totalActions: number;
  lastActionDate: Date;
}

export interface DatasetActionGroup {
  datasetName: string;
  datasetId: string;
  transactions: TransactionItem[];
  totalActions: number;
  lastActionDate: Date;
}

export interface TransactionItem {
  transactionId: string;
  action: string;
  details: string;
  timestamp: Date;
  fileName: string;
}

export interface DatasetStatusReportRequest {
  statusFilter?: string;
  fileTypeFilter?: string;
  generatedBy?: string;
  includeLogo?: boolean;
  logoPath?: string;
  reportTitle?: string;
}

export interface DatasetStatusReportResponse {
  datasets: DatasetStatusReportItem[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface DatasetStatusReportItem {
  datasetId: string;
  datasetName: string;
  description: string;
  fileType: string;
  version: string;
  createdAt: Date;
  uploadedAt: Date;
  validationStatus: string;
  fileCount: number;
  totalFileSize: number;
  logCount: number;
  lastActivity?: Date;
}

export interface DatasetTrendsReportRequest {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  fileTypeFilter?: string;
  developerFilter?: string;
  groupBy?: string;
  generatedBy?: string;
  includeLogo?: boolean;
  logoPath?: string;
  reportTitle?: string;
}

export interface DatasetTrendsReportResponse {
  trends: DatasetTrendItem[];
  uploadTrends: ChartDataPoint[];
  processingTrends: ChartDataPoint[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface DatasetTrendItem {
  period: string;
  uploadCount: number;
  processedCount: number;
  validatedCount: number;
  failedCount: number;
  totalFileSize: number;
  averageProcessingTime: number;
  groupKey: string;
  totalDatasets: number;
  successRate: number;
  fileTypes: string[];
}

export interface ModelTrainingSummaryReportRequest {
  startDate?: Date;
  endDate?: Date;
  modelTypeFilter?: string;
  statusFilter?: string;
  generatedBy?: string;
  includeLogo?: boolean;
  logoPath?: string;
  reportTitle?: string;
}

export interface ModelTrainingSummaryReportResponse {
  trainingGroups: ModelTrainingGroup[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface ModelTrainingGroup {
  modelType: string;
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  averageAccuracy: number;
  averageTrainingTime: number;
  subGroups: ModelTrainingSubGroup[];
  totals: ModelTrainingTotals;
}

export interface ModelTrainingSubGroup {
  modelName: string;
  sessionsCount: number;
  successfulCount: number;
  failedCount: number;
  averageAccuracy: number;
  averageTrainingTime: number;
  sessions: TrainingSessionItem[];
  subTotals: ModelTrainingTotals;
}

export interface TrainingSessionItem {
  sessionId: string;
  modelName: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  accuracy?: number;
  trainingTime?: number;
  errorMessage?: string;
}

export interface ModelTrainingTotals {
  totalSessions: number;
  totalSuccessful: number;
  totalFailed: number;
  overallAccuracy: number;
  totalTrainingTime: number;
  successRate: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}

export interface ReportSummary {
  totalRecords: number;
  generatedAt: Date;
  generatedBy: string;
  generationTime: string;
  additionalMetrics: { [key: string]: any };
}

export interface ReportMetadata {
  reportTitle: string;
  reportType: string;
  startDate: Date;
  endDate: Date;
  appliedFilters: string[];
  logoPath: string;
  companyName: string;
  generatedBy: string;
  includeLogo: boolean;
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
    if (request.roleFilter) params = params.set('roleFilter', request.roleFilter);
    if (request.isActive !== undefined) params = params.set('isActive', request.isActive.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<UsersReportResponse>(`${this.apiUrl}/GetUsersReport`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.roleFilter) params = params.set('roleFilter', request.roleFilter);
    if (request.isActive !== undefined) params = params.set('isActive', request.isActive.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetUsersReportPdf`, { params, responseType: 'blob' }).pipe(
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
    if (request.roleFilter) params = params.set('roleFilter', request.roleFilter);
    if (request.isActive !== undefined) params = params.set('isActive', request.isActive.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<UsersReportResponse>(`${this.apiUrl}/GetUsersReportJson`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.roleFilter) params = params.set('roleFilter', request.roleFilter);
    if (request.isActive !== undefined) params = params.set('isActive', request.isActive.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetUsersReportExcel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating users report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Clients and Projects Report
  generateClientsProjectsReport(request: ClientsProjectsReportRequest): Observable<ClientsProjectsReportResponse> {
    let params = new HttpParams();
    if (request.clientId) params = params.set('clientId', request.clientId.toString());
    if (request.projectActive !== undefined) params = params.set('projectActive', request.projectActive.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<ClientsProjectsReportResponse>(`${this.apiUrl}/GetClientsProjectsReport`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating clients projects report:', error);
        throw error;
      })
    );
  }

  generateClientsProjectsReportPdf(request: ClientsProjectsReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.clientId) params = params.set('clientId', request.clientId.toString());
    if (request.projectActive !== undefined) params = params.set('projectActive', request.projectActive.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetClientsProjectsReportPdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating clients projects report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateClientsProjectsReportJson(request: ClientsProjectsReportRequest): Observable<ClientsProjectsReportResponse> {
    let params = new HttpParams();
    if (request.clientId) params = params.set('clientId', request.clientId.toString());
    if (request.projectActive !== undefined) params = params.set('projectActive', request.projectActive.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<ClientsProjectsReportResponse>(`${this.apiUrl}/GetClientsProjectsReportJson`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating clients projects report JSON:', error);
        throw error;
      })
    );
  }

  generateClientsProjectsReportExcel(request: ClientsProjectsReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.clientId) params = params.set('clientId', request.clientId.toString());
    if (request.projectActive !== undefined) params = params.set('projectActive', request.projectActive.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetClientsProjectsReportExcel`, { params, responseType: 'blob' }).pipe(
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
    if (request.modelId) params = params.set('modelId', request.modelId.toString());
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeGraphs !== undefined) params = params.set('includeGraphs', request.includeGraphs.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<TrainingSessionReportResponse>(`${this.apiUrl}/GetTrainingSessionsReport`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.modelId) params = params.set('modelId', request.modelId.toString());
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeGraphs !== undefined) params = params.set('includeGraphs', request.includeGraphs.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetTrainingSessionsReportPdf`, { params, responseType: 'blob' }).pipe(
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
    if (request.modelId) params = params.set('modelId', request.modelId.toString());
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeGraphs !== undefined) params = params.set('includeGraphs', request.includeGraphs.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<TrainingSessionReportResponse>(`${this.apiUrl}/GetTrainingSessionsReportJson`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.modelId) params = params.set('modelId', request.modelId.toString());
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeGraphs !== undefined) params = params.set('includeGraphs', request.includeGraphs.toString());
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetTrainingSessionsReportExcel`, { params, responseType: 'blob' }).pipe(
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
    if (request.environmentFilter) params = params.set('environmentFilter', request.environmentFilter);
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<ModelDeploymentReportResponse>(`${this.apiUrl}/GetModelDeploymentsReport`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.environmentFilter) params = params.set('environmentFilter', request.environmentFilter);
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetModelDeploymentsReportPdf`, { params, responseType: 'blob' }).pipe(
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
    if (request.environmentFilter) params = params.set('environmentFilter', request.environmentFilter);
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<ModelDeploymentReportResponse>(`${this.apiUrl}/GetModelDeploymentsReportJson`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.environmentFilter) params = params.set('environmentFilter', request.environmentFilter);
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetModelDeploymentsReportExcel`, { params, responseType: 'blob' }).pipe(
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
    if (request.developerFilter) params = params.set('developerFilter', request.developerFilter);
    if (request.datasetFilter) params = params.set('datasetFilter', request.datasetFilter);
    if (request.actionFilter) params = params.set('actionFilter', request.actionFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetTransactionReportResponse>(`${this.apiUrl}/GetDatasetTransactionsReport`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.developerFilter) params = params.set('developerFilter', request.developerFilter);
    if (request.datasetFilter) params = params.set('datasetFilter', request.datasetFilter);
    if (request.actionFilter) params = params.set('actionFilter', request.actionFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetDatasetTransactionsReportPdf`, { params, responseType: 'blob' }).pipe(
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
    if (request.developerFilter) params = params.set('developerFilter', request.developerFilter);
    if (request.datasetFilter) params = params.set('datasetFilter', request.datasetFilter);
    if (request.actionFilter) params = params.set('actionFilter', request.actionFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetTransactionReportResponse>(`${this.apiUrl}/GetDatasetTransactionsReportJson`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.developerFilter) params = params.set('developerFilter', request.developerFilter);
    if (request.datasetFilter) params = params.set('datasetFilter', request.datasetFilter);
    if (request.actionFilter) params = params.set('actionFilter', request.actionFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetDatasetTransactionsReportExcel`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating dataset transaction report Excel:', error);
        return of(new Blob());
      })
    );
  }

  // Dataset Status Report
  generateDatasetStatusReport(request: DatasetStatusReportRequest): Observable<DatasetStatusReportResponse> {
    let params = new HttpParams();
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.fileTypeFilter) params = params.set('fileTypeFilter', request.fileTypeFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetStatusReportResponse>(`${this.apiUrl}/GetDatasetStatusReport`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating dataset status report:', error);
        throw error;
      })
    );
  }

  generateDatasetStatusReportPdf(request: DatasetStatusReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.fileTypeFilter) params = params.set('fileTypeFilter', request.fileTypeFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetDatasetStatusReportPdf`, { params, responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error generating dataset status report PDF:', error);
        return of(new Blob());
      })
    );
  }

  generateDatasetStatusReportJson(request: DatasetStatusReportRequest): Observable<DatasetStatusReportResponse> {
    let params = new HttpParams();
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.fileTypeFilter) params = params.set('fileTypeFilter', request.fileTypeFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetStatusReportResponse>(`${this.apiUrl}/GetDatasetStatusReportJson`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
      catchError(error => {
        console.error('Error generating dataset status report JSON:', error);
        throw error;
      })
    );
  }

  generateDatasetStatusReportExcel(request: DatasetStatusReportRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.fileTypeFilter) params = params.set('fileTypeFilter', request.fileTypeFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetDatasetStatusReportExcel`, { params, responseType: 'blob' }).pipe(
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
    if (request.fileTypeFilter) params = params.set('fileTypeFilter', request.fileTypeFilter);
    if (request.developerFilter) params = params.set('developerFilter', request.developerFilter);
    if (request.groupBy) params = params.set('groupBy', request.groupBy);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetTrendsReportResponse>(`${this.apiUrl}/GetDatasetTrendsReport`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.fileTypeFilter) params = params.set('fileTypeFilter', request.fileTypeFilter);
    if (request.developerFilter) params = params.set('developerFilter', request.developerFilter);
    if (request.groupBy) params = params.set('groupBy', request.groupBy);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetDatasetTrendsReportPdf`, { params, responseType: 'blob' }).pipe(
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
    if (request.fileTypeFilter) params = params.set('fileTypeFilter', request.fileTypeFilter);
    if (request.developerFilter) params = params.set('developerFilter', request.developerFilter);
    if (request.groupBy) params = params.set('groupBy', request.groupBy);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<DatasetTrendsReportResponse>(`${this.apiUrl}/GetDatasetTrendsReportJson`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.fileTypeFilter) params = params.set('fileTypeFilter', request.fileTypeFilter);
    if (request.developerFilter) params = params.set('developerFilter', request.developerFilter);
    if (request.groupBy) params = params.set('groupBy', request.groupBy);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetDatasetTrendsReportExcel`, { params, responseType: 'blob' }).pipe(
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
    if (request.modelTypeFilter) params = params.set('modelTypeFilter', request.modelTypeFilter);
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<ModelTrainingSummaryReportResponse>(`${this.apiUrl}/GetModelTrainingSummaryReport`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.modelTypeFilter) params = params.set('modelTypeFilter', request.modelTypeFilter);
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetModelTrainingSummaryReportPdf`, { params, responseType: 'blob' }).pipe(
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
    if (request.modelTypeFilter) params = params.set('modelTypeFilter', request.modelTypeFilter);
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get<ModelTrainingSummaryReportResponse>(`${this.apiUrl}/GetModelTrainingSummaryReportJson`, { params }).pipe(
      map(response => ({ ...response, metadata: { ...response.metadata, logoPath: this.getLogoPath(request.includeLogo, request.logoPath) } })),
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
    if (request.modelTypeFilter) params = params.set('modelTypeFilter', request.modelTypeFilter);
    if (request.statusFilter) params = params.set('statusFilter', request.statusFilter);
    if (request.includeLogo !== undefined) params = params.set('includeLogo', request.includeLogo.toString());
    if (request.logoPath) params = params.set('logoPath', request.logoPath);

    return this.http.get(`${this.apiUrl}/GetModelTrainingSummaryReportExcel`, { params, responseType: 'blob' }).pipe(
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
      return ''; // Default to empty if includeLogo is not provided
    }
    if (includeLogo) {
      return logoPath || ''; // Use provided logoPath if includeLogo is true
    }
    return ''; // Return empty if includeLogo is false
  }

  private createDefaultSummary(): ReportSummary {
    return {
      totalRecords: 0,
      generatedAt: new Date(),
      generatedBy: 'System',
      generationTime: '0ms',
      additionalMetrics: {}
    };
  }

  private createDefaultMetadata(reportType: string, reportTitle: string): ReportMetadata {
    return {
      reportTitle,
      reportType,
      startDate: new Date(),
      endDate: new Date(),
      appliedFilters: [],
      logoPath: '',
      companyName: 'AISAP',
      generatedBy: 'System',
      includeLogo: false
    };
  }
} 