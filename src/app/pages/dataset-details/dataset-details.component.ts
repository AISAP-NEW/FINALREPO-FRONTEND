import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonButton, 
  IonIcon, 
  IonItem, 
  IonLabel, 
  IonNote, 
  IonBadge, 
  IonSpinner, 
  IonAccordion, 
  IonRange,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonAccordionGroup,
  IonList,
  IonListHeader,
  IonText,
  IonChip
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService, Dataset, ValidationResponse } from '../../services/dataset.service';
import { DatasetOperationsService } from '../../services/dataset-operations.service';
import { ToastService } from '../../services/toast.service';
import { ModalController } from '@ionic/angular';
import { ValidationResultsModalComponent } from '../../components/validation-results-modal/validation-results-modal.component';
import { finalize } from 'rxjs/operators';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { TruncatePipe } from '../../pipes/truncate.pipe';

interface DatasetSchemaField {
  name: string;
  type: string;
  nullable: boolean;
  sampleValues: any[];
}

interface PreviewData {
  headers: string[];
  data: Array<Record<string, any>>;
  schema: DatasetSchemaField[];
  totalRows: number;
  isMetadataFallback?: boolean;
}

@Component({
  selector: 'app-dataset-details',
  templateUrl: './dataset-details.page.html',
  styleUrls: ['./dataset-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton, 
    IonIcon, 
    IonItem, 
    IonLabel, 
    IonNote, 
    IonBadge, 
    IonSpinner, 
    IonAccordion,
    IonAccordionGroup,
    IonRange,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonSegment,
    IonSegmentButton,
    IonList,
    IonListHeader,
    IonText,
    IonChip,
    ValidationResultsModalComponent,
    SafeHtmlPipe,
    TruncatePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DatasetDetailsPage implements OnInit {
  // Component state
  datasetId: string | null = null;
  dataset: Dataset | null = null;
  isLoading = true;
  showDebugInfo = false;
  activeTab: 'preview' | 'schema' | 'operations' = 'preview';
  isSplitting = false;
  splitError: string | null = null;
  
  // Preview data state
  previewData: PreviewData = {
    headers: [],
    data: [],
    schema: [],
    totalRows: 0
  };
  
  // Validation state
  validationResult: ValidationResponse | null = null;
  isValidationInProgress = false;
  validationError: string | null = null;
  
  // Train/test split
  trainSplitRatio = 80;
  
  // Preview pagination
  previewPage = 1;
  previewRowsToShow = 10;
  previewRowCount = 10; // Default number of rows to show in preview
  totalPreviewPages = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datasetService: DatasetService,
    private datasetOps: DatasetOperationsService,
    private toastService: ToastService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.datasetId = id;
        this.loadDataset(id);
        this.loadDatasetPreview(id);
        
        // Initialize pagination
        this.updatePagination();
      } else {
        this.toastService.presentToast('error', 'No dataset ID provided', 3000);
        this.router.navigate(['/datasets']);
      }
    });
  }
  
  // Update pagination values when data changes
  private updatePagination(): void {
    if (this.previewData?.data?.length) {
      this.totalPreviewPages = Math.ceil(this.previewData.data.length / this.previewRowsToShow);
      this.previewRowCount = Math.min(this.previewRowsToShow, this.previewData.data.length);
    } else {
      this.totalPreviewPages = 1;
      this.previewPage = 1;
      this.previewRowCount = 0;
    }
  }

  // Load dataset details and preview
  private loadDataset(datasetId: string): void {
    this.isLoading = true;
    
    // Load dataset metadata
    this.datasetService.getDatasetById(datasetId).subscribe({
      next: (dataset) => {
        this.dataset = dataset;
        this.loadDatasetPreview(datasetId);
      },
      error: (error) => {
        console.error('Error loading dataset:', error);
        this.toastService.presentToast('error', 'Failed to load dataset', 3000);
        this.isLoading = false;
      }
    });
  }

  // Handle segment change for tabs
  onSegmentChange(event: any) {
    this.activeTab = event.detail.value;
  }

  // Check if preview data exists
  get hasPreviewData(): boolean {
    return this.previewData?.data?.length > 0;
  }

  // Export preview data to CSV
  exportPreviewToCsv(): void {
    // Implementation for exporting to CSV
    console.log('Exporting preview data to CSV');
  }

  // Change preview page
  changePreviewPage(page: number): void {
    if (page >= 1 && page <= this.totalPreviewPages) {
      this.previewPage = page;
    }
  }

  // Get paginated preview rows
  get pagedPreviewRows(): any[] {
    const start = (this.previewPage - 1) * this.previewRowsToShow;
    const end = start + this.previewRowsToShow;
    return this.previewData.data.slice(start, end);
  }

  // Get cell value safely
  getCellValue(row: any, header: string): string {
    return row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
  }

  // Load dataset preview
  loadDatasetPreview(datasetId: string | null): void {
    if (!datasetId) {
      console.error('No dataset ID provided for preview');
      this.toastService.presentToast('error', 'No dataset ID provided', 3000);
      return;
    }

    this.isLoading = true;
    this.datasetService.getDatasetContent(datasetId).pipe(
      finalize(() => {
        this.isLoading = false;
        // Update pagination after data is loaded
        this.updatePagination();
      })
    ).subscribe({
      next: (response) => {
        this.handleDatasetContentResponse(response);
      },
      error: (error) => {
        console.error('Error loading dataset preview:', error);
        this.toastService.presentToast('error', 'Failed to load dataset preview', 3000);
        this.previewData = {
          headers: [],
          data: [],
          schema: [],
          totalRows: 0
        };
        this.updatePagination();
      }
    });
  }

  // Handle dataset content response
  private handleDatasetContentResponse(response: any): void {
    try {
      // Reset preview data
      this.previewData = {
        headers: [],
        data: [],
        schema: [],
        totalRows: 0
      };

      if (Array.isArray(response)) {
        this.processArrayResponse(response);
      } else if (response && typeof response === 'object') {
        // Handle different response formats based on content type
        if (response.content) {
          // If response has a content field, process it
          if (Array.isArray(response.content)) {
            this.processArrayResponse(response.content);
          } else if (typeof response.content === 'string') {
            this.processCsvContent(response.content);
          }
        } else if (response.data) {
          // Handle data field if it exists
          this.processArrayResponse(Array.isArray(response.data) ? response.data : [response.data]);
        } else if (response.rows) {
          // Handle rows field if it exists
          this.processArrayResponse(Array.isArray(response.rows) ? response.rows : [response.rows]);
        } else {
          // If it's a plain object, try to process it as a single row
          this.processArrayResponse([response]);
        }
      } else if (typeof response === 'string') {
        // Handle CSV or JSON string
        const trimmedResponse = response.trim();
        if (trimmedResponse.startsWith('{') || trimmedResponse.startsWith('[')) {
          try {
            const jsonData = JSON.parse(trimmedResponse);
            this.handleDatasetContentResponse(jsonData);
          } catch (e) {
            console.warn('Error parsing JSON response, trying as CSV:', e);
            this.processCsvContent(trimmedResponse);
          }
        } else {
          this.processCsvContent(trimmedResponse);
        }
      } else {
        console.warn('Unsupported response format:', response);
        this.toastService.presentToast('warning', 'Unsupported data format received', 3000);
        return;
      }
      
      // Update pagination after processing data
      this.updatePagination();
      
      // Infer schema after processing data
      this.inferSchemaFromPreviewData();
      
    } catch (error) {
      console.error('Error processing dataset content:', error);
      this.toastService.presentToast('error', 'Failed to process dataset content', 3000);
      this.previewData = {
        headers: [],
        data: [],
        schema: [],
        totalRows: 0
      };
      this.updatePagination();
    }
  }

  // Process array response
  private processArrayResponse(data: any[]): void {
    if (!data || !data.length) {
      console.warn('Empty or invalid data array received');
      this.toastService.presentToast('warning', 'No data available in the dataset', 3000);
      return;
    }

    try {
      // Extract headers from the first non-empty row
      const firstRow = data.find(row => row && typeof row === 'object' && Object.keys(row).length > 0);
      if (!firstRow) {
        throw new Error('No valid data rows found');
      }

      // Get all unique headers from all rows
      const allHeaders = new Set<string>();
      data.forEach(row => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(key => allHeaders.add(key));
        }
      });

      this.previewData.headers = Array.from(allHeaders);
      
      // Map data to rows with consistent structure
      this.previewData.data = data
        .filter(row => row && typeof row === 'object')
        .map((row, index) => {
          const processedRow: Record<string, any> = { rowNumber: index + 1 };
          
          // Ensure all headers exist in each row
          this.previewData.headers.forEach(header => {
            processedRow[header] = row.hasOwnProperty(header) ? row[header] : null;
          });
          
          return processedRow;
        });
      
      this.previewData.totalRows = this.previewData.data.length;
      
    } catch (error) {
      console.error('Error processing array data:', error);
      this.toastService.presentToast('error', 'Error processing dataset content', 3000);
      throw error; // Re-throw to be caught by the caller
    }
  }

  // Process CSV content
  private processCsvContent(csvContent: string): void {
    if (!csvContent || typeof csvContent !== 'string') {
      console.warn('Invalid CSV content');
      this.toastService.presentToast('warning', 'Invalid CSV content', 3000);
      return;
    }

    try {
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) {
        throw new Error('Empty CSV content');
      }
      
      // Parse headers from first line
      this.previewData.headers = lines[0].split(',').map(h => h.trim());
      
      // Parse data rows with proper CSV parsing (handles quoted values)
      this.previewData.data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = this.parseCsvLine(line);
        const row: Record<string, any> = { rowNumber: i };
        
        // Map values to headers, handling cases where values might be missing
        this.previewData.headers.forEach((header, idx) => {
          row[header] = idx < values.length ? values[idx] : '';
        });
        
        this.previewData.data.push(row);
      }
      
      this.previewData.totalRows = this.previewData.data.length;
      
    } catch (error) {
      console.error('Error processing CSV content:', error);
      this.toastService.presentToast('error', 'Error processing CSV content', 3000);
      throw error; // Re-throw to be caught by the caller
    }
  }
  
  // Helper method to parse a single CSV line, handling quoted values
  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // Toggle inQuotes flag when encountering a quote
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // End of value, add to values array
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        // Add character to current value
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    return values;
  }

  // Infer schema from preview data
  inferSchemaFromPreviewData(): void {
    if (!this.previewData?.data?.length) {
      console.warn('No data available for schema inference');
      return;
    }

    try {
      // Get all unique headers (excluding internal fields like rowNumber)
      const headers = new Set<string>();
      this.previewData.data.forEach(row => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(key => {
            if (key !== 'rowNumber') {
              headers.add(key);
            }
          });
        }
      });

      // Analyze each column to determine its type and properties
      this.previewData.schema = Array.from(headers).map(header => {
        // Get sample values (non-null, non-empty)
        const sampleValues = this.previewData.data
          .map(row => row?.[header])
          .filter(val => val !== undefined && val !== null && val !== '');
        
        // Determine data type based on sample values
        let type = 'string';
        let isNumeric = true;
        let isBoolean = true;
        let isDate = true;
        
        // Check a sample of values to determine the most likely type
        const sampleSize = Math.min(100, sampleValues.length);
        for (let i = 0; i < sampleSize; i++) {
          const val = sampleValues[i];
          const strVal = String(val).trim();
          
          // Check if numeric
          if (isNumeric && isNaN(Number(strVal))) {
            isNumeric = false;
          }
          
          // Check if boolean
          if (isBoolean && !['true', 'false', 'yes', 'no', '1', '0', ''].includes(strVal.toLowerCase())) {
            isBoolean = false;
          }
          
          // Check if date
          if (isDate) {
            const date = new Date(strVal);
            if (isNaN(date.getTime()) || date.toString() === 'Invalid Date') {
              isDate = false;
            }
          }
          
          // If we've already determined it's not any of these types, we can break early
          if (!isNumeric && !isBoolean && !isDate) {
            break;
          }
        }
        
        // Determine the most specific type
        if (isNumeric) {
          type = 'number';
        } else if (isBoolean) {
          type = 'boolean';
        } else if (isDate) {
          type = 'date';
        } else {
          // For strings, check if it's a categorical variable with limited unique values
          const uniqueValues = new Set(sampleValues.map(String));
          if (uniqueValues.size <= 10) {
            type = 'category';
          }
        }
        
        // Get sample values for display (limited to 5 unique values)
        const displayValues = Array.from(new Set(sampleValues.map(String))).slice(0, 5);
        
        return {
          name: header,
          type,
          nullable: sampleValues.length < this.previewData.data.length,
          sampleValues: displayValues
        };
      });
      
      console.log('Inferred schema:', this.previewData.schema);
      
    } catch (error) {
      console.error('Error inferring schema:', error);
      this.toastService.presentToast('error', 'Error inferring schema from data', 3000);
    }
  }

  // Handle dataset error
  private handleDatasetError(error: any): void {
    console.error('Error loading dataset content:', error);
    this.toastService.presentToast('error', 'Failed to load dataset content', 3000);
  }

  // Normalize validation status to match expected format
  private normalizeValidationStatus(status: string): 'success' | 'error' | 'warning' | 'failed' {
    const normalized = status.toLowerCase();
    if (normalized === 'passed') return 'success';
    if (['error', 'warning', 'failed'].includes(normalized)) {
      return normalized as 'error' | 'warning' | 'failed';
    }
    console.warn(`Unexpected validation status: ${status}, defaulting to 'error'`);
    return 'error';
  }

  // Get the appropriate badge color based on validation status
  getValidationBadgeClass(): string {
    if (!this.validationResult) return 'medium';
    
    const status = this.normalizeValidationStatus(this.validationResult.status);
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'failed':
        return 'danger';
      default:
        return 'medium';
    }
  }

  // Get status color for a given status string
  getStatusColor(status: string): string {
    const normalizedStatus = this.normalizeValidationStatus(status);
    switch (normalizedStatus) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'failed':
        return 'danger';
      default:
        return 'medium';
    }
  }

  // Show validation results in a modal
  async showValidationResults(validationResult: ValidationResponse | null): Promise<void> {
    if (!validationResult) {
      this.toastService.presentToast('warning', 'No validation results available', 3000);
      return;
    }

    try {
      const modal = await this.modalCtrl.create({
        component: ValidationResultsModalComponent,
        componentProps: { 
          validationResult: {
            ...validationResult,
            errors: validationResult.errors || []
          } 
        },
        cssClass: 'validation-results-modal',
        backdropDismiss: true,
        showBackdrop: true
      });

      await modal.present();
    } catch (error) {
      console.error('Error showing validation results:', error);
      this.toastService.presentToast('error', 'Failed to show validation results', 3000);
    }
  }

  // Validate dataset
  validateDataset(): void {
    if (!this.datasetId) {
      this.toastService.presentToast('error', 'No dataset selected', 3000);
      return;
    }

    this.isValidationInProgress = true;
    this.validationError = null;
    
    this.datasetService.validateDataset(this.datasetId).subscribe({
      next: (result: any) => {
        try {
          // Ensure all required fields are present
          const normalizedResult: ValidationResponse = {
            status: this.normalizeValidationStatus(result.status),
            errorCount: result.errorCount || 0,
            errorLines: result.errorLines || [],
            errors: result.errors || [],
            totalRows: result.totalRows || 0,
            validationId: result.validationId || `val_${Date.now()}`,
            message: result.message,
            versionId: result.versionId,
            timestamp: result.timestamp || new Date().toISOString()
          };
          
          this.validationResult = normalizedResult;
          this.showValidationResults(normalizedResult);
          
          // Update dataset validation status if dataset exists
          if (this.dataset) {
            this.dataset.isValidated = normalizedResult.status === 'success';
            this.dataset.validationStatus = normalizedResult.status;
            this.dataset.validationErrors = normalizedResult.errorCount;
          }
        } catch (error) {
          console.error('Error processing validation result:', error);
          this.validationError = 'Failed to process validation results';
          this.toastService.presentToast('error', this.validationError, 4000);
        } finally {
          this.isValidationInProgress = false;
        }
      },
      error: (error: any) => {
        console.error('Error validating dataset:', error);
        this.isValidationInProgress = false;
        const errorMessage = error?.message || 'Failed to validate dataset';
        this.validationError = errorMessage;
        this.toastService.presentToast('error', errorMessage, 4000);
      }
    });
  }

  // Download dataset in the specified format
  downloadDataset(format: string = 'csv'): void {
    if (!this.datasetId) {
      this.toastService.presentToast('error', 'No dataset selected', 3000);
      return;
    }

    // Show loading indicator
    const loadingMessage = `Preparing ${format.toUpperCase()} download...`;
    
    // Show loading toast
    this.toastService.presentToast('info', loadingMessage, 2000);
    
    // We've already checked that datasetId is not null
    this.datasetService.downloadDataset(this.datasetId, format).subscribe({
      next: (blob: Blob) => {
        try {
          // Create a temporary URL for the blob
          const url = window.URL.createObjectURL(blob);
          
          // Create a temporary anchor element
          const a = document.createElement('a');
          a.href = url;
          
          // Set the download filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `dataset_${this.datasetId}_${timestamp}.${format}`;
          a.download = filename;
          
          // Trigger the download
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          // Show success message
          this.toastService.presentToast(
            'success', 
            `Dataset downloaded as ${format.toUpperCase()}`,
            3000
          );
        } catch (error) {
          console.error('Error creating download:', error);
          this.toastService.presentToast(
            'error', 
            'Failed to create download',
            3000
          );
        }
      },
      error: (error: any) => {
        console.error(`Error downloading dataset as ${format}:`, error);
        const errorMessage = error?.error?.message || 
                           `Failed to download dataset as ${format.toUpperCase()}`;
        this.toastService.presentToast('error', errorMessage, 4000);
      }
    });
  }

  // Available split ratios
  splitRatios = [
    { label: '70-30', train: 70, test: 30 },
    { label: '80-20', train: 80, test: 20 },
    { label: '90-10', train: 90, test: 10 }
  ];
  
  // Current selected ratio (default to 80-20)
  selectedRatio = this.splitRatios[1];
  
  // Current split result
  splitResult: any = null;

  // Handle ratio change from segment
  onRatioChange(event: any) {
    this.selectedRatio = event.detail.value;
  }

  // Split dataset into training and testing sets
  splitDataset(trainRatio: number, testRatio: number): void {
    if (!this.datasetId) {
      this.toastService.presentToast('error', 'No dataset selected', 3000);
      return;
    }

    this.isSplitting = true;
    this.splitError = null;
    this.splitResult = null;
    
    // Show loading message
    this.toastService.presentToast('info', 'Splitting dataset...', 2000);
    
    // We've already checked that datasetId is not null
    this.datasetService.splitDataset(this.datasetId, trainRatio, testRatio).subscribe({
      next: (result: any) => {
        this.splitResult = result;
        console.log('Dataset split result:', result);
        
        // Update dataset status
        if (this.dataset) {
          this.dataset.splitStatus = 'complete';
          this.dataset.trainTestSplit = {
            trainSize: trainRatio / 100,
            testSize: testRatio / 100,
            splitAt: new Date().toISOString()
          };
        }
        
        // Show success message with actual split from server
        this.toastService.presentToast(
          'success', 
          `Dataset split successfully (${result.TrainPercentage || trainRatio}% train, ${result.TestPercentage || testRatio}% test)`, 
          4000
        );
        
        // Refresh the dataset to show updated status
        this.refreshDataset();
      },
      error: (error: any) => {
        console.error('Error splitting dataset:', error);
        const errorMessage = error?.error?.message || 'Failed to split dataset';
        this.splitError = errorMessage;
        this.toastService.presentToast('error', errorMessage, 4000);
      },
      complete: () => {
        this.isSplitting = false;
      }
    });
  }

  // Handle tab change
  onTabChange(event: any): void {
    this.activeTab = event.detail.value;
  }

  // Refresh dataset
  refreshDataset(): void {
    if (this.datasetId) {
      this.loadDataset(this.datasetId);
    }
  }


}
