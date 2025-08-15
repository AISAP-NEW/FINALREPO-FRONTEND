import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatasetOperationsService } from '../../services/dataset-operations.service';
import { DatasetService } from '../../services/dataset.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { IonCardSubtitle, IonChip } from '@ionic/angular/standalone';
import { Pipe, PipeTransform } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { FeatureTargetProcessingService, ProcessingOptions } from '../../services/feature-target-processing.service';
@Pipe({name: 'truncate'})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 15): string {
    return value && value.length > limit ? value.slice(0, limit) + '...' : value;
  }
}
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle,
  IonContent, IonList, IonItem, IonLabel, IonSpinner, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonBadge, IonText, IonNote, IonGrid,
  IonRow, IonCol, IonAccordionGroup, IonAccordion, IonInput, IonSegment, IonSegmentButton, IonBackButton,
  IonToggle, IonSelect, IonSelectOption
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
}

@Component({
  selector: 'app-dataset-details',
  templateUrl: './dataset-details.page.html',
  styleUrls: ['./dataset-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,

    IonCardSubtitle,
    IonChip,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle,
    IonContent, IonItem, IonLabel, IonSpinner, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonText, IonGrid,
    IonRow, IonCol, IonAccordionGroup, IonAccordion,
    IonInput, IonSegment, IonSegmentButton, IonBackButton,
    IonToggle, IonSelect, IonSelectOption
  ]
})
export class DatasetDetailsPage implements OnInit {
  datasetInfo: any = null; // Holds dataset metadata for template
  splitRatios = [
    { label: '70-30', train: 70, test: 30 },
    { label: '80-20', train: 80, test: 20 },
    { label: '90-10', train: 90, test: 10 }
  ];
  selectedRatio = this.splitRatios[1]; // Default to 80-20
  datasetId: string | null = null;
  isLoading = true;
  error: string | null = null;
  datasetPreview: any[] = [];
  columnNames: string[] = [];
  datasetName = '';
  showDebugInfo = false;
  activeTab: 'preview' | 'schema' | 'operations' = 'preview';
  previewRowsToShow = 5;
  previewData: PreviewData = { headers: [], data: [], schema: [], totalRows: 0 };
  previewHeaders: string[] = [];
  previewRows: any[] = [];
  previewPagination: any = null;

  // --- Pagination properties for preview table ---
  public pagedPreviewRows: any[] = [];
  public previewPage: number = 1;
  public totalPreviewPages: number = 1;

