import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { ReportService, 
         UsersReportRequest, UsersReportResponse, UserReportItem,
         ClientsProjectsReportRequest, ClientsProjectsReportResponse, ClientProjectReportItem,
         TrainingSessionReportRequest, TrainingSessionReportResponse, TrainingSessionReportItem,
         ModelDeploymentReportRequest, ModelDeploymentReportResponse, ModelDeploymentReportItem,
         DatasetTransactionReportRequest, DatasetTransactionReportResponse, DatasetTransactionGroup,
         DatasetStatusReportRequest, DatasetStatusReportResponse, DatasetStatusReportItem,
         DatasetTrendsReportRequest, DatasetTrendsReportResponse, DatasetTrendItem,
         ModelTrainingSummaryReportRequest, ModelTrainingSummaryReportResponse, ModelTrainingGroup,
         ChartDataPoint } from '../../services/report.service';
import { firstValueFrom } from 'rxjs';

Chart.register(...registerables);

export interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'simple' | 'transactional' | 'management' | 'adjustable';
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ReportsComponent implements OnInit, AfterViewInit {
  @ViewChild('trendsChart') trendsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('successRateChart') successRateChart!: ElementRef<HTMLCanvasElement>;

  // Report types configuration
  reportTypes: ReportType[] = [
    {
      id: 'users',
      name: 'Registered Users Report',
      description: 'Simple list report of all registered users with their details',
      icon: 'people-outline',
      category: 'simple'
    },
    {
      id: 'clients-projects',
      name: 'Clients and Projects Report',
      description: 'Simple list report of clients and their associated projects',
      icon: 'business-outline',
      category: 'simple'
    },
    {
      id: 'training-sessions',
      name: 'Model Training Session Report',
      description: 'Management report with graphs showing training trends and success rates',
      icon: 'trending-up-outline',
      category: 'management'
    },
    {
      id: 'model-deployments',
      name: 'Model Deployment Report',
      description: 'Simple list report of model deployments and their status',
      icon: 'cloud-upload-outline',
      category: 'simple'
    },
    {
      id: 'dataset-transactions',
      name: 'Dataset Transaction Summary Report',
      description: 'Transactional report with control breaks by developer and dataset',
      icon: 'analytics-outline',
      category: 'transactional'
    },
    {
      id: 'dataset-status',
      name: 'Dataset Status Report',
      description: 'Simple list report of dataset statuses and validation results',
      icon: 'checkmark-circle-outline',
      category: 'simple'
    },
    {
      id: 'dataset-trends',
      name: 'Dataset Trends Report',
      description: 'Adjustable criteria report with trend analysis and filtering options',
      icon: 'bar-chart-outline',
      category: 'adjustable'
    }
  ];

  // Current state
  selectedReportType: string = '';
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

  // Filter states for adjustable reports
  trendsFilters = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    status: '',
    fileTypeFilter: '',
    developerFilter: '',
    groupBy: 'Date'
  };

  constructor(private reportService: ReportService) {}

  async ngOnInit() {
    // Test API connectivity first
    console.log('Testing API connectivity...');
    try {
      // Set default report
      this.selectedReportType = 'users';
      await this.loadReport('users');
    } catch (error) {
      console.error('Failed to load initial report:', error);
      this.errorMessage = 'Unable to connect to the backend API. Please check if the server is running.';
    }
  }

  ngAfterViewInit() {
    // Charts will be created after data is loaded
  }

  async loadReport(reportType: string) {
    console.log('Loading report type:', reportType);
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedReportType = reportType;

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
      this.errorMessage = 'Failed to load report. Please try again.';
    } finally {
      this.isLoading = false;
      console.log('Loading finished. isLoading:', this.isLoading);
    }
  }

  async loadUsersReport() {
    const request: UsersReportRequest = {
      startDate: new Date(),
      endDate: new Date(),
      isActive: true
    };

    console.log('Making API call to load users report with request:', request);

    try {
      const response = await firstValueFrom(this.reportService.generateUsersReport(request));
      console.log('Users Report Response:', response);
      console.log('Response users array:', response?.users);
      console.log('Response users length:', response?.users?.length);
      
      this.usersReport = response;
      this.currentReportData = response;
      
      this.errorMessage = '';
      
      console.log('Users report loaded successfully. usersReport.users:', this.usersReport?.users);
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
      projectActive: true
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
      startDate: new Date(),
      endDate: new Date(),
      statusFilter: 'all'
    };

    try {
      const response = await firstValueFrom(this.reportService.generateTrainingSessionReport(request));
      console.log('Training Session Report Response:', response);
      this.trainingSessionReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
    } catch (error: any) {
      console.error('Error loading training session report:', error);
      this.errorMessage = `Failed to load training session report: ${error?.message || error?.statusText || 'Unknown error'}`;
      throw error;
    }
  }

  async loadModelDeploymentReport() {
    const request: ModelDeploymentReportRequest = {
      startDate: new Date(),
      endDate: new Date(),
      statusFilter: 'all'
    };

    try {
      const response = await firstValueFrom(this.reportService.generateModelDeploymentReport(request));
      console.log('Model Deployment Report Response:', response);
      this.modelDeploymentReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
    } catch (error) {
      console.error('Error loading model deployment report:', error);
      this.errorMessage = 'Failed to load model deployment report';
      throw error;
    }
  }

  async loadDatasetTransactionReport() {
    const request: DatasetTransactionReportRequest = {
      startDate: new Date(),
      endDate: new Date(),
      actionFilter: 'all'
    };

    try {
      const response = await firstValueFrom(this.reportService.generateDatasetTransactionReport(request));
      console.log('Dataset Transaction Report Response:', response);
      this.datasetTransactionReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
    } catch (error) {
      console.error('Error loading dataset transaction report:', error);
      this.errorMessage = 'Failed to load dataset transaction report';
      throw error;
    }
  }

  async loadDatasetStatusReport() {
    const request: DatasetStatusReportRequest = {
      statusFilter: 'all'
    };

    try {
      const response = await firstValueFrom(this.reportService.generateDatasetStatusReport(request));
      console.log('Dataset Status Report Response:', response);
      this.datasetStatusReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
    } catch (error) {
      console.error('Error loading dataset status report:', error);
      this.errorMessage = 'Failed to load dataset status report';
      throw error;
    }
  }

  async loadDatasetTrendsReport() {
    const request: DatasetTrendsReportRequest = {
      startDate: this.trendsFilters.startDate,
      endDate: this.trendsFilters.endDate,
      status: this.trendsFilters.status || 'all'
    };

    try {
      const response = await firstValueFrom(this.reportService.generateDatasetTrendsReport(request));
      console.log('Dataset Trends Report Response:', response);
      this.datasetTrendsReport = response;
      this.currentReportData = response;
      this.errorMessage = '';
      
      if (response.uploadTrends && response.uploadTrends.length > 0) {
        this.createDatasetTrendsChart(response.uploadTrends);
      }
    } catch (error) {
      console.error('Error loading dataset trends report:', error);
      this.errorMessage = 'Failed to load dataset trends report';
      throw error;
    }
  }

  // Export functions
  async exportToPdf() {
    try {
      this.isLoading = true;
      let blob: Blob;
      let filename: string;

      switch (this.selectedReportType) {
        case 'users':
          const usersRequest: UsersReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateUsersReportPdf(usersRequest));
          filename = 'users-report.pdf';
          break;
        case 'clients-projects':
          const clientsRequest: ClientsProjectsReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateClientsProjectsReportPdf(clientsRequest));
          filename = 'clients-projects-report.pdf';
          break;
        case 'training-sessions':
          const trainingRequest: TrainingSessionReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateTrainingSessionReportPdf(trainingRequest));
          filename = 'training-sessions-report.pdf';
          break;
        case 'model-deployments':
          const deploymentRequest: ModelDeploymentReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateModelDeploymentReportPdf(deploymentRequest));
          filename = 'model-deployments-report.pdf';
          break;
        case 'dataset-transactions':
          const transactionRequest: DatasetTransactionReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateDatasetTransactionReportPdf(transactionRequest));
          filename = 'dataset-transactions-report.pdf';
          break;
        case 'dataset-status':
          const statusRequest: DatasetStatusReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateDatasetStatusReportPdf(statusRequest));
          filename = 'dataset-status-report.pdf';
          break;
        case 'dataset-trends':
          const trendsRequest: DatasetTrendsReportRequest = {
            startDate: this.trendsFilters.startDate,
            endDate: this.trendsFilters.endDate,
            status: this.trendsFilters.status || undefined,
            fileTypeFilter: this.trendsFilters.fileTypeFilter || undefined,
            developerFilter: this.trendsFilters.developerFilter || undefined,
            groupBy: this.trendsFilters.groupBy,
            generatedBy: 'System',
            includeLogo: true
          };
          blob = await firstValueFrom(this.reportService.generateDatasetTrendsReportPdf(trendsRequest));
          filename = 'dataset-trends-report.pdf';
          break;
        default:
          throw new Error('Unknown report type');
      }

      this.reportService.downloadBlob(blob, filename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      this.errorMessage = 'Failed to export PDF. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async exportToJson() {
    try {
      this.isLoading = true;
      let data: any;
      let filename: string;

      switch (this.selectedReportType) {
        case 'users':
          const usersRequest: UsersReportRequest = { generatedBy: 'System', includeLogo: true };
          data = await firstValueFrom(this.reportService.generateUsersReportJson(usersRequest));
          filename = 'users-report.json';
          break;
        case 'clients-projects':
          const clientsRequest: ClientsProjectsReportRequest = { generatedBy: 'System', includeLogo: true };
          data = await firstValueFrom(this.reportService.generateClientsProjectsReportJson(clientsRequest));
          filename = 'clients-projects-report.json';
          break;
        case 'training-sessions':
          const trainingRequest: TrainingSessionReportRequest = { generatedBy: 'System', includeLogo: true };
          data = await firstValueFrom(this.reportService.generateTrainingSessionReportJson(trainingRequest));
          filename = 'training-sessions-report.json';
          break;
        case 'model-deployments':
          const deploymentRequest: ModelDeploymentReportRequest = { generatedBy: 'System', includeLogo: true };
          data = await firstValueFrom(this.reportService.generateModelDeploymentReportJson(deploymentRequest));
          filename = 'model-deployments-report.json';
          break;
        case 'dataset-transactions':
          const transactionRequest: DatasetTransactionReportRequest = { generatedBy: 'System', includeLogo: true };
          data = await firstValueFrom(this.reportService.generateDatasetTransactionReportJson(transactionRequest));
          filename = 'dataset-transactions-report.json';
          break;
        case 'dataset-status':
          const statusRequest: DatasetStatusReportRequest = { generatedBy: 'System', includeLogo: true };
          data = await firstValueFrom(this.reportService.generateDatasetStatusReportJson(statusRequest));
          filename = 'dataset-status-report.json';
          break;
        case 'dataset-trends':
          const trendsRequest: DatasetTrendsReportRequest = {
            startDate: this.trendsFilters.startDate,
            endDate: this.trendsFilters.endDate,
            status: this.trendsFilters.status || undefined,
            fileTypeFilter: this.trendsFilters.fileTypeFilter || undefined,
            developerFilter: this.trendsFilters.developerFilter || undefined,
            groupBy: this.trendsFilters.groupBy,
            generatedBy: 'System',
            includeLogo: true
          };
          data = await firstValueFrom(this.reportService.generateDatasetTrendsReportJson(trendsRequest));
          filename = 'dataset-trends-report.json';
          break;
        default:
          throw new Error('Unknown report type');
      }

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      this.reportService.downloadBlob(blob, filename);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      this.errorMessage = 'Failed to export JSON. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async exportToExcel() {
    try {
      this.isLoading = true;
      let blob: Blob;
      let filename: string;

      switch (this.selectedReportType) {
        case 'users':
          const usersRequest: UsersReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateUsersReportExcel(usersRequest));
          filename = 'users-report.xlsx';
          break;
        case 'clients-projects':
          const clientsRequest: ClientsProjectsReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateClientsProjectsReportExcel(clientsRequest));
          filename = 'clients-projects-report.xlsx';
          break;
        case 'training-sessions':
          const trainingRequest: TrainingSessionReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateTrainingSessionReportExcel(trainingRequest));
          filename = 'training-sessions-report.xlsx';
          break;
        case 'model-deployments':
          const deploymentRequest: ModelDeploymentReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateModelDeploymentReportExcel(deploymentRequest));
          filename = 'model-deployments-report.xlsx';
          break;
        case 'dataset-transactions':
          const transactionRequest: DatasetTransactionReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateDatasetTransactionReportExcel(transactionRequest));
          filename = 'dataset-transactions-report.xlsx';
          break;
        case 'dataset-status':
          const statusRequest: DatasetStatusReportRequest = { generatedBy: 'System', includeLogo: true };
          blob = await firstValueFrom(this.reportService.generateDatasetStatusReportExcel(statusRequest));
          filename = 'dataset-status-report.xlsx';
          break;
        case 'dataset-trends':
          const trendsRequest: DatasetTrendsReportRequest = {
            startDate: this.trendsFilters.startDate,
            endDate: this.trendsFilters.endDate,
            status: this.trendsFilters.status || undefined,
            fileTypeFilter: this.trendsFilters.fileTypeFilter || undefined,
            developerFilter: this.trendsFilters.developerFilter || undefined,
            groupBy: this.trendsFilters.groupBy,
            generatedBy: 'System',
            includeLogo: true
          };
          blob = await firstValueFrom(this.reportService.generateDatasetTrendsReportExcel(trendsRequest));
          filename = 'dataset-trends-report.xlsx';
          break;
        default:
          throw new Error('Unknown report type');
      }

      this.reportService.downloadBlob(blob, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.errorMessage = 'Failed to export Excel. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  // Chart creation methods
  createTrainingTrendsChart() {
    if (!this.trendsChart?.nativeElement || !this.trainingSessionReport) return;

    const canvas = this.trendsChart.nativeElement;
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.trainingSessionReport.trainingTrends.map(point => point.label),
        datasets: [{
          label: 'Training Sessions',
          data: this.trainingSessionReport.trainingTrends.map(point => point.value),
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
    if (!this.successRateChart?.nativeElement || !this.trainingSessionReport) return;

    const canvas = this.successRateChart.nativeElement;
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.trainingSessionReport.successRateData.map(point => point.label),
        datasets: [{
          label: 'Success Rate (%)',
          data: this.trainingSessionReport.successRateData.map(point => point.value),
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
    if (!this.trendsChart?.nativeElement) return;

    const canvas = this.trendsChart.nativeElement;
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartData.map(item => item.label),
        datasets: [{
          label: 'Dataset Uploads',
          data: chartData.map(item => item.value),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Dataset Upload Trends'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Uploads'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
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
      await this.loadDatasetTrendsReport();
    }
  }

  clearTrendsFilters() {
    this.trendsFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      status: '',
      fileTypeFilter: '',
      developerFilter: '',
      groupBy: 'Date'
    };
    this.applyTrendsFilters();
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
} 