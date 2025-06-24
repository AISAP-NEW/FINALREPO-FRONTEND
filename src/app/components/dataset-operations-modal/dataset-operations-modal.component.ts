import { Component, Inject, OnInit, CUSTOM_ELEMENTS_SCHEMA, Input, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonTitle, 
  IonSegment, 
  IonSegmentButton, 
  IonLabel, 
  IonContent,
  IonList,
  IonItem,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonRange,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonText,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  ModalController,
  IonCardSubtitle,
  IonAccordionGroup,
  IonAccordion
  
} from '@ionic/angular/standalone';
import { DatasetOperationsService } from '../../services/dataset-operations.service';
import { PreprocessOptions, ValidationResult, SplitResult } from '../../models/dataset.models';
import { DatasetPreviewComponent } from '../dataset-preview/dataset-preview.component';

@Component({
  selector: 'app-dataset-operations-modal',
  standalone: true,
  templateUrl: './dataset-operations-modal.component.html',
  styleUrls: ['./dataset-operations-modal.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [ModalController, HttpClient],
  imports: [
    // Angular Modules
    CommonModule, 
    FormsModule,
    
    // Ionic Components
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonContent,
    IonList,
    IonItem,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonRange,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonText,
    IonNote,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonAccordionGroup,
    IonAccordion,
    DatasetPreviewComponent
  ]
})
export class DatasetOperationsModal implements OnInit {
  // Component state
  @Input() datasetId: string = '';
  isLoading = false;
  showDebugInfo = false;
  activeTab: 'preview' | 'preprocess' | 'validate' | 'split' = 'preview';
  previewTab: 'data' | 'schema' | 'raw' = 'data';
  previewRowsToShow = 5;
  columns: string[] = [];
  selectedColumns: {[key: string]: boolean} = {};
  showPreview = true;
  
  // Preview data structure
  previewData = {
    headers: [] as string[],
    data: [] as any[],
    schema: [] as Array<{
      name: string;
      type: string;
      nullable: boolean;
      sampleValues: any[];
    }>,
    totalRows: 0
  };
  
  get hasPreviewData(): boolean {
    return this.previewData?.data?.length > 0;
  }
  
  get previewRowCount(): number {
    return this.previewData?.data?.length || 0;
  }
  
  get totalRowCount(): number {
    return this.previewData?.totalRows || 0;
  }
  
  // Data Cleaning Options
  preprocessOptions = {
    handleMissingValues: true,
    removeDuplicates: true,
    fixDataTypes: true,
    scalingMethod: 'minmax',
    stripWhitespace: true,
    removeSpecialChars: false,
    customColumns: [] as Array<{name: string, expression: string}>
  };
  
  // Validation Options
  validationOptions = {
    checkNulls: true,
    checkDuplicates: true,
    uniqueColumns: [] as string[],
    outlierDetection: {
      enabled: false,
      method: 'zscore',
      threshold: 3
    },
    dataTypeChecks: {
      enabled: true,
      strict: false
    },
    validationRules: [] as Array<{
      column: string;
      rule: 'min' | 'max' | 'regex' | 'in';
      value: any;
      message: string;
    }>
  };
  
  // Split Options
  splitOptions = {
    trainRatio: 80,
    shuffle: true,
    stratifyBy: undefined as string | undefined,
    randomState: 42
  };
  
  // Results
  validationResult: ValidationResult | null = null;
  splitResult: any = null;
  previewRows: number = 100;
  newCustomColumn = { name: '', expression: '' };
  newValidationRule = { column: '', rule: 'min' as const, value: '', message: '' };
  validationRules = ['min', 'max', 'regex', 'in'] as const;

  constructor(
    private modalCtrl: ModalController,
    private datasetOps: DatasetOperationsService,
    private http: HttpClient
  ) {
    // Initialize empty selected columns object
    this.selectedColumns = {};
  }

  ngOnInit() {
    console.log('DatasetOperationsModal: Component initialized');
    console.log('DatasetOperationsModal: Current datasetId:', this.datasetId);
    console.log('DatasetOperationsModal: Preview data state:', this.previewData);
    
    if (isDevMode() && !this.datasetId) {
      this.loadMockData();
    } else if (this.datasetId) {
      console.log('Initializing dataset operations modal with ID:', this.datasetId);
      this.loadPreviewData();
    } else {
      console.warn('No dataset ID provided to dataset operations modal');
    }
  }
  
  private loadMockData() {
    console.log('Loading mock data...');
    this.isLoading = true;
    
    // Simulate API call with mock data
    const mockData = {
      headers: ['id', 'name', 'age', 'email', 'isActive'],
      data: [
        { id: 1, name: 'John Doe', age: 30, email: 'john@example.com', isActive: true },
        { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com', isActive: true },
        { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com', isActive: false },
        { id: 4, name: 'Alice Brown', age: 28, email: 'alice@example.com', isActive: true },
        { id: 5, name: 'Charlie Wilson', age: 40, email: 'charlie@example.com', isActive: false }
      ],
      totalRows: 100,
      schema: [
        { name: 'id', type: 'number', nullable: false, sampleValues: [1, 2, 3, 4, 5] },
        { name: 'name', type: 'string', nullable: false, sampleValues: ['John Doe', 'Jane Smith'] },
        { name: 'age', type: 'number', nullable: false, sampleValues: [30, 25, 35] },
        { name: 'email', type: 'string', nullable: false, sampleValues: ['john@example.com', 'jane@example.com'] },
        { name: 'isActive', type: 'boolean', nullable: false, sampleValues: [true, false] }
      ]
    };
    
    // Simulate API delay
    setTimeout(() => {
      this.previewData = mockData;
      this.isLoading = false;
      console.log('Mock data loaded:', this.previewData);
    }, 500);
  }

  // Handle tab changes in the segment control
  onTabChange(event: any) {
    if (event?.detail?.value) {
      this.activeTab = event.detail.value;
    }
  }

  // Get sample values for a column
  private getSampleValues(data: any[], columnName: string, maxSamples = 5): any[] {
    if (!data || !columnName || !Array.isArray(data)) return [];
    
    const uniqueValues = new Set<any>();
    
    for (const row of data) {
      if (row && columnName in row && row[columnName] !== undefined && row[columnName] !== null) {
        uniqueValues.add(row[columnName]);
        if (uniqueValues.size >= maxSamples) break;
      }
    }
    
    return Array.from(uniqueValues);
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  /**
   * Loads preview data for the current dataset
   * @param forceReload If true, forces a fresh load even if data already exists
   */
  loadPreviewData(forceReload: boolean = false): void {
    // Skip if already loading
    if (this.isLoading) {
      return;
    }
    
    // Check if we have a dataset ID
    if (!this.datasetId) {
      console.error('No dataset ID provided for preview data');
      return;
    }
    
    // Don't reload if we already have data and not forcing a reload
    if (this.previewData.data.length > 0 && !forceReload) {
      console.log('Preview data already loaded, skipping reload');
      return;
    }
    
    console.log(`Loading preview data for dataset ${this.datasetId}...`);
    this.isLoading = true;
    
    // Reset preview data
    this.previewData = {
      headers: [],
      data: [],
      schema: [],
      totalRows: 0
    };

    console.log(`Loading preview data for dataset ${this.datasetId}...`);
    this.isLoading = true;
    
    // Clear any existing preview data
    this.previewData = {
      headers: [],
      data: [],
      schema: [],
      totalRows: 0
    };

    this.datasetOps.getDatasetPreview(this.datasetId, this.previewRowsToShow)
      .subscribe({
        next: (response: any) => {
          try {
            console.log('Raw preview response:', response);
            let data: any[] = [];
            let headers: string[] = [];
            let totalRows = 0;

            // Normalize different response formats
            if (Array.isArray(response)) {
              // Case 1: Response is an array of rows
              data = response;
              if (data.length > 0) {
                headers = Object.keys(data[0]);
              }
              totalRows = data.length;
            } else if (response && typeof response === 'object') {
              // Case 2: Response has data and headers separately
              if (response.preview?.data && Array.isArray(response.preview.data)) {
                // New format with preview wrapper
                data = response.preview.data;
                headers = response.preview.headers || [];
                totalRows = response.preview.totalRows || data.length;
              } else if (response.data && Array.isArray(response.data)) {
                // Direct data property
                data = response.data;
                if (response.headers && Array.isArray(response.headers)) {
                  headers = response.headers;
                } else if (data.length > 0) {
                  headers = Object.keys(data[0]);
                }
                totalRows = response.totalRows || data.length;
              } else if (response.values && Array.isArray(response.values)) {
                // Case 3: Google Sheets-like format with values array
                const values = response.values;
                if (values.length > 0) {
                  headers = values[0];
                  data = values.slice(1).map((row: any[]) => {
                    const obj: any = {};
                    headers.forEach((header: string, i: number) => {
                      obj[header] = i < row.length ? row[i] : null;
                    });
                    return obj;
                  });
                  totalRows = response.rowCount || data.length;
                }
              }
            }


            // If no data was extracted, log a warning and use mock data
            if (data.length === 0) {
              console.warn('No data found in preview response, using mock data');
              this.loadMockData();
              return;
            }

            // Update preview data
            this.previewData = {
              headers: headers,
              data: data,
              schema: [], // Will be populated by loadSchema
              totalRows: totalRows
            };

            console.log('Preview data loaded:', {
              rowCount: data.length,
              totalRows: totalRows,
              columns: headers,
              firstRow: data[0]
            });

            // Only load schema if we don't have it yet
            if (this.previewData.schema.length === 0) {
              this.loadSchema(data, headers, totalRows);
            }
          } catch (error) {
            console.error('Error processing preview data:', error);
            // Fallback to mock data on error
            this.loadMockData();
          }
        },
        error: (error: any) => {
          console.error('Error loading preview data:', error);
          this.isLoading = false;
          // Fallback to mock data on error
          this.loadMockData();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  // Load schema information
  loadSchema(data: any[], headers: string[], totalRows: number): void {
    if (!this.datasetId) {
      console.warn('No dataset ID provided for schema loading');
      this.inferSchemaFromData(data, headers, totalRows);
      return;
    }

    this.datasetOps.getDatasetSchema(this.datasetId).subscribe({
      next: (schemaResponse: any) => {
        console.log('DatasetOperationsModal: Schema API Response:', schemaResponse);
        let schema: Array<{
          name: string;
          type: string;
          nullable: boolean;
          sampleValues: any[];
        }> = [];

        if (schemaResponse) {
          // Process schema response
          if (Array.isArray(schemaResponse)) {
            // If schema is an array of fields
            schema = schemaResponse.map((field: any) => ({
              name: field.name || field.column_name || '',
              type: field.type || field.data_type || 'string',
              nullable: field.nullable !== undefined ? field.nullable : true,
              sampleValues: field.sampleValues || this.getSampleValues(data, field.name || field.column_name, 5),
            }));
          } else if (schemaResponse.fields || schemaResponse.schema) {
            // If schema has a fields or schema property
            const fields = schemaResponse.fields || schemaResponse.schema || [];
            schema = fields.map((field: any) => ({
              name: field.name || field.column_name || '',
              type: field.type || field.data_type || 'string',
              nullable: field.nullable !== undefined ? field.nullable : true,
              sampleValues: field.sampleValues || this.getSampleValues(data, field.name || field.column_name, 5),
            }));
          }
          
          this.updatePreviewWithSchema(schema, headers, totalRows);
        } else {
          console.warn('DatasetOperationsModal: Empty schema response, inferring from data');
          this.inferSchemaFromData(data, headers, totalRows);
        }
      },
      error: (error) => {
        console.error('Error loading schema:', error);
        this.inferSchemaFromData(data, headers, totalRows);
      }
    });
  }
  
  // Helper to update preview data with schema
  private updatePreviewWithSchema(schema: any[], headers: string[], totalRows: number): void {
    this.previewData = {
      ...this.previewData,
      headers: headers,
      schema: schema,
      totalRows: totalRows || this.previewData.totalRows,
    };
    
    // Update columns for selection
    this.columns = headers;
    this.selectedColumns = {};
    headers.forEach(header => {
      this.selectedColumns[header] = true;
    });
    
    this.isLoading = false;
    console.log('DatasetOperationsModal: Updated preview data with schema:', this.previewData);
  }
  
  // Infer schema from data when no schema is available
  private inferSchemaFromData(data: any[], headers: string[], totalRows: number): void {
    console.log('Inferring schema from data...');
    
    const schema = headers.map(header => {
      const sampleValues = this.getSampleValues(data, header, 5);
      const type = this.inferTypeFromValues(sampleValues);
      
      return {
        name: header,
        type: type,
        nullable: sampleValues.some(v => v === null || v === undefined || v === ''),
        sampleValues: sampleValues
      };
    });
    
    this.updatePreviewWithSchema(schema, headers, totalRows);
    console.log('Inferred schema:', schema);
  }
  
  // Infer data type from sample values
  private inferTypeFromValues(values: any[]): string {
    if (values.length === 0) return 'string';
    
    // Check for boolean
    if (values.every(v => v === true || v === false || v === 'true' || v === 'false' || v === null || v === undefined)) {
      return 'boolean';
    }
    
    // Check for number
    if (values.every(v => v === null || v === undefined || typeof v === 'number' || !isNaN(Number(v)) || v === '')) {
      return 'number';
    }
    
    // Check for date
    const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
    if (values.every(v => v === null || v === undefined || v === '' || dateRegex.test(v))) {
      return 'date';
    }
    
    // Default to string
    return 'string';
  }
  
  // Helper to get value from data row with fallback
  getCellValue(row: Record<string, any>, column: string): string {
    if (!row || !column) return '—';
    const rowData = row['data'] || row;
    const value = column in rowData ? rowData[column] : undefined;
    return value !== undefined && value !== null ? String(value) : '—';
  }
  
  // Check if an object has any keys
  public hasKeys(obj: any): boolean {
    return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
  }

  // Get object keys with type safety
  private getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
  
  // Add a custom column to the dataset
  addCustomColumn(): void {
    if (!this.previewData?.headers) return;
    
    const newColumn = `new_column_${this.previewData.headers.length + 1}`;
    this.previewData = {
      ...this.previewData,
      headers: [...this.previewData.headers, newColumn],
      data: this.previewData.data.map((row: any) => ({
        ...row,
        [newColumn]: ''
      }))
    };
  }
  
  // Remove a custom column by index
  removeCustomColumn(index: number): void {
    if (this.preprocessOptions?.customColumns && index >= 0 && index < this.preprocessOptions.customColumns.length) {
      this.preprocessOptions.customColumns.splice(index, 1);
    }
  }

  // Remove a column from the dataset
  removeColumn(columnName: string): void {
    if (!this.previewData?.headers) return;
    
    this.previewData = {
      ...this.previewData,
      headers: this.previewData.headers.filter((h: string) => h !== columnName),
      data: this.previewData.data.map((row: any) => {
        const newRow = {...row};
        delete newRow[columnName];
        return newRow;
      })
    };
  }
  
  // Add a validation rule
  addValidationRule(): void {
    // Implementation depends on your validation rules structure
    console.log('Adding validation rule');
  }
  
  // Remove a validation rule
  removeValidationRule(index: number): void {
    // Implementation depends on your validation rules structure
    console.log('Removing validation rule at index', index);
  }
  
  // Run preprocessing on the dataset
  runPreprocessing(): void {
    if (!this.previewData) return;
    
    this.isLoading = true;
    this.datasetOps.preprocessDataset(this.datasetId, this.preprocessOptions).subscribe({
      next: (result: any) => {
        console.log('Preprocessing result:', result);
        // Reload preview after preprocessing
        this.loadPreviewData();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error during preprocessing:', error);
        // Show error message to user
        this.isLoading = false;
      }
    });
  }
  
  // Run validation on the dataset
  runValidation(): void {
    if (!this.previewData) return;
    
    this.isLoading = true;
    this.datasetOps.validateDataset(this.datasetId).subscribe({
      next: (result: ValidationResult) => {
        this.validationResult = result;
        // Switch to validation tab to show results
        this.activeTab = 'validate';
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error during validation:', error);
        this.isLoading = false;
      }
    });
  }
  
  // Run train/test split on the dataset
  runSplit(): void {
    if (!this.previewData) return;
    
    this.isLoading = true;
    this.datasetOps.splitDataset(
      this.datasetId,
      this.splitOptions.trainRatio,
      100 - this.splitOptions.trainRatio,
      {
        shuffle: this.splitOptions.shuffle,
        stratifyBy: this.splitOptions.stratifyBy
      }
    ).subscribe({
      next: (result: any) => {
        this.splitResult = result;
        // Switch to split tab to show results
        this.activeTab = 'split';
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error during split:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Loads comprehensive dataset information including schema and preview data
   */
  loadDatasetInfo(): void {
    if (!this.datasetId) {
      console.warn('No dataset ID provided for loading dataset info');
      return;
    }
    
    this.isLoading = true;
    
    // Load dataset schema first
    this.datasetOps.getDatasetSchema(this.datasetId).subscribe({
      next: (schema: any) => {
        try {
          console.log('DatasetOperationsModal: Loaded dataset schema:', schema);
          
          // Process schema fields
          if (schema?.fields && Array.isArray(schema.fields)) {
            this.columns = schema.fields.map((f: any) => f.name);
            
            // Initialize selected columns for operations
            this.selectedColumns = this.columns.reduce((acc, col) => {
              acc[col] = true; // Select all columns by default
              return acc;
            }, {} as {[key: string]: boolean});
            
            // Update validation options with available columns
            this.validationOptions.uniqueColumns = [...this.columns];
            
            // Set default stratify column if available
            if (this.columns.length > 0) {
              this.splitOptions.stratifyBy = this.columns[0];
            }
            
            // Load preview data after schema is loaded
            this.loadPreviewData();
          } else {
            console.warn('No valid schema fields found, loading preview data directly');
            this.loadPreviewData();
          }
        } catch (error) {
          console.error('Error processing dataset schema:', error);
          this.loadPreviewData(); // Try loading preview data even if schema processing fails
        }
      },
      error: (error: any) => {
        console.error('Error loading dataset schema, falling back to preview data only:', error);
        this.loadPreviewData();
      }
    });
  }

  // Modal Control
  dismiss() {
    this.modalCtrl.dismiss({
      dismissed: true
    });
  }
}