  /**
   * Fetch paginated preview data for the dataset
   */
  public fetchPaginatedPreview(page: number = 1, pageSize: number = this.previewRowsToShow): void {
    if (!this.datasetId) return;
    this.isLoading = true;
    this.datasetService.readDatasetPaginated(this.datasetId, page, pageSize).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: any) => {
        this.previewData.headers = response.Headers || [];
        this.pagedPreviewRows = (response.Data || []).map((row: any) => row.Data);
        this.previewData.totalRows = response.Pagination?.TotalRows || this.pagedPreviewRows.length;
        this.previewPage = response.Pagination?.CurrentPage || 1;
        this.totalPreviewPages = response.Pagination?.TotalPages || 1;
      },
      error: (err: any) => {
        this.pagedPreviewRows = [];
        this.previewData.headers = [];
        this.previewData.totalRows = 0;
        this.previewPage = 1;
        this.totalPreviewPages = 1;
        this.error = 'Failed to load preview: ' + (err?.message || err);
      }
    });
  }

  /**
   * Change the preview page (for pagination controls)
   */
  public changePreviewPage(page: number): void {
    if (!this.datasetId) return;
    if (page >= 1 && page <= this.totalPreviewPages) {
      this.fetchPaginatedPreview(page, this.previewRowsToShow);
    }
  }

  fetchJsonPreview(page: number = 1, pageSize: number = 50): void {
    if (!this.datasetId) return;
    this.isLoading = true;
    this.http.get<any>(`http://localhost:5183/api/Dataset/read/${this.datasetId}?page=${page}&pageSize=${pageSize}&sortOrder=asc`).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: any) => {
        this.previewHeaders = response.Headers || [];
        this.previewRows = (response.Data || []).map((row: any) => row.Data);
        this.previewPagination = response.Pagination || null;
      },
      error: (err: any) => {
        this.previewHeaders = [];
        this.previewRows = [];
        this.previewPagination = null;
        this.error = 'Failed to load preview: ' + (err?.message || err);
      }
    });
  }

  constructor(
    private route: ActivatedRoute,
    private datasetOps: DatasetOperationsService,
    private datasetService: DatasetService,
    private http: HttpClient,
    private toastService: ToastService,
    private ftService: FeatureTargetProcessingService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.datasetId = params['id'];
      if (this.datasetId) {
        this.loadDatasetInfo();
        this.fetchJsonPreview();
        this.loadSchema();
        this.refreshSelectedColumns(); // Load column roles on init
      }
    });
  }

  get hasPreviewData(): boolean {
    return this.previewData.data.length > 0;
  }

  get previewRowCount(): number {
    return this.previewData.data.length;
  }

  // Check if processing pipeline can be run
  get canRunPipeline(): boolean {
    return !!(this.selectedColumns?.target && this.selectedColumns?.features?.length);
  }

  // Check if there are processing results to show
  get hasProcessingResults(): boolean {
    return !!(this.summary.qualityScore || this.summary.rowsProcessed || this.summary.splitRatio);
  }

  // Helper methods for the enhanced UI
  getStepIcon(step: string): string {
    switch (step) {
      case 'validation': return 'checkmark-circle-outline';
      case 'preprocess': return 'settings-outline';
      case 'split': return 'git-branch-outline';
      default: return 'help-circle-outline';
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-not-started';
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-in-progress';
      case 'Failed': return 'status-failed';
      default: return 'status-not-started';
    }
  }

  getStepButtonText(step: string): string {
    const status = this.status[step as keyof typeof this.status];
    if (status === 'Completed') return 'Re-run';
    if (status === 'In Progress') return 'Running...';
    if (status === 'Failed') return 'Retry';
    return 'Run';
  }

  // Show results modal
  showResultsModal(): void {
    // TODO: Implement results modal
    this.toastService.showInfo('Results modal coming soon!');
  }

  get totalRowCount(): number {
    return this.previewData.totalRows;
  }

  loadDatasetInfo(): void {
    if (!this.datasetId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.previewData = { headers: [], data: [], schema: [], totalRows: 0 };

    this.datasetService.getDatasetContent(this.datasetId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          try {
            if (!response || !response.content) {
              throw new Error('No content received in the response');
            }

            const lines = response.content.split('\n').filter((line: string) => line.trim() !== '');
            if (lines.length === 0) {
              throw new Error('Empty dataset content');
            }

            const headers = this.parseCsvLine(lines[0]);
            const data: Record<string, any>[] = [];
            for (let i = 1; i < Math.min(lines.length, this.previewRowsToShow + 1); i++) {
              if (lines[i].trim() === '') continue;
              const rowData = this.parseCsvLine(lines[i]);
              const row: Record<string, any> = { rowNumber: i };
              headers.forEach((header, index) => {
                row[header] = index < rowData.length ? rowData[index] : '';
              });
              data.push(row);
            }

            this.previewData = {
              headers,
              data,
              schema: [],
              totalRows: lines.length - 1
            };

            this.loadSchema();
          } catch (error) {
            this.handlePreviewError(error);
          }
        },
        error: (error) => {
          this.handlePreviewError(error);
        }
      });
  }

  private loadSchema(): void {
    if (!this.datasetId) {
      this.inferSchemaFromPreviewData();
      return;
    }

    this.datasetOps.getDatasetSchema(this.datasetId).subscribe({
      next: (schemaResponse: any) => {
        try {
          let fields: any[] = [];

          // Handle multiple possible backend shapes
          if (Array.isArray(schemaResponse)) {
            fields = schemaResponse;
          } else if (schemaResponse?.schema && Array.isArray(schemaResponse.schema)) {
            fields = schemaResponse.schema;
          } else if (schemaResponse?.Columns && Array.isArray(schemaResponse.Columns)) {
            // Newer enriched schema shape
            fields = schemaResponse.Columns.map((c: any) => ({
              name: c.Name || c.name,
              type: c.DataType || c.Type || 'string',
              nullable: c.IsRequired !== true,
              sampleValues: c.SampleValues || c.Sample || []
            }));
          }

          if (!Array.isArray(fields) || fields.length === 0) {
            throw new Error('Invalid schema response format');
          }

          // Normalize to previewData.schema shape
          this.previewData.schema = fields.map((field: any) => ({
            name: field.name || field.columnName || 'unknown',
            type: field.type || field.dataType || 'string',
            nullable: field.nullable !== false && field.isRequired !== true,
            sampleValues: field.sampleValues || field.samples || []
          }));

          if (this.previewData.data.length > 0) {
            this.updateSampleValuesFromPreviewData();
          }
        } catch (error) {
          this.inferSchemaFromPreviewData();
        }
      },
      error: () => {
        this.inferSchemaFromPreviewData();
      }
    });
  }

  private inferSchemaFromPreviewData(): void {
    if (!this.previewData.data.length) return;

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
        } else if (['true', 'false'].includes(String(firstValue).toLowerCase())) {
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

  private getDistinctValues(column: string, maxSamples = 5): any[] {
    const uniqueValues = new Set<any>();
    for (const row of this.previewData.data) {
      if (row[column] !== undefined && row[column] !== null && row[column] !== '') {
        uniqueValues.add(row[column]);
        if (uniqueValues.size >= maxSamples) break;
      }
    }
    return Array.from(uniqueValues);
  }

  private handlePreviewError(error: any): void {
    this.previewData = { headers: [], data: [], schema: [], totalRows: 0 };
    this.isLoading = false;
  }

  getCellValue(row: any, header: string): any {
    return row[header] !== undefined ? row[header] : '';
  }

  formatCellValue(value: any): string {
    return value === undefined || value === null || value === '' ? '—' : String(value);
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let inQuotes = false;
    let currentField = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    result.push(currentField.trim());
    return result;
}

  schemaInfo: any = null;
  schemaOverview: any = null;
  schemaColumns: any[] = [];

  fetchSchemaInfo(): void {
    if (!this.datasetId) return;
    this.isLoading = true;
    this.http.get<any>(`http://localhost:5183/api/Dataset/${this.datasetId}/schema`).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: any) => {
        this.schemaInfo = response.DatasetInfo || null;
        this.schemaOverview = response.SchemaOverview || null;
        this.schemaColumns = response.Columns || [];
      },
      error: (err: any) => {
        this.schemaInfo = null;
        this.schemaOverview = null;
        this.schemaColumns = [];
        this.error = 'Failed to load schema: ' + (err?.message || err);
      }
    });
  }

