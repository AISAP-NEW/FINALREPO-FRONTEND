import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { 
  ReportService, 
  UsersReportRequest, 
  UsersReportResponse,
  ClientsProjectsReportRequest,
  ClientsProjectsReportResponse,
  TrainingSessionReportRequest,
  TrainingSessionReportResponse,
  ModelDeploymentReportRequest,
  ModelDeploymentReportResponse,
  DatasetTransactionReportRequest,
  DatasetTransactionReportResponse,
  DatasetStatusReportRequest,
  DatasetStatusReportResponse,
  DatasetTrendsReportRequest,
  DatasetTrendsReportResponse,
  ModelTrainingSummaryReportRequest,
  ModelTrainingSummaryReportResponse,
  ModelActivityByExperimentReportRequest,
  ModelActivityByExperimentReportResponse,
  ModelDeploymentStatusReportRequest,
  ModelDeploymentStatusReportResponse,
  ChartDataPoint
} from '../../services/report.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(...registerables);

@Pipe({
  name: 'filterByCategory',
  standalone: true
})
export class FilterByCategoryPipe implements PipeTransform {
  transform(reportTypes: any[], category: string): any[] {
    return reportTypes.filter(report => report.category === category);
  }
}

export interface ReportType {
  id: ReportTypeId;
  name: string;
  description: string;
  icon: string;
  category: 'simple' | 'transactional' | 'management' | 'adjustable';
}

type ReportTypeId = 'users' | 'clients-projects' | 'training-sessions' | 'model-deployments' | 'dataset-transactions' | 'dataset-status' | 'dataset-trends' | 'model-activity-experiment' | 'model-deployment-status';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, FilterByCategoryPipe]
})
export class ReportsComponent implements OnInit, AfterViewInit {
  @ViewChild('trendsChart') trendsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('successRateChart') successRateChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('processingChart') processingChart!: ElementRef<HTMLCanvasElement>;

  // Add Object for template access
  Object = Object;

  // Report types configuration
  reportTypes: ReportType[] = [
    {
      id: 'users' as ReportTypeId,
      name: 'Registered Users Report',
      description: 'Simple list report of all registered users with their details',
      icon: 'people-outline',
      category: 'simple'
    },
    {
      id: 'clients-projects' as ReportTypeId,
      name: 'Clients and Projects Report',
      description: 'Simple list report of clients and their associated projects',
      icon: 'business-outline',
      category: 'simple'
    },
    {
      id: 'training-sessions' as ReportTypeId,
      name: 'Model Training Session Report',
      description: 'Management report with graphs showing training trends and success rates',
      icon: 'trending-up-outline',
      category: 'management'
    },
    {
      id: 'model-deployments' as ReportTypeId,
      name: 'Model Deployment Report',
      description: 'Simple list report of model deployments and their status',
      icon: 'cloud-upload-outline',
      category: 'simple'
    },
    {
      id: 'dataset-transactions' as ReportTypeId,
      name: 'Dataset Transaction Summary Report',
      description: 'Transactional report with control breaks by developer and dataset',
      icon: 'analytics-outline',
      category: 'transactional'
    },
    {
      id: 'dataset-status' as ReportTypeId,
      name: 'Dataset Status Report',
      description: 'Simple list report of dataset statuses and validation results',
      icon: 'checkmark-circle-outline',
      category: 'simple'
    },
    {
      id: 'dataset-trends' as ReportTypeId,
      name: 'Dataset Trends Report',
      description: 'Adjustable criteria report with trend analysis and filtering options',
      icon: 'bar-chart-outline',
      category: 'adjustable'
    },
    {
      id: 'model-activity-experiment' as ReportTypeId,
      name: 'Model Activity by Experiment Report',
      description: 'Transactional report with control breaks by experiment status showing model training activities',
      icon: 'flask-outline',
      category: 'transactional'
    },
    {
      id: 'model-deployment-status' as ReportTypeId,
      name: 'Model Deployment Status Report',
      description: 'Transactional report with control breaks by deployment status showing deployed models and their environments',
      icon: 'server-outline',
      category: 'transactional'
    }
  ];

  // Current state
  selectedReportType: ReportTypeId = 'users';
  currentReportData: any = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  // Report data
  usersReport: UsersReportResponse | null = null;
  clientsProjectsReport: ClientsProjectsReportResponse | null = null;
  trainingSessionReport: TrainingSessionReportResponse | null = null;
  modelDeploymentReport: ModelDeploymentReportResponse | null = null;
  datasetTransactionReport: DatasetTransactionReportResponse | null = null;
  datasetStatusReport: DatasetStatusReportResponse | null = null;
  datasetTrendsReport: DatasetTrendsReportResponse | null = null;
  modelTrainingSummaryReport: ModelTrainingSummaryReportResponse | null = null;
  modelActivityExperimentReport: ModelActivityByExperimentReportResponse | null = null;
  modelDeploymentStatusReport: ModelDeploymentStatusReportResponse | null = null;

