import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatasetOperationsService } from '../../services/dataset-operations.service';
import { DatasetService } from '../../services/dataset.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { finalize } from 'rxjs/operators';
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
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle,
    IonContent, IonList, IonItem, IonLabel, IonSpinner, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonBadge, IonText, IonNote, IonGrid,
    IonRow, IonCol, IonAccordionGroup, IonAccordion, IonSelect, IonSelectOption,
    IonToggle, IonRange, IonInput, IonSegment, IonSegmentButton, IonBackButton
  ]
})
export class DatasetDetailsPage implements OnInit {
  datasetId: string | null = null;
  isLoading = true;
  showDebugInfo = false;
  activeTab: 'preview' | 'schema' = 'preview';
  previewRowsToShow = 5;
  previewData: PreviewData = {
    headers: [],
    data: [],
    schema: [],
    totalRows: 0
  };

  constructor(
    private route: ActivatedRoute,
    private datasetOps: DatasetOperationsService,
    private datasetService: DatasetService
  ) {}

  ngOnInit() {
    this.datasetId = this.route.snapshot.paramMap.get('id');
    if (this.datasetId) {
      this.loadDatasetInfo();
    } else {
      console.warn('No dataset ID found in route');
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
      console.warn('No dataset ID provided');
      this.isLoading = false;
      return;
    }
    
    console.log(`Loading dataset content for ID: ${this.datasetId}`);
    this.isLoading = true;
    
    // Reset preview data
    this.previewData = {
      headers: [],
      data: [],
      schema: [],
      totalRows: 0
    };
    
    // Load dataset content using the read endpoint
    this.datasetService.getDatasetContent(this.datasetId)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          try {
            console.log('Raw dataset content response:', response);
            
            if (!response || !response.content) {
              throw new Error('No content received in the response');
            }
            
            // Parse CSV content
            const lines = response.content.split('\n').filter((line: string) => line.trim() !== '');
            if (lines.length === 0) {
              throw new Error('Empty dataset content');
            }
            
            // Parse headers (first line)
            const headers = this.parseCsvLine(lines[0]);
            
            // Parse data rows
            const data = [];
            for (let i = 1; i < Math.min(lines.length, this.previewRowsToShow + 1); i++) {
              if (lines[i].trim() === '') continue;
              
              const rowData = this.parseCsvLine(lines[i]);
              const row: Record<string, any> = { rowNumber: i };
              
              headers.forEach((header, index) => {
                row[header] = index < rowData.length ? rowData[index] : '';
              });
              
              data.push(row);
            }
            
            // Update preview data
            this.previewData = {
              headers,
              data,
              schema: [],
              totalRows: lines.length - 1 // Subtract 1 for header
            };
            
            // Load schema
            this.loadSchema();
            
          } catch (error) {
            console.error('Error parsing dataset content:', error);
            this.handlePreviewError(error);
          }
        },
        error: (error) => {
          console.error('Error loading dataset content:', error);
          this.handlePreviewError(error);
        }
      });
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
          
          // Update sample values from preview data if available
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
      // Sample values for type inference
      const sampleValues = this.previewData.data
        .slice(0, 10)
        .map(row => row[header])
        .filter(val => val !== undefined && val !== null && val !== '');
      
      // Simple type inference
      let type = 'string';
      if (sampleValues.length > 0) {
        const firstValue = sampleValues[0];
        if (!isNaN(Number(firstValue))) {
          type = 'number';
        } else if (firstValue.toLowerCase() === 'true' || firstValue.toLowerCase() === 'false') {
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
    if (!this.previewData.schema.length || !this.previewData.data.length) {
      return;
    }
    
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
        if (uniqueValues.size >= maxSamples) {
          break;
        }
      }
    }
    
    return Array.from(uniqueValues);
  }

  private handlePreviewError(error: any): void {
    console.error('Error loading dataset preview:', error);
    this.previewData = {
      headers: [],
      data: [],
      schema: [],
      totalRows: 0
    };
    this.isLoading = false;
  }

  getCellValue(row: any, header: string): any {
    return row[header] !== undefined ? row[header] : '';
  }

  formatCellValue(value: any): string {
    if (value === undefined || value === null || value === '') {
      return '—';
    }
    return String(value);
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
    
    // Add the last field
    result.push(currentField.trim());
    
    return result;
  }

  onSegmentChange(event: any) {
    const tab = event.detail.value;
    if (tab === 'preview' || tab === 'schema') {
      this.activeTab = tab;
    } else {
      this.activeTab = 'preview'; // Default to preview if invalid tab
    }
  }

  toggleDebugInfo() {
    this.showDebugInfo = !this.showDebugInfo;
  }
}