onSegmentChange(event: any): void {
  const tab = event.detail.value;
  if (tab === 'preview' || tab === 'schema' || tab === 'operations') {
    this.activeTab = tab;
    if (tab === 'schema') {
      this.fetchSchemaInfo();
    }
  } else {
    this.activeTab = 'preview';
  }
}

splitTrain: number = 70;
splitTest: number = 30;
latestSplitResult: any = null;

splitDataset(train?: number, test?: number): void {
    this.error = null;
    if (!this.datasetId) {
      this.error = 'No dataset ID found.';
      return;
    }
    const trainVal = train ?? this.splitTrain;
    const testVal = test ?? this.splitTest;
    if (trainVal + testVal !== 100) {
      this.error = 'Train and Test percentages must add up to 100.';
      return;
    }
    this.isLoading = true;
    // POST split
    const payload = {
      DatasetVersionId: this.datasetInfo?.versionId || this.datasetInfo?.VersionId,
      TrainRatio: trainVal,
      TestRatio: testVal
    };
    this.http.post<any>(`http://localhost:5183/api/Dataset/train-split/${this.datasetId}`, payload)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (result) => {
          this.latestSplitResult = result;
          // Add a synthetic row to previewData to show split results
          const splitRow = Object.assign(
            {},
            ...this.previewData.headers.map(h => ({ [h]: '' })),
            { SplitSummary: `Train: ${result.TrainCount} (${result.TrainPercentage}%) | Test: ${result.TestCount} (${result.TestPercentage}%)` }
          );
          // Remove any previous split summary row
          this.previewData.data = this.previewData.data.filter(row => !row['SplitSummary']);
          this.previewData.data.push(splitRow);
          if (!this.previewData.headers.includes('SplitSummary')) {
            this.previewData.headers.push('SplitSummary');
          }
        },
        error: (err) => {
          this.error = 'Split failed: ' + (err?.message || err);
        }
      });
  }

  // ===== Feature/Target processing (subset) =====
  selectedColumns: { target: string; features: string[] } | null = null;
  subsetPreview: { headers: string[]; rows: any[] } = { headers: [], rows: [] };
  status: { validation?: string; preprocess?: string; split?: string } = {};
  processing = false;
  summary: { rowsProcessed?: number; splitRatio?: string; qualityScore?: number } = {};

  refreshSelectedColumns(): void {
    if (!this.datasetId) return;
    
    // Call the new backend endpoint to retrieve current column roles
    this.http.get<any>(`http://localhost:5183/api/Dataset/${this.datasetId}/column-roles`).subscribe({
      next: (response: any) => {
        console.log('Column roles response:', response);
        
        if (response?.hasColumnRoles) {
          // Backend indicates roles are set, use the response data
          this.selectedColumns = {
            target: response.targetColumn || response.target,
            features: response.featureColumns || response.features || []
          };
          
          // Load subset preview with the selected columns
          this.loadSubsetPreview();
          
          // Show success message
          this.toastService.showSuccess('Column roles loaded successfully');
        } else {
          // No roles set yet
          this.selectedColumns = null;
          this.subsetPreview = { headers: [], rows: [] };
          console.log('No column roles set for this dataset');
        }
      },
      error: (error) => {
        console.error('Error loading column roles:', error);
        this.selectedColumns = null;
        this.subsetPreview = { headers: [], rows: [] };
        
        // Show user-friendly error message
        if (error.status === 404) {
          this.toastService.showWarning('No column roles found for this dataset');
        } else {
          this.toastService.showError('Failed to load column roles: ' + (error?.message || 'Unknown error'));
        }
      }
    });
  }

  // Method to manually set column roles (for testing or manual override)
  setColumnRoles(target: string, features: string[]): void {
    if (!this.datasetId) return;
    
    const payload = {
      target: target,
      features: features
    };
    
    this.datasetService.saveColumnRoles(this.datasetId, payload).subscribe({
      next: (response) => {
        console.log('Column roles saved:', response);
        this.toastService.showSuccess('Column roles saved successfully');
        // Refresh to load the new roles
        this.refreshSelectedColumns();
      },
      error: (error) => {
        console.error('Error saving column roles:', error);
        this.toastService.showError('Failed to save column roles: ' + (error?.message || 'Unknown error'));
      }
    });
  }

  // Method to auto-detect column roles
  autoDetectColumnRoles(): void {
    if (!this.datasetId) return;
    
    this.toastService.showInfo('Auto-detecting column roles...');
    
    this.datasetService.autoDetectColumnRoles(this.datasetId).subscribe({
      next: (response) => {
        console.log('Auto-detected column roles:', response);
        this.toastService.showSuccess('Column roles auto-detected successfully');
        // Refresh to load the new roles
        this.refreshSelectedColumns();
      },
      error: (error) => {
        console.error('Error auto-detecting column roles:', error);
        this.toastService.showError('Failed to auto-detect column roles: ' + (error?.message || 'Unknown error'));
      }
    });
  }

  private loadSubsetPreview(): void {
    if (!this.datasetId || !this.selectedColumns) return;
    // Build subset headers: features + target
    const headers = [...(this.selectedColumns.features || [])];
    if (this.selectedColumns.target) headers.push(this.selectedColumns.target);
    if (!headers.length) { this.subsetPreview = { headers: [], rows: [] }; return; }
    // Use existing json preview and project columns
    const pageSize = 10;
    this.fetchJsonPreview(1, pageSize);
    setTimeout(() => {
      if (!this.previewRows || !this.previewRows.length) return;
      const rows = this.previewRows.slice(0, pageSize).map(r => {
        const obj: any = {};
        headers.forEach(h => obj[h] = r[h]);
        return obj;
      });
      this.subsetPreview = { headers, rows };
    }, 300);
  }

  private mark(statusKey: 'validation'|'preprocess'|'split', value: string) { this.status = { ...this.status, [statusKey]: value }; }

  runValidation(): void {
    if (!this.datasetId || !this.selectedColumns?.target || !this.selectedColumns?.features?.length) {
      this.toastService.showWarning('Please select target and feature columns first');
      return;
    }
    
    const targetColumn = this.selectedColumns.target;
    const featureColumns = this.selectedColumns.features;
    
    if (!targetColumn || !featureColumns.length) {
      this.toastService.showWarning('Invalid column selection');
      return;
    }
    
    this.processing = true; this.mark('validation','In Progress');
    this.ftService.validate(this.datasetId, targetColumn, featureColumns)
      .pipe(finalize(() => this.processing = false))
      .subscribe({
        next: (res: any) => { 
          this.mark('validation','Completed'); 
          this.summary.qualityScore = res?.QualityScore || res?.qualityScore;
          this.toastService.showSuccess(`Validation completed! Quality score: ${res?.QualityScore || 'N/A'}`);
        },
        error: (err) => { 
          this.mark('validation','Failed'); 
          this.toastService.showError('Validation failed: ' + (err?.error?.message || 'Unknown error'));
        }
      });
  }

  runPreprocess(): void {
    if (!this.datasetId || !this.selectedColumns?.target || !this.selectedColumns?.features?.length) {
      this.toastService.showWarning('Please select target and feature columns first');
      return;
    }
    
    const targetColumn = this.selectedColumns.target;
    const featureColumns = this.selectedColumns.features;
    
    if (!targetColumn || !featureColumns.length) {
      this.toastService.showWarning('Invalid column selection');
      return;
    }
    
    this.processing = true; this.mark('preprocess','In Progress');
    const opts: ProcessingOptions = { handleMissingValues: true, removeDuplicates: true, fixDataTypes: true, scalingMethod: 'standard' };
    this.ftService.preprocess(this.datasetId, targetColumn, featureColumns, opts)
      .pipe(finalize(() => this.processing = false))
      .subscribe({
        next: (res: any) => { 
          this.mark('preprocess','Completed'); 
          this.summary.rowsProcessed = res?.ProcessedRowCount || res?.processedRowCount;
          this.toastService.showSuccess(`Preprocessing completed! Processed ${res?.ProcessedRowCount || 'N/A'} rows`);
        },
        error: (err) => { 
          this.mark('preprocess','Failed'); 
          this.toastService.showError('Preprocessing failed: ' + (err?.error?.message || 'Unknown error'));
        }
      });
  }

  runSplit(): void {
    if (!this.datasetId || !this.selectedColumns?.target || !this.selectedColumns?.features?.length) {
      this.toastService.showWarning('Please select target and feature columns first');
      return;
    }
    
    const targetColumn = this.selectedColumns.target;
    const featureColumns = this.selectedColumns.features;
    
    if (!targetColumn || !featureColumns.length) {
      this.toastService.showWarning('Invalid column selection');
      return;
    }
    
    this.processing = true; this.mark('split','In Progress');
    const opts: ProcessingOptions = { trainRatio: this.splitTrain, testRatio: this.splitTest, randomSeed: 42, stratify: true };
    this.ftService.split(this.datasetId, targetColumn, featureColumns, opts)
      .pipe(finalize(() => this.processing = false))
      .subscribe({
        next: (res: any) => { 
          this.mark('split','Completed'); 
          this.summary.splitRatio = res?.SplitRatio || `${this.splitTrain}:${this.splitTest}`;
          this.toastService.showSuccess(`Split completed! ${res?.TrainingRowCount || 'N/A'} train, ${res?.TestRowCount || 'N/A'} test`);
        },
        error: (err) => { 
          this.mark('split','Failed'); 
          this.toastService.showError('Split failed: ' + (err?.error?.message || 'Unknown error'));
        }
      });
  }

  runAll(): void {
    if (!this.datasetId || !this.selectedColumns?.target || !this.selectedColumns?.features?.length) {
      this.toastService.showWarning('Please select target and feature columns first');
      return;
    }
    
    // Ensure we have valid values with proper typing
    const targetColumn = this.selectedColumns.target;
    const featureColumns = this.selectedColumns.features;
    
    if (!targetColumn || !featureColumns || !featureColumns.length) {
      this.toastService.showWarning('Invalid column selection');
      return;
    }
    
    // Explicit type guard to ensure TypeScript knows these are non-null
    if (typeof targetColumn !== 'string' || !Array.isArray(featureColumns)) {
      this.toastService.showWarning('Invalid column types');
      return;
    }
    
    // Use a proper null check before the call
    if (!targetColumn || !featureColumns || !featureColumns.length) {
      this.toastService.showWarning('Please select target and feature columns.');
      return;
    }

    // TypeScript type narrowing should work after the null check
    // But if it doesn't, we'll use explicit type assertion
    const targetCol = targetColumn as string;
    const featureCols = featureColumns as string[];
    
    this.processing = true;
    const opts: ProcessingOptions = { handleMissingValues: true, removeDuplicates: true, fixDataTypes: true, scalingMethod: 'standard', trainRatio: this.splitTrain, testRatio: this.splitTest, randomSeed: 42, stratify: true };
    
    // Chain the operations since we don't have a single processAll endpoint
    this.ftService.validate(this.datasetId, targetCol, featureCols).subscribe({
      next: (valRes: any) => {
        this.mark('validation', 'Completed');
        this.summary.qualityScore = valRes?.QualityScore;

        this.ftService.preprocess(this.datasetId!, targetCol, featureCols, opts).subscribe({
          next: (preRes: any) => {
            this.mark('preprocess', 'Completed');
            this.summary.rowsProcessed = preRes?.ProcessedRowCount;

            this.ftService.split(this.datasetId!, targetCol, featureCols, opts).subscribe({
              next: (splitRes: any) => {
                this.mark('split', 'Completed');
                this.summary.splitRatio = splitRes?.SplitRatio;
                this.processing = false;
                this.toastService.showSuccess('Full pipeline completed successfully!');
              },
              error: (err) => {
                this.mark('split', 'Failed');
                this.processing = false;
                this.toastService.showError('Split failed: ' + (err?.error?.message || 'Unknown error'));
              }
            });
          },
          error: (err) => {
            this.mark('preprocess', 'Failed');
            this.processing = false;
            this.toastService.showError('Preprocessing failed: ' + (err?.error?.message || 'Unknown error'));
          }
        });
      },
      error: (err) => {
        this.mark('validation', 'Failed');
        this.processing = false;
        this.toastService.showError('Validation failed: ' + (err?.error?.message || 'Unknown error'));
      }
    });
  }
  downloadDataset(format: string): void {
    if (!this.datasetId) {
      this.error = 'No dataset ID found.';
      return;
    }
    let url = '';
    switch (format) {
      case 'full':
        url = `http://localhost:5183/api/Dataset/${this.datasetId}/download/full`;
        break;
      case 'train':
        url = `http://localhost:5183/api/Dataset/${this.datasetId}/download/train`;
        break;
      case 'test':
        url = `http://localhost:5183/api/Dataset/${this.datasetId}/download/test`;
        break;
      default:
        this.error = 'Unknown download format.';
        return;
    }
    // Trigger file download
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
  }

  latestValidationResult: any = null;
  
  // Preprocessing properties
  preprocessOptions = {
    handleMissingValues: true,
    removeDuplicates: true,
    fixDataTypes: true,
    scalingMethod: ''
  };
  latestPreprocessResult: any = null;

  validateDataset(): void {
    this.error = null;
    this.latestValidationResult = null;
    this.latestSplitResult = null;
    if (!this.datasetId) {
      this.error = 'No dataset ID found.';
      return;
    }
    this.isLoading = true;
    this.http.post<any>(`http://localhost:5183/api/Dataset/validate/${this.datasetId}`, {})
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (result: any) => {
          this.latestValidationResult = result;
          this.latestSplitResult = null;
          // Add a synthetic row to previewData to show validation results
          const validationRow = Object.assign(
            {},
            ...this.previewData.headers.map(h => ({ [h]: '' })),
            { ValidationSummary: result.Status === 'Failed'
                ? `Failed - ${result.ErrorCount} errors at lines: ${result.ErrorLines?.join(', ') || 'N/A'}`
                : 'Validation Succeeded!'
            }
          );
          // Remove any previous validation summary row
          this.previewData.data = this.previewData.data.filter(row => !row['ValidationSummary']);
          this.previewData.data.push(validationRow);
          if (!this.previewData.headers.includes('ValidationSummary')) {
            this.previewData.headers.push('ValidationSummary');
          }
        },
        error: (err) => {
          this.error = 'Validation failed: ' + (err?.message || err);
        }
      });
  }

  async downloadLogsJson() {
    try {
      const blob = await this.http.get('http://localhost:5183/api/export/download/logs-json', { responseType: 'blob' }).toPromise();
      if (!blob) throw new Error('No data received');
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dataset-logs.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.toastService.presentToast('success', '✅ Logs downloaded successfully!', 3500);
    } catch (error) {
      this.toastService.presentToast('error', '❌ Failed to download logs.', 3500);
    }
  }

  preprocessDataset(): void {
    this.error = null;
    this.latestPreprocessResult = null;
    if (!this.datasetId) {
      this.error = 'No dataset ID found.';
      return;
    }
    
    this.isLoading = true;
    
    // Prepare the preprocessing options
    const options = {
      handleMissingValues: this.preprocessOptions.handleMissingValues,
      removeDuplicates: this.preprocessOptions.removeDuplicates,
      fixDataTypes: this.preprocessOptions.fixDataTypes,
      scalingMethod: this.preprocessOptions.scalingMethod || undefined
    };
    
    // Use the DatasetOperationsService to call the preprocessing endpoint
    this.datasetOps.preprocessDataset(this.datasetId, options)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (result: any) => {
          this.latestPreprocessResult = result;
          this.toastService.showSuccess('Preprocessing request accepted and is being processed asynchronously!');
        },
        error: (err) => {
          this.error = 'Preprocessing failed: ' + (err?.message || err);
          this.toastService.showError('Preprocessing failed: ' + (err?.message || err));
        }
      });
  }

  downloadResult(type: 'train' | 'test'): void {
    if (!this.datasetId) {
      this.toastService.showWarning('No dataset ID found');
      return;
    }
    
    // For now, show a placeholder - you can implement actual download logic later
    this.toastService.showInfo(`${type.charAt(0).toUpperCase() + type.slice(1)} download not yet implemented`);
  }

  downloadReport(): void {
    if (!this.datasetId) {
      this.toastService.showWarning('No dataset ID found');
      return;
    }
    
    // For now, show a placeholder - you can implement actual report download later
    this.toastService.showInfo('Report download not yet implemented');
  }
 
}
