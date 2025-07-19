import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatasetOperationsService } from '../../services/dataset-operations.service';
import { DatasetService } from '../../services/dataset.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { finalize } from 'rxjs/operators';
import { IonCardSubtitle, IonChip } from '@ionic/angular/standalone';
import { Pipe, PipeTransform } from '@angular/core';
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
  IonRow, IonCol, IonAccordionGroup, IonAccordion, IonSelect, IonSelectOption,
  IonToggle, IonRange, IonInput, IonSegment, IonSegmentButton, IonBackButton
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
    SafeHtmlPipe,
    TruncatePipe,
    IonCardSubtitle,
    IonChip,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle,
    IonContent, IonList, IonItem, IonLabel, IonSpinner, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonBadge, IonText, IonNote, IonGrid,
    IonRow, IonCol, IonAccordionGroup, IonAccordion, IonSelect, IonSelectOption,
    IonToggle, IonRange, IonInput, IonSegment, IonSegmentButton, IonBackButton
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

  constructor(
    private route: ActivatedRoute,
    private datasetOps: DatasetOperationsService,
    private datasetService: DatasetService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.datasetId = this.route.snapshot.paramMap.get('id');
    if (this.datasetId) {
      this.loadDatasetInfo();
      // Also load datasetInfo for template
      this.datasetService.getDatasetContent(this.datasetId).subscribe(
        (info) => { this.datasetInfo = info; },
        (err) => { this.datasetInfo = null; }
      );
    } else {
      this.isLoading = false;
    }
  }

  get hasPreviewData(): boolean {
    return this.previewData.data.length > 0;
  }

  get previewRowCount(): number {
    return this.previewData.data.length;
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

  onSegmentChange(event: any): void {
    const tab = event.detail.value;
    this.activeTab = tab === 'preview' || tab === 'schema' ? tab : 'preview';
  }

  toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo;
  }

  getThumbnailUrl(datasetId: string): string {
    // Use backend endpoint for thumbnail
    return `http://localhost:5183/api/Dataset/${datasetId}/thumbnail`;
  }

  latestSplitResult: any = null;

  splitDataset(train?: number, test?: number): void {
    if (!this.datasetId) {
      this.error = 'No dataset ID found.';
      return;
    }
    this.isLoading = true;
    // Use train/test if provided, else default to selectedRatio
    const trainVal = train ?? this.selectedRatio.train;
    const testVal = test ?? this.selectedRatio.test;
    this.http.get<any>(`http://localhost:5183/api/Dataset/train-split/${this.datasetId}?train=${trainVal}&test=${testVal}`)
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
  
    if (!this.datasetId) {
      this.error = 'No dataset ID found.';
      return;
    }
    this.isLoading = true;
    this.http.get<any>(`http://localhost:5183/api/Dataset/train-split/${this.datasetId}`)
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

  latestValidationResult: any = null;

  validateDataset(): void {
    if (!this.datasetId) {
      this.error = 'No dataset ID found.';
      return;
    }
    this.isLoading = true;
    this.http.get<any>(`http://localhost:5183/api/Dataset/validate/${this.datasetId}`)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (result) => {
          this.latestValidationResult = result;
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

  downloadDataset(format: string): void {
    // TODO: Implement download logic
    alert(`Download as ${format} not yet implemented.`);
  }
}
