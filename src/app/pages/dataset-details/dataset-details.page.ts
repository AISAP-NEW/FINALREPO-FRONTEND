/**
 * 🧠 Preprocessing Page — AI Model Management System
 * 
 * ✅ Purpose:
 * - Provide UI to run preprocessing on a dataset.
 * - Interact with backend endpoint: POST /Preprocess/preprocess-by-id?datasetId={id}
 * 
 * ✅ Backend Requirements:
 * - Endpoint accepts: PreprocessOptions (handleMissingValues, removeDuplicates, fixDataTypes, scalingMethod)
 * - Returns: { message, datasetId, results[] }
 * 
 * ✅ Component Features:
 * - Angular Reactive Form to collect preprocessing options.
 * - Calls DatasetService.preprocessDataset(datasetId, options).
 * - Shows processing status, errors, and results.
 * 
 * 🛠️ Cursor Tasks:
 * - Check datasetId from ActivatedRoute.
 * - Bind form controls for options.
 * - Show result rows: original path + cleaned path.
 * - Show toast on success (optional).
 */

interface PreprocessOptions {
  handleMissingValues: boolean;
  removeDuplicates: boolean;
  fixDataTypes: boolean;
  scalingMethod?: 'none' | 'normalize' | 'standardize';
}

interface PreprocessResult {
  message: string;
  datasetId: string;
  results: Array<{
    original: string;
    cleaned: string;
  }>;
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetOperationsService } from '../../services/dataset-operations.service';
import { DatasetService, Dataset, ValidationResponse } from '../../services/dataset.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { finalize } from 'rxjs/operators';
import { ToastService } from '../../services/toast.service';
import { ToastController, IonicModule, ModalController } from '@ionic/angular';
import { ValidationResultsModalComponent } from '../../components/validation-results-modal/validation-results-modal.component';

import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle,
  IonContent, IonList, IonItem, IonLabel, IonSpinner, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText,
  IonNote, IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton,
  IonBackButton, IonAccordionGroup, IonAccordion
} from '@ionic/angular/standalone';

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
    ReactiveFormsModule,
    RouterModule,
    IonicModule,
    SafeHtmlPipe,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle,
    IonContent, IonList, IonItem, IonLabel, IonSpinner, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText,
    IonNote, IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton,
    IonBackButton, IonAccordionGroup, IonAccordion
  ],
  providers: [DatasetService, DatasetOperationsService, ToastService]
})
export class DatasetDetailsPage implements OnInit {
  datasetId: string | null = null;
  dataset: Dataset | null = null;
  isLoading = true;
  showDebugInfo = false;
  previewHeaders: string[] = [];
  previewRows: any[] = [];
  previewReady = false;
  previewError: string | null = null;
  previewData: PreviewData = {
    headers: [],
    data: [],
    schema: [],
    totalRows: 0
  };
  previewRowsToShow = 10;
  previewRowCount = 10;
  previewPage = 1;
  totalPreviewPages = 1;

  get pagedPreviewRows(): any[] {
    const start = (this.previewPage - 1) * this.previewRowsToShow;
    return this.previewData.data.slice(start, start + this.previewRowsToShow);
  }

  changePreviewPage(page: number): void {
    if (page < 1 || page > this.totalPreviewPages) return;
    this.previewPage = page;
  }

  updatePagination(): void {
    this.totalPreviewPages = Math.max(1, Math.ceil((this.previewData.totalRows || this.previewData.data.length) / this.previewRowsToShow));
    if (this.previewPage > this.totalPreviewPages) this.previewPage = this.totalPreviewPages;
  }