  // Filter states for adjustable reports
  trendsFilters = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    status: '' as string
  };

  // Custom date selector properties
  customStartDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  };

  customEndDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  };

  constructor(
    private reportService: ReportService, 
    private http: HttpClient,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    // Initialize custom date values
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = new Date();
    
    this.customStartDate = {
      year: defaultStartDate.getFullYear(),
      month: defaultStartDate.getMonth() + 1,
      day: defaultStartDate.getDate()
    };
    
    this.customEndDate = {
      year: defaultEndDate.getFullYear(),
      month: defaultEndDate.getMonth() + 1,
      day: defaultEndDate.getDate()
    };
    
    // Test API connectivity first
    console.log('Testing API connectivity...');
    try {
      // Test the health endpoint first
      await this.testApiHealth();
      
      // Check for query parameter to auto-load specific report
      this.route.queryParams.subscribe(params => {
        const reportType = params['type'];
        if (reportType) {
          console.log('Auto-loading report type from query params:', reportType);
          this.loadReport(reportType as ReportTypeId);
        } else {
          // Set default report if no query parameter
          this.selectedReportType = 'users';
          this.loadReport('users');
        }
      });
    } catch (error) {
      console.error('Failed to load initial report:', error);
      this.errorMessage = 'Unable to connect to the backend API. Please check if the server is running.';
    }
  }

  async testApiHealth() {
    try {
      const response = await firstValueFrom(this.http.get(`${environment.apiUrl}/api/Report/health`));
      console.log('API Health Check Response:', response);
      return response;
    } catch (error) {
      console.error('API Health Check Failed:', error);
      throw new Error('Backend API is not accessible. Please ensure the server is running.');
    }
  }

  ngAfterViewInit() {
    // Charts will be created after data is loaded
  }

  async loadReport(reportType: ReportTypeId) {
    console.log('Loading report type:', reportType);
    console.log('Previous selectedReportType:', this.selectedReportType);
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedReportType = reportType;
    console.log('New selectedReportType:', this.selectedReportType);

    try {
      switch (reportType) {
        case 'users':
          await this.loadUsersReport();
          break;
        case 'clients-projects':
          await this.loadClientsProjectsReport();
          break;
        case 'training-sessions':
          await this.loadTrainingSessionReport();
          break;
        case 'model-deployments':
          await this.loadModelDeploymentReport();
          break;
        case 'dataset-transactions':
          await this.loadDatasetTransactionReport();
          break;
        case 'dataset-status':
          await this.loadDatasetStatusReport();
          break;
        case 'dataset-trends':
          await this.loadDatasetTrendsReport();
          break;
        case 'model-activity-experiment':
          await this.loadModelActivityExperimentReport();
          break;
        case 'model-deployment-status':
          await this.loadModelDeploymentStatusReport();
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
      console.log('Report loaded successfully:', reportType);
    } catch (error: any) {
      console.error('Error loading report:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url
      });
      
      // Provide more specific error messages
      if (error?.status === 0) {
        this.errorMessage = 'Unable to connect to the server. Please check if the backend is running.';
      } else if (error?.status === 401) {
        this.errorMessage = 'Authentication required. Please log in again.';
      } else if (error?.status === 403) {
        this.errorMessage = 'You do not have permission to access this report.';
      } else if (error?.status === 404) {
        this.errorMessage = 'Report endpoint not found. Please check the API configuration.';
      } else if (error?.status >= 500) {
        this.errorMessage = 'Server error occurred. Please try again later.';
      } else {
        this.errorMessage = `Failed to load report: ${error?.message || error?.statusText || 'Unknown error'}`;
      }
    } finally {
      this.isLoading = false;
      console.log('Loading finished. isLoading:', this.isLoading);
    }
  }

  async loadUsersReport() {
    const request: UsersReportRequest = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      includeLogo: true
    };

    console.log('Making API call to load users report with request:', request);

    try {
      const response = await firstValueFrom(this.reportService.generateUsersReport(request));
      console.log('Users Report Response:', response);
      
      this.usersReport = response;
      this.currentReportData = response;
      
      this.errorMessage = '';
      
      console.log('Users report loaded successfully. usersReport.Users:', this.usersReport?.Users);
      console.log('Current report data:', this.currentReportData);
    } catch (error: any) {
      console.error('Error loading users report:', error);
      this.errorMessage = `Failed to load users report: ${error?.message || error?.statusText || 'Unknown error'}`;
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url
      });
      throw error;
    }
  }

  async loadClientsProjectsReport() {
    const request: ClientsProjectsReportRequest = {
      includeLogo: true
    };

    try {
      const response = await firstValueFrom(this.reportService.generateClientsProjectsReport(request));
      console.log('Clients Projects Report Response:', response);
      this.clientsProjectsReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
    } catch (error: any) {
      console.error('Error loading clients projects report:', error);
      this.errorMessage = `Failed to load clients projects report: ${error?.message || error?.statusText || 'Unknown error'}`;
      throw error;
    }
  }

  async loadTrainingSessionReport() {
    const request: TrainingSessionReportRequest = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      includeLogo: true
    };

    try {
      const response = await firstValueFrom(this.reportService.generateTrainingSessionReport(request));
      console.log('Training Session Report Response:', response);
      this.trainingSessionReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
      
      // Create charts after data is loaded with a small delay to ensure DOM is ready
      setTimeout(() => {
        this.createTrainingTrendsChart();
        this.createSuccessRateChart();
      }, 100);
    } catch (error: any) {
      console.error('Error loading training session report:', error);
      this.errorMessage = `Failed to load training session report: ${error?.message || error?.statusText || 'Unknown error'}`;
      throw error;
    }
  }

  async loadModelDeploymentReport() {
    const request: ModelDeploymentReportRequest = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      includeLogo: true
    };

    try {
      const response = await firstValueFrom(this.reportService.generateModelDeploymentReport(request));
      console.log('Model Deployment Report Response:', response);
      this.modelDeploymentReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
    } catch (error: any) {
      console.error('Error loading model deployment report:', error);
      this.errorMessage = `Failed to load model deployment report: ${error?.message || error?.statusText || 'Unknown error'}`;
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url
      });
      throw error;
    }
  }

  async loadDatasetTransactionReport() {
    const request: DatasetTransactionReportRequest = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      includeLogo: true,
      logoPath: "wwwroot/images/logo.png"
    };

    console.log('Making API call to load dataset transaction report with request:', request);

    try {
      const response = await firstValueFrom(this.reportService.generateDatasetTransactionReport(request));
      console.log('Dataset Transaction Report Response:', response);
      this.datasetTransactionReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
      
      console.log('Dataset transaction report loaded successfully. DatasetGroups:', this.datasetTransactionReport?.DatasetGroups);
      console.log('TransactionGroups (old format):', this.datasetTransactionReport?.TransactionGroups);
      console.log('Full response structure:', Object.keys(this.datasetTransactionReport || {}));
      console.log('Current report data:', this.currentReportData);
    } catch (error: any) {
      console.error('Error loading dataset transaction report:', error);
      this.errorMessage = `Failed to load dataset transaction report: ${error?.message || error?.statusText || 'Unknown error'}`;
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url
      });
      throw error;
    }
  }

  async loadDatasetStatusReport() {
    const request: DatasetStatusReportRequest = {
      includeLogo: true
    };

    console.log('Making API call to load dataset status report with request:', request);

    try {
      const response = await firstValueFrom(this.reportService.generateDatasetStatusReport(request));
      console.log('Dataset Status Report Response:', response);
      this.datasetStatusReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
      
      console.log('Dataset status report loaded successfully. datasets:', this.datasetStatusReport?.Datasets);
      console.log('Current report data:', this.currentReportData);
    } catch (error: any) {
      console.error('Error loading dataset status report:', error);
      this.errorMessage = `Failed to load dataset status report: ${error?.message || error?.statusText || 'Unknown error'}`;
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url
      });
      throw error;
    }
  }

  async loadDatasetTrendsReport() {
    // Validate and format dates
    const startDate = this.trendsFilters.startDate ? new Date(this.trendsFilters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = this.trendsFilters.endDate ? new Date(this.trendsFilters.endDate) : new Date();
    
    // Ensure end date is not before start date
    if (endDate < startDate) {
      this.errorMessage = 'End date cannot be before start date';
      return;
    }

    const request: DatasetTrendsReportRequest = {
      startDate: startDate,
      endDate: endDate,
      status: this.trendsFilters.status || undefined,
      includeLogo: true
    };

    console.log('Making API call to load dataset trends report with request:', request);
    console.log('Filter values:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: this.trendsFilters.status
    });

    try {
      const response = await firstValueFrom(this.reportService.generateDatasetTrendsReport(request));
      console.log('Dataset Trends Report Response:', response);
      this.datasetTrendsReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
      
      console.log('Dataset trends report loaded successfully. trends:', this.datasetTrendsReport?.Trends);
      console.log('Upload trends:', this.datasetTrendsReport?.UploadTrends);
      console.log('Processing trends:', this.datasetTrendsReport?.ProcessingTrends);
      
      // Create charts after a short delay to ensure DOM is ready
      setTimeout(() => {
        console.log('Creating charts with data:', {
          uploadTrends: response.UploadTrends,
          processingTrends: response.ProcessingTrends
        });
        
        // Always create charts, even if no data
        this.createDatasetTrendsChart(response.UploadTrends || []);
        this.createDatasetProcessingChart(response.ProcessingTrends || []);
      }, 100);
    } catch (error: any) {
      console.error('Error loading dataset trends report:', error);
      this.errorMessage = `Failed to load dataset trends report: ${error?.message || error?.statusText || 'Unknown error'}`;
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url
      });
      throw error;
    }
  }

  async loadModelActivityExperimentReport() {
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user:', currentUser);
    
    const request: ModelActivityByExperimentReportRequest = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      includeLogo: true
    };

    console.log('Making API call to load model activity experiment report with request:', request);

    try {
      const response = await firstValueFrom(this.reportService.generateModelActivityByExperimentReport(request));
      console.log('Model Activity Experiment Report Response:', response);
      
      this.modelActivityExperimentReport = response;
      this.currentReportData = response;
      
      this.errorMessage = '';
      
      console.log('Model activity experiment report loaded successfully.');
      console.log('modelActivityExperimentReport:', this.modelActivityExperimentReport);
      console.log('modelActivityExperimentReport.ExperimentGroups:', this.modelActivityExperimentReport?.ExperimentGroups);
      console.log('modelActivityExperimentReport.ExperimentGroups?.length:', this.modelActivityExperimentReport?.ExperimentGroups?.length);
      console.log('Current report data:', this.currentReportData);
      console.log('selectedReportType:', this.selectedReportType);
      console.log('isModelActivityExperimentReport():', this.isModelActivityExperimentReport());
      console.log('modelActivityExperimentReport exists:', !!this.modelActivityExperimentReport);
      
      // Force change detection
      setTimeout(() => {
        console.log('After timeout - modelActivityExperimentReport:', this.modelActivityExperimentReport);
        console.log('After timeout - selectedReportType:', this.selectedReportType);
      }, 100);
      
    } catch (error: any) {
      console.error('Error loading model activity experiment report:', error);
      this.errorMessage = `Failed to load model activity experiment report: ${error?.message || error?.statusText || 'Unknown error'}`;
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url
      });
      throw error;
    }
  }

  async loadModelDeploymentStatusReport() {
    const request: ModelDeploymentStatusReportRequest = {
      includeLogo: true
    };

    console.log('Making API call to load model deployment status report with request:', request);

    try {
      const response = await firstValueFrom(this.reportService.generateModelDeploymentStatusReport(request));
      console.log('Model Deployment Status Report Response:', response);
      
      this.modelDeploymentStatusReport = response;
      this.currentReportData = response;
      
      this.errorMessage = '';
      
      console.log('Model deployment status report loaded successfully. DeploymentGroups:', this.modelDeploymentStatusReport?.DeploymentGroups);
      console.log('Current report data:', this.currentReportData);
    } catch (error: any) {
      console.error('Error loading model deployment status report:', error);
      this.errorMessage = `Failed to load model deployment status report: ${error?.message || error?.statusText || 'Unknown error'}`;
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url
      });
      throw error;
    }
  }

  // Export functions
  async exportToPdf() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      let blob: Blob;
      let filename: string;

      switch (this.selectedReportType) {
        case 'users':
          const usersRequest: UsersReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateUsersReportPdf(usersRequest));
          filename = 'users-report.pdf';
          break;
        case 'clients-projects':
          const clientsRequest: ClientsProjectsReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateClientsProjectsReportPdf(clientsRequest));
          filename = 'clients-projects-report.pdf';
          break;
        case 'training-sessions':
          const trainingRequest: TrainingSessionReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateTrainingSessionReportPdf(trainingRequest));
          filename = 'training-sessions-report.pdf';
          break;
        case 'model-deployments':
          const deploymentRequest: ModelDeploymentReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateModelDeploymentReportPdf(deploymentRequest));
          filename = 'model-deployments-report.pdf';
          break;
        case 'dataset-transactions':
          const transactionRequest: DatasetTransactionReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateDatasetTransactionReportPdf(transactionRequest));
          filename = 'dataset-transactions-report.pdf';
          break;
        case 'dataset-status':
          const statusRequest: DatasetStatusReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateDatasetStatusReportPdf(statusRequest));
          filename = 'dataset-status-report.pdf';
          break;
        case 'dataset-trends':
          const trendsRequest: DatasetTrendsReportRequest = {
            startDate: this.trendsFilters.startDate,
            endDate: this.trendsFilters.endDate,
            status: this.trendsFilters.status || undefined,
            includeLogo: true
          };
          blob = await firstValueFrom(this.reportService.generateDatasetTrendsReportPdf(trendsRequest));
          filename = 'dataset-trends-report.pdf';
          break;
        case 'model-activity-experiment':
          const experimentRequest: ModelActivityByExperimentReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateModelActivityByExperimentReportPdf(experimentRequest));
          filename = 'model-activity-experiment-report.pdf';
          break;
        case 'model-deployment-status':
          const deploymentStatusRequest: ModelDeploymentStatusReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateModelDeploymentStatusReportPdf(deploymentStatusRequest));
          filename = 'model-deployment-status-report.pdf';
          break;
        default:
          throw new Error('Unknown report type');
      }

      if (blob && blob.size > 0) {
        this.reportService.downloadBlob(blob, filename);
      } else {
        throw new Error('Generated PDF is empty or invalid');
      }
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      if (error?.status === 0) {
        this.errorMessage = 'Unable to connect to the server. Please check if the backend is running.';
      } else if (error?.status === 401) {
        this.errorMessage = 'Authentication required. Please log in again.';
      } else if (error?.status === 403) {
        this.errorMessage = 'You do not have permission to export this report.';
      } else if (error?.status === 404) {
        this.errorMessage = 'Export endpoint not found. Please check the API configuration.';
      } else if (error?.status >= 500) {
        this.errorMessage = 'Server error occurred. Please try again later.';
      } else {
        this.errorMessage = `Failed to export PDF: ${error?.message || error?.statusText || 'Unknown error'}`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  async exportToJson() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      let data: any;
      let filename: string;

      switch (this.selectedReportType) {
        case 'users':
          const usersRequest: UsersReportRequest = { includeLogo: true };
          data = await firstValueFrom(this.reportService.generateUsersReportJson(usersRequest));
          filename = 'users-report.json';
          break;
        case 'clients-projects':
          const clientsRequest: ClientsProjectsReportRequest = { includeLogo: true };
          data = await firstValueFrom(this.reportService.generateClientsProjectsReportJson(clientsRequest));
          filename = 'clients-projects-report.json';
          break;
        case 'training-sessions':
          const trainingRequest: TrainingSessionReportRequest = { includeLogo: true };
          data = await firstValueFrom(this.reportService.generateTrainingSessionReportJson(trainingRequest));
          filename = 'training-sessions-report.json';
          break;
        case 'model-deployments':
          const deploymentRequest: ModelDeploymentReportRequest = { includeLogo: true };
          data = await firstValueFrom(this.reportService.generateModelDeploymentReportJson(deploymentRequest));
          filename = 'model-deployments-report.json';
          break;
        case 'dataset-transactions':
          const transactionRequest: DatasetTransactionReportRequest = { includeLogo: true };
          data = await firstValueFrom(this.reportService.generateDatasetTransactionReportJson(transactionRequest));
          filename = 'dataset-transactions-report.json';
          break;
        case 'dataset-status':
          const statusRequest: DatasetStatusReportRequest = { includeLogo: true };
          data = await firstValueFrom(this.reportService.generateDatasetStatusReportJson(statusRequest));
          filename = 'dataset-status-report.json';
          break;
        case 'dataset-trends':
          const trendsRequest: DatasetTrendsReportRequest = {
            startDate: this.trendsFilters.startDate,
            endDate: this.trendsFilters.endDate,
            status: this.trendsFilters.status || undefined,
            includeLogo: true
          };
          data = await firstValueFrom(this.reportService.generateDatasetTrendsReportJson(trendsRequest));
          filename = 'dataset-trends-report.json';
          break;
        case 'model-activity-experiment':
          const experimentRequest: ModelActivityByExperimentReportRequest = { includeLogo: true };
          data = await firstValueFrom(this.reportService.generateModelActivityByExperimentReportJson(experimentRequest));
          filename = 'model-activity-experiment-report.json';
          break;
        case 'model-deployment-status':
          const deploymentStatusRequest: ModelDeploymentStatusReportRequest = { includeLogo: true };
          data = await firstValueFrom(this.reportService.generateModelDeploymentStatusReportJson(deploymentStatusRequest));
          filename = 'model-deployment-status-report.json';
          break;
        default:
          throw new Error('Unknown report type');
      }

      if (data) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        this.reportService.downloadBlob(blob, filename);
      } else {
        throw new Error('Generated JSON data is empty or invalid');
      }
    } catch (error: any) {
      console.error('Error exporting to JSON:', error);
      if (error?.status === 0) {
        this.errorMessage = 'Unable to connect to the server. Please check if the backend is running.';
      } else if (error?.status === 401) {
        this.errorMessage = 'Authentication required. Please log in again.';
      } else if (error?.status === 403) {
        this.errorMessage = 'You do not have permission to export this report.';
      } else if (error?.status === 404) {
        this.errorMessage = 'Export endpoint not found. Please check the API configuration.';
      } else if (error?.status >= 500) {
        this.errorMessage = 'Server error occurred. Please try again later.';
      } else {
        this.errorMessage = `Failed to export JSON: ${error?.message || error?.statusText || 'Unknown error'}`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  async exportToExcel() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      let blob: Blob;
      let filename: string;

      switch (this.selectedReportType) {
        case 'users':
          const usersRequest: UsersReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateUsersReportExcel(usersRequest));
          filename = 'users-report.xlsx';
          break;
        case 'clients-projects':
          const clientsRequest: ClientsProjectsReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateClientsProjectsReportExcel(clientsRequest));
          filename = 'clients-projects-report.xlsx';
          break;
        case 'training-sessions':
          const trainingRequest: TrainingSessionReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateTrainingSessionReportExcel(trainingRequest));
          filename = 'training-sessions-report.xlsx';
          break;
        case 'model-deployments':
          const deploymentRequest: ModelDeploymentReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateModelDeploymentReportExcel(deploymentRequest));
          filename = 'model-deployments-report.xlsx';
          break;
        case 'dataset-transactions':
          const transactionRequest: DatasetTransactionReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateDatasetTransactionReportExcel(transactionRequest));
          filename = 'dataset-transactions-report.xlsx';
          break;
        case 'dataset-status':
          const statusRequest: DatasetStatusReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateDatasetStatusReportExcel(statusRequest));
          filename = 'dataset-status-report.xlsx';
          break;
        case 'dataset-trends':
          const trendsRequest: DatasetTrendsReportRequest = {
            startDate: this.trendsFilters.startDate,
            endDate: this.trendsFilters.endDate,
            status: this.trendsFilters.status || undefined,
            includeLogo: true
          };
          blob = await firstValueFrom(this.reportService.generateDatasetTrendsReportExcel(trendsRequest));
          filename = 'dataset-trends-report.xlsx';
          break;
        case 'model-activity-experiment':
          const experimentRequest: ModelActivityByExperimentReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateModelActivityByExperimentReportExcel(experimentRequest));
          filename = 'model-activity-experiment-report.xlsx';
          break;
        case 'model-deployment-status':
          const deploymentStatusRequest: ModelDeploymentStatusReportRequest = { includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateModelDeploymentStatusReportExcel(deploymentStatusRequest));
          filename = 'model-deployment-status-report.xlsx';
          break;
        default:
          throw new Error('Unknown report type');
      }

      if (blob && blob.size > 0) {
        this.reportService.downloadBlob(blob, filename);
      } else {
        throw new Error('Generated Excel file is empty or invalid');
      }
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      if (error?.status === 0) {
        this.errorMessage = 'Unable to connect to the server. Please check if the backend is running.';
      } else if (error?.status === 401) {
        this.errorMessage = 'Authentication required. Please log in again.';
      } else if (error?.status === 403) {
        this.errorMessage = 'You do not have permission to export this report.';
      } else if (error?.status === 404) {
        this.errorMessage = 'Export endpoint not found. Please check the API configuration.';
      } else if (error?.status >= 500) {
        this.errorMessage = 'Server error occurred. Please try again later.';
      } else {
        this.errorMessage = `Failed to export Excel: ${error?.message || error?.statusText || 'Unknown error'}`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Chart creation methods
  createTrainingTrendsChart() {
    if (!this.trendsChart?.nativeElement) return;

    const canvas = this.trendsChart.nativeElement;
    
    // Destroy existing chart
    Chart.getChart(canvas)?.destroy();

    if (!this.trainingSessionReport?.TrainingTrends || this.trainingSessionReport.TrainingTrends.length === 0) {
      this.createFallbackChart(canvas, 'No Training Trends Data Available');
      return;
    }

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.trainingSessionReport.TrainingTrends.map(point => point.Label),
        datasets: [{
          label: 'Training Sessions',
          data: this.trainingSessionReport.TrainingTrends.map(point => point.Value),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Training Sessions Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createSuccessRateChart() {
    if (!this.successRateChart?.nativeElement) return;

    const canvas = this.successRateChart.nativeElement;
    
    // Destroy existing chart
    Chart.getChart(canvas)?.destroy();

    if (!this.trainingSessionReport?.SuccessRateData || this.trainingSessionReport.SuccessRateData.length === 0) {
      this.createFallbackChart(canvas, 'No Success Rate Data Available');
      return;
    }

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.trainingSessionReport.SuccessRateData.map(point => point.Label),
        datasets: [{
          label: 'Success Rate (%)',
          data: this.trainingSessionReport.SuccessRateData.map(point => point.Value),
          backgroundColor: '#28a745',
          borderColor: '#28a745',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Training Success Rate'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  createDatasetTrendsChart(chartData: ChartDataPoint[]) {
    const canvas = this.trendsChart.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context for trends chart');
      return;
    }

    // Destroy existing chart
    Chart.getChart(canvas)?.destroy();

    if (!chartData || chartData.length === 0) {
      this.createFallbackChart(canvas, 'No Upload Trends Data Available');
      return;
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: chartData.map(point => point.Label),
        datasets: [{
          label: 'Upload Count',
          data: chartData.map(point => point.Value),
          borderColor: '#0066cc',
          backgroundColor: 'rgba(0, 102, 204, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0066cc',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#0056b3',
          pointHoverBorderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Dataset Upload Trends',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#0066cc',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return `Uploads: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time Period',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Number of Uploads',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          point: {
            hoverRadius: 8
          }
        }
      }
    };

    new Chart(ctx, config);
  }

  createDatasetProcessingChart(chartData: ChartDataPoint[]) {
    const canvas = this.processingChart.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context for processing chart');
      return;
    }

    // Destroy existing chart
    Chart.getChart(canvas)?.destroy();

    if (!chartData || chartData.length === 0) {
      this.createFallbackChart(canvas, 'No Processing Trends Data Available');
      return;
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: chartData.map(point => point.Label),
        datasets: [{
          label: 'Processing Count',
          data: chartData.map(point => point.Value),
          backgroundColor: [
            'rgba(40, 167, 69, 0.8)',
            'rgba(220, 53, 69, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(23, 162, 184, 0.8)',
            'rgba(102, 16, 242, 0.8)',
            'rgba(253, 126, 20, 0.8)'
          ],
          borderColor: [
            '#28a745',
            '#dc3545',
            '#ffc107',
            '#17a2b8',
            '#6610f2',
            '#fd7e14'
          ],
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Dataset Processing Trends',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#28a745',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return `Processed: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time Period',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Number of Processed Datasets',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    new Chart(ctx, config);
  }

  createFallbackChart(canvas: HTMLCanvasElement, message: string) {
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data Available',
          data: [0],
          borderColor: '#6c757d',
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          borderWidth: 1,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: message
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Helper methods
  getCurrentReportTitle(): string {
    const reportType = this.reportTypes.find(r => r.id === this.selectedReportType);
    return reportType ? reportType.name : 'Reports';
  }

  getCurrentReportDescription(): string {
    const reportType = this.reportTypes.find(r => r.id === this.selectedReportType);
    return reportType ? reportType.description : '';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString();
  }

  // Filter methods for adjustable reports
  async applyTrendsFilters() {
    if (this.selectedReportType === 'dataset-trends') {
      console.log('Applying trends filters:', this.trendsFilters);
      
      // Show loading state
      this.isLoading = true;
      this.errorMessage = '';
      
      try {
        await this.loadDatasetTrendsReport();
        console.log('Filters applied successfully');
      } catch (error) {
        console.error('Error applying filters:', error);
        // Error message is already set in loadDatasetTrendsReport
      } finally {
        this.isLoading = false;
      }
    }
  }

  clearTrendsFilters() {
    console.log('Clearing trends filters');
    
    this.trendsFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      status: '' as string
    };
    
    console.log('Filters cleared, new values:', this.trendsFilters);
    this.applyTrendsFilters();
  }

  // Helper method to check if filters are active
  areFiltersActive(): boolean {
    return !!(this.trendsFilters.status || 
              (this.trendsFilters.startDate && this.trendsFilters.startDate !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
              (this.trendsFilters.endDate && this.trendsFilters.endDate !== new Date()));
  }

  // Custom date selector methods
  updateStartDate() {
    this.trendsFilters.startDate = new Date(this.customStartDate.year, this.customStartDate.month - 1, this.customStartDate.day);
  }

  updateEndDate() {
    this.trendsFilters.endDate = new Date(this.customEndDate.year, this.customEndDate.month - 1, this.customEndDate.day);
  }

  // Start date increment/decrement methods
  incrementYear() {
    this.customStartDate.year++;
    this.updateStartDate();
  }

  decrementYear() {
    this.customStartDate.year--;
    this.updateStartDate();
  }

  incrementMonth() {
    if (this.customStartDate.month < 12) {
      this.customStartDate.month++;
    } else {
      this.customStartDate.month = 1;
      this.customStartDate.year++;
    }
    this.updateStartDate();
  }

  decrementMonth() {
    if (this.customStartDate.month > 1) {
      this.customStartDate.month--;
    } else {
      this.customStartDate.month = 12;
      this.customStartDate.year--;
    }
    this.updateStartDate();
  }

  incrementDay() {
    const daysInMonth = new Date(this.customStartDate.year, this.customStartDate.month, 0).getDate();
    if (this.customStartDate.day < daysInMonth) {
      this.customStartDate.day++;
    } else {
      this.customStartDate.day = 1;
      this.incrementMonth();
    }
    this.updateStartDate();
  }

  decrementDay() {
    if (this.customStartDate.day > 1) {
      this.customStartDate.day--;
    } else {
      const prevMonth = this.customStartDate.month === 1 ? 12 : this.customStartDate.month - 1;
      const prevYear = this.customStartDate.month === 1 ? this.customStartDate.year - 1 : this.customStartDate.year;
      const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      this.customStartDate.day = daysInPrevMonth;
      this.decrementMonth();
    }
    this.updateStartDate();
  }

  // End date increment/decrement methods
  incrementEndYear() {
    this.customEndDate.year++;
    this.updateEndDate();
  }

  decrementEndYear() {
    this.customEndDate.year--;
    this.updateEndDate();
  }

  incrementEndMonth() {
    if (this.customEndDate.month < 12) {
      this.customEndDate.month++;
    } else {
      this.customEndDate.month = 1;
      this.customEndDate.year++;
    }
    this.updateEndDate();
  }

  decrementEndMonth() {
    if (this.customEndDate.month > 1) {
      this.customEndDate.month--;
    } else {
      this.customEndDate.month = 12;
      this.customEndDate.year--;
    }
    this.updateEndDate();
  }

  incrementEndDay() {
    const daysInMonth = new Date(this.customEndDate.year, this.customEndDate.month, 0).getDate();
    if (this.customEndDate.day < daysInMonth) {
      this.customEndDate.day++;
    } else {
      this.customEndDate.day = 1;
      this.incrementEndMonth();
    }
    this.updateEndDate();
  }

  decrementEndDay() {
    if (this.customEndDate.day > 1) {
      this.customEndDate.day--;
    } else {
      const prevMonth = this.customEndDate.month === 1 ? 12 : this.customEndDate.month - 1;
      const prevYear = this.customEndDate.month === 1 ? this.customEndDate.year - 1 : this.customEndDate.year;
      const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      this.customEndDate.day = daysInPrevMonth;
      this.decrementEndMonth();
    }
    this.updateEndDate();
  }

  // Chart download functionality
  downloadChartAsImage(chartRef: string, filename: string) {
    const canvas = this[chartRef]?.nativeElement;
    if (!canvas) {
      console.error(`Canvas ${chartRef} not found`);
      return;
    }

    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
      
      // Convert canvas to blob and create download link
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  }

  // Chart data calculation methods
  getTotalUploads(): number {
    if (!this.datasetTrendsReport?.UploadTrends) return 0;
    return this.datasetTrendsReport.UploadTrends.reduce((sum, trend) => sum + trend.Value, 0);
  }

  getAverageUploads(): number {
    if (!this.datasetTrendsReport?.UploadTrends?.length) return 0;
    const total = this.getTotalUploads();
    return Math.round(total / this.datasetTrendsReport.UploadTrends.length);
  }

  getPeakUploadPeriod(): string {
    if (!this.datasetTrendsReport?.UploadTrends?.length) return 'N/A';
    const maxTrend = this.datasetTrendsReport.UploadTrends.reduce((max, trend) => 
      trend.Value > max.Value ? trend : max
    );
    return maxTrend.Label;
  }

  getTotalProcessed(): number {
    if (!this.datasetTrendsReport?.ProcessingTrends) return 0;
    return this.datasetTrendsReport.ProcessingTrends.reduce((sum, trend) => sum + trend.Value, 0);
  }

  getAverageProcessed(): number {
    if (!this.datasetTrendsReport?.ProcessingTrends?.length) return 0;
    const total = this.getTotalProcessed();
    return Math.round(total / this.datasetTrendsReport.ProcessingTrends.length);
  }

  getProcessingSuccessRate(): number {
    if (!this.datasetTrendsReport?.Trends?.length) return 0;
    const totalProcessed = this.datasetTrendsReport.Trends.reduce((sum, trend) => sum + trend.ProcessedCount, 0);
    const totalValidated = this.datasetTrendsReport.Trends.reduce((sum, trend) => sum + trend.ValidatedCount, 0);
    
    if (totalProcessed === 0) return 0;
    return Math.round((totalValidated / totalProcessed) * 100);
  }

  // Helper methods for UI
  getCategoryColor(category: string): string {
    switch (category) {
      case 'simple': return 'primary';
      case 'transactional': return 'secondary';
      case 'management': return 'tertiary';
      case 'adjustable': return 'success';
      default: return 'medium';
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      case 'running': return 'primary';
      default: return 'medium';
    }
  }

  getDeploymentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      case 'deployed': return 'primary';
      default: return 'medium';
    }
  }

  getValidationStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'passed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      case 'not validated': return 'medium';
      default: return 'medium';
    }
  }

  // Helper methods to avoid TypeScript template type issues
  isModelActivityExperimentReport(): boolean {
    const result = this.selectedReportType === 'model-activity-experiment';
    console.log('isModelActivityExperimentReport() called, selectedReportType:', this.selectedReportType, 'result:', result);
    return result;
  }

  isModelDeploymentStatusReport(): boolean {
    const result = this.selectedReportType === 'model-deployment-status';
    console.log('isModelDeploymentStatusReport() called, selectedReportType:', this.selectedReportType, 'result:', result);
    return result;
  }

  isTrainingSessionReport(): boolean {
    return this.selectedReportType === 'training-sessions';
  }

  isModelDeploymentReport(): boolean {
    return this.selectedReportType === 'model-deployments';
  }

  // Helper methods for handling both old and new data structures
  getDatasetGroups(): any[] {
    if (!this.datasetTransactionReport) return [];
    
    // Try new format first
    if (this.datasetTransactionReport.DatasetGroups) {
      return this.datasetTransactionReport.DatasetGroups;
    }
    
    // Fallback to old format
    if (this.datasetTransactionReport.TransactionGroups) {
      return this.datasetTransactionReport.TransactionGroups;
    }
    
    return [];
  }

  getActionGroups(datasetGroup: any): any[] {
    if (!datasetGroup) return [];
    
    // Try new format first
    if (datasetGroup.ActionGroups) {
      return datasetGroup.ActionGroups;
    }
    
    // Fallback to old format
    if (datasetGroup.DatasetActions) {
      return datasetGroup.DatasetActions;
    }
    
    return [];
  }
} 