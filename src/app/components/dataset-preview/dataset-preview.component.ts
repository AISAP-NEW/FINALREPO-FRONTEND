import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface SchemaField {
  name: string;
  type: string;
  sampleValues: any[];
  nullable?: boolean;
}

interface PreviewData {
  headers: string[];
  data: any[];
  totalRows: number;
  schema: SchemaField[];
}

@Component({
  selector: 'app-dataset-preview',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonicModule
  ],
  templateUrl: './dataset-preview.component.html',
  styleUrls: ['./dataset-preview.component.scss']
})
export class DatasetPreviewComponent implements OnInit {
  @Input() datasetId: string = '';
  
  previewData: PreviewData = {
    headers: [],
    data: [],
    totalRows: 0,
    schema: []
  };
  
  isLoading = true;
  
  constructor() {}
  
  ngOnInit() {
    console.log('DatasetPreviewComponent: Initializing with datasetId:', this.datasetId);
    this.loadMockData();
  }
  
  get hasPreviewData(): boolean {
    return this.previewData?.data?.length > 0 && this.previewData?.headers?.length > 0;
  }
  
  get previewRowCount(): number {
    return this.previewData?.data?.length || 0;
  }
  
  get totalRowCount(): number {
    return this.previewData?.totalRows || 0;
  }
  
  private loadMockData() {
    console.log('Loading mock data...');
    this.isLoading = true;
    
    // Mock data structure
    const mockData: PreviewData = {
      headers: ['id', 'name', 'age', 'email', 'isActive'],
      data: [
        { id: 1, name: 'John Doe', age: 30, email: 'john@example.com', isActive: true },
        { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com', isActive: true },
        { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com', isActive: false },
        { id: 4, name: 'Alice Brown', age: 28, email: 'alice@example.com', isActive: true },
        { id: 5, name: 'Charlie Wilson', age: 40, email: 'charlie@example.com', isActive: false }
      ],
      totalRows: 100, // Simulating a larger dataset
      schema: [
        { 
          name: 'id', 
          type: 'number', 
          nullable: false, 
          sampleValues: [1, 2, 3, 4, 5] 
        },
        { 
          name: 'name', 
          type: 'string', 
          nullable: false, 
          sampleValues: ['John Doe', 'Jane Smith', 'Bob Johnson'] 
        },
        { 
          name: 'age', 
          type: 'number', 
          nullable: false, 
          sampleValues: [30, 25, 35, 28, 40] 
        },
        { 
          name: 'email', 
          type: 'string', 
          nullable: false, 
          sampleValues: ['john@example.com', 'jane@example.com'] 
        },
        { 
          name: 'isActive', 
          type: 'boolean', 
          nullable: false, 
          sampleValues: [true, false] 
        }
      ]
    };
    
    // Simulate API delay
    setTimeout(() => {
      this.previewData = mockData;
      this.isLoading = false;
      console.log('Mock data loaded:', this.previewData);
    }, 500);
  }
  
  // Helper to get value from data row with fallback
  getCellValue(row: any, column: string): any {
    return row[column] !== undefined ? row[column] : '—';
  }
  
  getTypeColor(type: string): string {
    if (!type) return 'medium';
    
    const lowerType = type.toLowerCase();
    
    // Numeric types
    if (['integer', 'int', 'number', 'float', 'double', 'decimal', 'long', 'short', 'byte'].includes(lowerType)) {
      return 'primary';
    }
    
    // String types
    if (['string', 'char', 'text', 'varchar', 'nvarchar', 'character'].includes(lowerType)) {
      return 'success';
    }
    
    // Date/time types
    if (['date', 'time', 'datetime', 'timestamp', 'year', 'month', 'day'].includes(lowerType)) {
      return 'warning';
    }
    
    // Boolean types
    if (['boolean', 'bool', 'bit'].includes(lowerType)) {
      return 'danger';
    }
    
    // Default
    return 'medium';
  }
  
  // Helper to check if a field is a primary key (simplified for demo)
  isPrimaryKey(fieldName: string): boolean {
    return fieldName === 'id'; // Simple assumption for demo
  }
}
