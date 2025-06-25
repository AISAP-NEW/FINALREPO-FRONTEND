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
import { ActivatedRoute } from '@angular/router';
import { DatasetOperationsService } from '../../services/dataset-operations.service';
import { DatasetService, Dataset } from '../../services/dataset.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { finalize } from 'rxjs/operators';
import { ToastService } from '../../services/toast.service';
import { ToastController, IonicModule } from '@ionic/angular';

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
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
    SafeHtmlPipe,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle,
    IonContent, IonList, IonItem, IonLabel, IonSpinner, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText,
    IonNote, IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton,
    IonBackButton, IonAccordionGroup, IonAccordion
  ]
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
  activeTab: 'preview' | 'schema' | 'operations' = 'preview';
  isProcessing = false;
  processingError: string | null = null;
  preprocessResults: PreprocessResult | null = null;
  preprocessForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private datasetOps: DatasetOperationsService,
    private datasetService: DatasetService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.preprocessForm = this.fb.group({
      handleMissingValues: [true],
      removeDuplicates: [true],
      fixDataTypes: [true],
      scalingMethod: ['none']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDatasetInfo(id);
    } else {
      this.isLoading = false;
      this.toastService.presentToast('error', 'No dataset ID provided', 3000);
    }
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

  // Private method that handles the actual dataset loading
  loadDatasetInfo(datasetId: string): void {
    if (!datasetId) {
      console.error('No dataset ID provided');
      return;
    }

    this.isLoading = true;
    this.datasetService.getDatasetById(datasetId).subscribe({
      next: (dataset) => {
        console.log('Dataset info loaded:', dataset);
        this.dataset = dataset;
        this.datasetId = dataset.datasetId;
        
        // First try to load the preview content
        this.datasetService.getDatasetContent(datasetId).subscribe({
          next: (contentResponse) => {
            console.log('Dataset preview content loaded');
            this.handleDatasetContentResponse(contentResponse);
            this.isLoading = false;
          },
          error: (previewError) => {
            console.warn('Preview not available, falling back to full dataset...', previewError);
            
            // If preview fails, try to load the full dataset
            this.datasetService.getFullDataset(datasetId).subscribe({
              next: (fullContentResponse) => {
                console.log('Loaded full dataset as fallback');
                this.handleDatasetContentResponse(fullContentResponse);
                this.isLoading = false;
                
                // Show info toast that we're showing full dataset instead of preview
                this.toastService.presentToast(
                  'info',
                  'Showing full dataset (preview not available)',
                  3000
                );
              },
              error: (fullDatasetError) => {
                console.error('Error loading full dataset:', fullDatasetError);
                this.previewError = fullDatasetError.message || 'Failed to load dataset';
                this.previewReady = false;
                this.isLoading = false;
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading dataset info:', error);
        this.previewError = error.message || 'Failed to load dataset info';
        this.previewReady = false;
        this.isLoading = false;
      }
    });
  }

  private handleDatasetContentResponse(response: any): void {
    try {
      console.log('🚨 RAW response from API:', response);
      
      // Check if response is valid
      if (!response) {
        throw new Error('No response received from server');
      }
      
      const preview = response?.Preview;
      const datasetInfo = response?.DatasetInfo;
      
      // Check if we have the expected preview structure
      if (!preview?.Headers || !preview?.Data) {
        throw new Error(`Dataset preview is not available. File: ${datasetInfo?.DatasetName || 'unknown'}`);
      }
      
      // Update the component state with the preview data
      this.previewHeaders = preview.Headers;
      this.previewRows = preview.Data.map((row: any) => row.Data);
      this.previewReady = true;
      this.previewError = null;
      
      // Also update the previewData for backward compatibility
      const headers = this.previewHeaders;
      const data = this.previewRows.map((rowData: Record<string, any>, index: number) => ({
        ...rowData,
        rowNumber: index + 1
      }));
      
      this.previewData = {
        headers,
        data,
        schema: [],
        totalRows: data.length,
        isMetadataFallback: false
      };
      
      // If we have data, try to load the schema
      if (data.length > 0) {
        this.loadSchema();
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