  exportPreviewToCsv(): void {
    if (!this.previewData.headers.length || !this.pagedPreviewRows.length) return;
    const headers = this.previewData.headers;
    const csvRows = [headers.join(",")];
    for (const row of this.pagedPreviewRows) {
      csvRows.push(headers.map(h => '"' + String(row[h] ?? '').replace(/"/g, '""') + '"').join(","));
    }
    const csvContent = csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dataset-preview-page-${this.previewPage}.csv`;
    link.click();
  }
  activeTab: 'preview' | 'schema' | 'operations' = 'preview';
  isProcessing = false;
  processingError: string | null = null;
  preprocessResults: PreprocessResult | null = null;
  preprocessForm: FormGroup;

  // Dataset validation state
  validationResult: ValidationResponse | null = null;
  isValidationInProgress = false;
  validationError: string | null = null;
  trainSplitRatio = 80; // Default train/test split ratio

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datasetOps: DatasetOperationsService,
    private datasetService: DatasetService,
    private toastService: ToastService,
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    this.preprocessForm = this.fb.group({
      handleMissingValues: [true],
      removeDuplicates: [true],
      fixDataTypes: [true],
      scalingMethod: ['none']
    });
  }

  ngOnInit() {
    // Get dataset ID from route parameters
    this.route.paramMap.subscribe(params => {
      const datasetId = params.get('id');
      
      if (!datasetId) {
        console.error('No dataset ID provided in route');
        this.previewError = 'No dataset ID provided';
        this.isLoading = false;
        this.toastService.presentToast('error', 'No dataset ID provided', 3000);
        this.router.navigate(['/datasets']);
        return;
      }
      
      console.log('Loading dataset with ID:', datasetId);
      this.datasetId = datasetId;
      this.loadDatasetInfo(datasetId);
      
      // Listen for route data if available
      this.route.data.subscribe((data: any) => {
        if (data && data['dataset']) {
          this.dataset = data['dataset'];
          console.log('Received dataset from route data:', this.dataset);
        }
      });
    });
    
    // Handle query parameters if needed
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'] as 'preview' | 'schema' | 'operations';
      }
    });
  }

  get hasPreviewData(): boolean {
    return this.previewRows.length > 0 || this.previewData.data.length > 0;
  }

  // Public method that can be called from template
  refreshDataset(): void {
    if (!this.datasetId) {
      console.error('No dataset ID available');
      return;
    }
    this.loadDatasetInfo(this.datasetId);
  }

  /**
   * Validates the current dataset
   */
  validateDataset(): void {
    if (!this.datasetId) {
      this.toastService.presentToast('error', 'No dataset selected', 3000);
      return;
    }

    this.isValidationInProgress = true;
    this.validationError = null;
    
    this.datasetService.validateDataset(this.datasetId).subscribe({
      next: (result) => {
        this.validationResult = result;
        this.isValidationInProgress = false;
        this.showValidationResults(result);
        
        // Update dataset validation status
        if (this.dataset) {
          this.dataset.isValidated = result.status === 'success';
          this.dataset.validationStatus = result.status;
          this.dataset.validationErrors = result.errorCount;
        }
      },
      error: (error) => {
        console.error('Error validating dataset:', error);
        this.isValidationInProgress = false;
        this.validationError = error.message || 'Failed to validate dataset';
        this.toastService.presentToast('error', this.validationError, 4000);
      }
    });
  }

  /**
   * Shows validation results in a modal
   */
  async showValidationResults(validationResult: ValidationResponse): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ValidationResultsModalComponent,
      componentProps: {
        validationResult
      },
      cssClass: 'validation-results-modal'
    });

    await modal.present();
  }

  /**
   * Downloads the dataset in the specified format
   * @param format The format to download (csv, json, etc.)
   */
  downloadDataset(format: string = 'csv'): void {
    if (!this.datasetId) {
      this.toastService.presentToast('error', 'No dataset selected', 3000);
      return;
    }

    const filename = `${this.dataset?.datasetName || 'dataset'}.${format}`;
    
    this.datasetService.downloadDataset(this.datasetId, format).subscribe({
      next: (blob) => {
        this.datasetService.downloadFile(blob, filename);
        this.toastService.presentToast('success', `Dataset downloaded as ${filename}`, 3000);
      },
      error: (error) => {
        console.error('Error downloading dataset:', error);
        this.toastService.presentToast('error', 'Failed to download dataset', 3000);
      }
    });
  }

  /**
   * Splits the dataset into training and testing sets
   * @param trainRatio Percentage of data to use for training (default: 80%)
   */
  splitDataset(trainRatio: number = 80): void {
    if (!this.datasetId) {
      this.toastService.presentToast('error', 'No dataset selected', 3000);
      return;
    }

    this.datasetService.splitDataset(this.datasetId, trainRatio, 100 - trainRatio).subscribe({
      next: (result) => {
        this.toastService.presentToast('success', 'Dataset split successfully', 3000);
        console.log('Dataset split result:', result);
        
        // Update UI or show split results
        if (this.dataset) {
          this.dataset.splitStatus = 'complete';
        }
      },
      error: (error) => {
        console.error('Error splitting dataset:', error);
        this.toastService.presentToast('error', 'Failed to split dataset', 3000);
      }
    });
  }

  /**
   * Gets the validation status badge class
   */
  getValidationBadgeClass(): string {
    if (!this.validationResult) return 'medium';
    
    switch (this.validationResult.status) {
      case 'success':
        return 'success';
      case 'error':
      case 'failed':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Loads dataset information and its content
   * @param datasetId The ID of the dataset to load
   */
  private loadDatasetInfo(datasetId: string): void {
    console.log('🚀 Loading dataset info for ID:', datasetId);
    this.isLoading = true;
    this.previewError = null;
    this.previewReady = false;

    // Reset dataset state
    this.dataset = null;
    this.previewData = {
      headers: [],
      data: [],
      schema: [],
      totalRows: 0
    };

    // Load dataset metadata first
    this.datasetService.getDatasetById(datasetId).subscribe({
      next: (dataset) => {
        console.log('✅ Dataset metadata loaded:', dataset);
        this.dataset = dataset;
        this.datasetId = dataset.datasetId;
        
        // Then try to load the preview content
        this.loadDatasetPreview(datasetId);
      },
      error: (error) => {
        console.error('❌ Error loading dataset metadata:', error);
        this.handleDatasetError('Failed to load dataset information', error);
      }
    });
  }

/**
* Splits the dataset into training and testing sets
* @param trainRatio Percentage of data to use for training (default: 80%)
*/
splitDataset(trainRatio: number = 80): void {
if (!this.datasetId) {
this.toastService.presentToast('error', 'No dataset selected', 3000);
return;
}

this.datasetService.splitDataset(this.datasetId, trainRatio, 100 - trainRatio).subscribe({
next: (result) => {
this.toastService.presentToast('success', 'Dataset split successfully', 3000);
console.log('Dataset split result:', result);
  /**
   * Loads the full dataset as a fallback when preview is not available
   * @param datasetId The ID of the dataset to load
   */
  private loadFullDatasetAsFallback(datasetId: string): void {
    console.log('🔍 Loading full dataset as fallback for ID:', datasetId);
    
    this.datasetService.getFullDataset(datasetId).subscribe({
      next: (fullContentResponse) => {
        console.log('✅ Loaded full dataset as fallback');
        this.handleDatasetContentResponse(fullContentResponse);
        
        // Show info toast that we're showing full dataset instead of preview
        this.toastService.presentToast(
          'info',
          'Showing full dataset (preview not available)',
          3000
        );
      },
      error: (fullDatasetError) => {
        console.error('❌ Error loading full dataset:', fullDatasetError);
        this.handleDatasetError('Failed to load dataset content', fullDatasetError);
      }
    });
  }

  /**
   * Handles dataset loading errors consistently
   * @param defaultMessage Default error message to show
   * @param error The error object
   */
  private handleDatasetError(defaultMessage: string, error: any): void {
    const errorMessage = error?.message || defaultMessage;
    console.error('❌ Dataset error:', errorMessage, error);
    
    this.previewError = errorMessage;
    this.previewReady = false;
    this.isLoading = false;
    
    // Show error toast to the user
    this.toastService.presentToast('error', errorMessage, 5000);
    
    // If we have a 404 or similar, navigate back to the datasets list
    if (error?.status === 404) {
      setTimeout(() => {
        this.router.navigate(['/datasets']);
      }, 2000);
    }
  }

  /**
   * Processes the full dataset content from the API
   * @param content The full dataset content as a string (CSV format)
   */
  private processFullDatasetContent(content: string): void {
    try {
      console.log('Processing full dataset content, length:', content?.length);
      
      if (!content) {
        throw new Error('No content provided');
      }

      // Normalize line endings and split into lines
      const lines = content
        .replace(/\r\n/g, '\n')  // Convert Windows line endings
        .replace(/\r/g, '\n')     // Convert old Mac line endings
        .split('\n')
        .filter(line => line.trim() !== '');

      if (lines.length === 0) {
        throw new Error('Empty dataset content');
      }

      // Parse headers - handle quoted CSV values
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            // Toggle inQuotes flag when we hit a quote
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            // Only split on commas not inside quotes
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add the last field
        if (current !== '' || line.endsWith(',')) {
          result.push(current.trim());
        }
        
        return result;
      };

      // Extract headers from first line
      const headers = parseCsvLine(lines[0]);
      
      if (headers.length === 0) {
        throw new Error('Could not parse CSV headers');
      }
      
      console.log(`Parsed ${headers.length} headers:`, headers);
      
      // Parse data rows
      const data = [];
      let rowNumber = 1;
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCsvLine(lines[i]);
          
          // Skip rows that don't match header count (likely malformed)
          if (values.length !== headers.length) {
            console.warn(`Skipping row ${i+1} - expected ${headers.length} columns, got ${values.length}`);
            continue;
          }
          
          const row: Record<string, any> = { rowNumber: rowNumber++ };
          headers.forEach((header, index) => {
            // Clean up the value and handle empty strings
            let value = values[index]?.trim() || '';
            
            // Keep all values as strings for consistency in the UI
            // The schema will handle type information for display and validation
            value = value.toString();
            
            row[header] = value;
          });
          
          data.push(row);
          
          // Limit the number of rows we process for performance
          if (data.length >= 1000) {
            console.log(`Processed maximum of ${data.length} rows, truncating the rest`);
            break;
          }
        } catch (rowError) {
          console.error(`Error parsing row ${i+1}:`, rowError);
          // Continue with next row
        }
      }

      if (data.length === 0) {
        throw new Error('No valid data rows found in the dataset');
      }

      // Update component state
      this.previewHeaders = headers;
      this.previewRows = data;
      this.previewReady = true;
      this.previewError = null;
      
      this.previewData = {
        headers,
        data,
        schema: [],
        totalRows: data.length,
        isMetadataFallback: true
      };

      console.log(`Processed ${data.length} rows of data`);
      
      // Try to infer schema from the data
      if (data.length > 0) {
        this.inferSchemaFromPreviewData();
      }
      
    } catch (error) {
      console.error('❌ Error processing full dataset content:', error);
      this.previewError = error instanceof Error ? error.message : 'Failed to process dataset content';
      this.previewReady = false;
      
      // Show error to user
      this.toastService.presentToast(
        'error', 
        `Error loading dataset: ${error instanceof Error ? error.message : 'Unknown error'}`,
        5000
      );
    } finally {
      this.isLoading = false;
    }
  }

  private handleDatasetContentResponse(response: any): void {
    try {
      console.log('Processing dataset content response:', response);
      
      // Check if response is valid
      if (!response) {
        throw new Error('No response received from server');
      }

      // Check if we have a direct content property (from getFullDataset)
      if (response.content && typeof response.content === 'string') {
        this.processFullDatasetContent(response.content);
        return;
      }

      // Handle different response formats
      if (Array.isArray(response)) {
        // Handle array response (list of rows)
        if (response.length === 0) {
          throw new Error('Dataset is empty');
        }
        
        // Extract headers from first row if it's an array of objects
        if (typeof response[0] === 'object' && response[0] !== null) {
          this.previewHeaders = Object.keys(response[0]);
          this.previewRows = response;
        } else {
          // Handle array of arrays
          this.previewHeaders = response[0] || [];
          this.previewRows = response.slice(1);
        }
      } 
      // Handle preview response with Preview object
      else if (response.Preview || response.preview) {
        const preview = response.Preview || response.preview;
        const headers = preview.Headers || preview.headers || [];
        const dataRows = preview.Data || preview.data || [];
        
        this.previewHeaders = headers;
        this.previewRows = dataRows.map((row: any) => row.Data || row.data || row);
      }
      // Handle response with direct data and headers
      else if (response.headers && response.data) {
        this.previewHeaders = Array.isArray(response.headers) ? response.headers : [];
        this.previewRows = Array.isArray(response.data) ? response.data : [];
      }
      // Handle unknown format
      else {
        console.warn('Unexpected response format, trying to parse as CSV', response);
        if (typeof response === 'string') {
          this.processFullDatasetContent(response);
          return;
        }
        throw new Error('Unsupported dataset format');
      }
      
      // Update the component state
      this.previewReady = true;
      this.previewError = null;
      
      // Update previewData for the UI
      const data = this.previewRows.map((rowData: Record<string, any>, index: number) => ({
        ...rowData,
        rowNumber: index + 1
      }));
      
      this.previewData = {
        headers: this.previewHeaders,
        data,
        schema: [],
        totalRows: data.length,
        isMetadataFallback: false
      };
      
      // If we have data, try to load the schema
      if (data.length > 0) {
        this.loadSchema();
      } else {
        this.previewError = 'No data available for preview';
      }
      
      this.isLoading = false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process dataset preview';
      this.previewError = errorMessage;
      this.previewReady = false;
      this.isLoading = false;
      console.error('Error in handleDatasetContentResponse:', error);
      
      // Update the UI to show the error
      this.previewData = {
        headers: ['Error'],
        data: [{
          rowNumber: 1,
          Error: errorMessage
        }],
        schema: [{
          name: 'Error',
          type: 'string',
          nullable: false,
          sampleValues: [errorMessage]
        }],
        totalRows: 1,
        isMetadataFallback: false
      };
    }
  }

  private loadSchema(): void {
    if (!this.datasetId) {
      console.warn('No dataset ID available for schema loading');
      this.inferSchemaFromPreviewData();
      return;
    }

    this.datasetOps.getDatasetSchema(this.datasetId).subscribe({
      next: (schemaResponse: any) => {
        try {
          if (!schemaResponse || !Array.isArray(schemaResponse)) {
            throw new Error('Invalid schema response format');
          }

          this.previewData.schema = schemaResponse.map((field: any) => ({
            name: field.name || 'unknown',
            type: field.type || 'string',
            nullable: field.nullable !== false,
            sampleValues: field.sampleValues || []
          }));

          if (this.previewData.data.length > 0) {
            this.updateSampleValuesFromPreviewData();
          }
        } catch (error) {
          console.warn('Error processing schema, falling back to inference', error);
          this.inferSchemaFromPreviewData();
        }
      },
      error: (error) => {
        console.warn('Error loading schema, falling back to inference', error);
        this.inferSchemaFromPreviewData();
      }
    });
  }

  private inferSchemaFromPreviewData(): void {
    if (!this.previewData.data.length) {
      console.warn('No preview data available for schema inference');
      return;
    }

    const sampleRow = this.previewData.data[0];
    const headers = Object.keys(sampleRow).filter(key => key !== 'rowNumber');

    this.previewData.schema = headers.map(header => {
      const sampleValues = this.previewData.data
        .slice(0, 10)
        .map(row => row[header])
        .filter(val => val !== undefined && val !== null && val !== '');

      let type = 'string';
      if (sampleValues.length > 0) {
        const firstValue = sampleValues[0];
        if (!isNaN(Number(firstValue))) {
          type = 'number';
        } else if (firstValue.toLowerCase?.() === 'true' || firstValue.toLowerCase?.() === 'false') {
          type = 'boolean';
        } else if (!isNaN(Date.parse(firstValue))) {
          type = 'date';
        }
      }

      return {
        name: header,
        type,
        nullable: sampleValues.length < 10,
        sampleValues: Array.from(new Set(sampleValues)).slice(0, 5)
      };
    });
  }

  private updateSampleValuesFromPreviewData(): void {
    if (!this.previewData.schema.length || !this.previewData.data.length) return;

    this.previewData.schema = this.previewData.schema.map(field => {
      const sampleValues = this.getDistinctValues(field.name, 5);
      return {
        ...field,
        sampleValues: sampleValues.length > 0 ? sampleValues : field.sampleValues
      };
    });
  }

  private getDistinctValues(column: string, maxSamples: number = 5): any[] {
    const uniqueValues = new Set<any>();
    for (const row of this.previewData.data) {
      if (row[column] !== undefined && row[column] !== null && row[column] !== '') {
        uniqueValues.add(row[column]);
        if (uniqueValues.size >= maxSamples) break;
      }
    }
    return Array.from(uniqueValues);
  }

  getCellValue(row: any, header: string): string {
    return row[header] ?? '';
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo;
  }

  onSegmentChange(event: any): void {
    const tab = event.detail?.value;
    if (tab === 'preview' || tab === 'schema' || tab === 'operations') {
      this.activeTab = tab;
    }
  }

  setActiveTab(tab: 'preview' | 'schema' | 'operations'): void {
    this.activeTab = tab;
  }
}
