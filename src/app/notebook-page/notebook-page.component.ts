import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { NotebookCellComponent } from '../../components/notebook-cell/notebook-cell.component';
import { DatasetOperationsModal } from '../../components/dataset-operations-modal/dataset-operations-modal.component';

interface DatasetSchema {
  name: string;
  type: string;
  nullable: boolean;
  description: string;
}

interface DatasetPreview {
  columns: string[];
  data: any[];
}

export interface NotebookCell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: {
    type: string;
    data: string[];
  } | null;
  isExecuting?: boolean;
}

@Component({
  selector: 'app-notebook-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,

    NotebookCellComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="notebook-container">
      <header class="notebook-header">
        <div class="header-left">
          <h1>Notebook</h1>
          <div class="dataset-info">
            <span class="dataset-name">Customer Purchase Analysis</span>
            <span class="dataset-status">Connected</span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="saveNotebook()">
            <mat-icon>save</mat-icon> Save
          </button>
          <button mat-stroked-button (click)="exportNotebook()">
            <mat-icon>download</mat-icon> Export
          </button>
          <button mat-raised-button color="primary" (click)="runAllCells()">
            <mat-icon>play_arrow</mat-icon> Run All
          </button>
        </div>
      </header>

      <div class="notebook-content">
        <!-- Left sidebar -->
        <aside class="sidebar">
          <div class="sidebar-section">
            <h3>Dataset</h3>
            <div class="dataset-actions">
              <button mat-stroked-button (click)="onPreprocess()">
                <mat-icon>cleaning_services</mat-icon> Preprocess
              </button>
              <button mat-stroked-button (click)="onValidate()">
                <mat-icon>check_circle</mat-icon> Validate
              </button>
              <button mat-stroked-button (click)="onTrainTestSplit()">
                <mat-icon>call_split</mat-icon> Split Data
              </button>
            </div>
            <div class="dataset-info">
              <span class="dataset-name">Customer Purchase Analysis</span>
              <span class="dataset-status">Connected</span>
            </div>
          </div>
        </aside>

        <!-- Main content -->
        <div class="cells-container">
          <div class="cell-container" *ngFor="let cell of cells; let i = index">
            <app-notebook-cell
              [type]="cell.type"
              [content]="cell.content"
              [isExecuting]="cell.isExecuting || false"
              (execute)="executeCell(i, $event)"
              (contentChange)="updateCellContent(i, $event)">
            </app-notebook-cell>
            
            <div class="cell-actions">
              <button mat-icon-button (click)="addCell(i, 'code')" matTooltip="Add code cell">
                <mat-icon>add</mat-icon>
              </button>
              <button mat-icon-button (click)="addCell(i, 'markdown')" matTooltip="Add markdown cell">
                <mat-icon>text_fields</mat-icon>
              </button>
              <button mat-icon-button (click)="deleteCell(i)" matTooltip="Delete cell">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
          
          <div class="add-cell-container">
            <button mat-stroked-button (click)="addCell(cells.length, 'code')">
              <mat-icon>add</mat-icon> Add Code Cell
            </button>
            <button mat-stroked-button (click)="addCell(cells.length, 'markdown')">
              <mat-icon>text_fields</mat-icon> Add Markdown Cell
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notebook-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #f5f5f5;
    }
    
    .notebook-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background-color: white;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    .dataset-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }
    
    .dataset-status {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 12px;
      background-color: #e8f5e9;
      color: #2e7d32;
      font-size: 12px;
    }
    
    .notebook-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .sidebar {
      width: 250px;
      padding: 16px;
      background-color: white;
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
    }
    
    .sidebar-section {
      margin-bottom: 24px;
    }
    
    .sidebar h3 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 500;
    }
    
    .dataset-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .cells-container {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }
    
    .cell-container {
      margin-bottom: 24px;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      background-color: white;
    }
    
    .cell-actions {
      display: flex;
      justify-content: flex-end;
      padding: 4px 8px;
      background-color: #f5f5f5;
      border-top: 1px solid #e0e0e0;
    }
    
    .add-cell-container {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin: 24px 0;
    }
  `]
})
export class NotebookPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('notebookContent', { static: false }) notebookContent!: ElementRef;
  selectedTabIndex = 0;
  datasetSchema: DatasetSchema[] = [];
  datasetPreview: DatasetPreview = { columns: [], data: [] };
  displayedColumns: string[] = [];
  isLoading = false;
  
  // Mock data for demonstration
  private mockSchema: DatasetSchema[] = [
    { name: 'id', type: 'integer', nullable: false, description: 'Unique identifier' },
    { name: 'age', type: 'float', nullable: true, description: 'Age of the person' },
    { name: 'income', type: 'float', nullable: true, description: 'Annual income' },
    { name: 'education', type: 'string', nullable: true, description: 'Education level' },
    { name: 'purchase', type: 'boolean', nullable: false, description: 'Whether purchased' },
  ];

  private mockPreview = {
    columns: ['id', 'age', 'income', 'education', 'purchase'],
    data: [
      { id: 1, age: 25, income: 50000, education: 'Bachelor', purchase: true },
      { id: 2, age: 30, income: 75000, education: 'Master', purchase: false },
      { id: 3, age: 35, income: 90000, education: 'PhD', purchase: true },
      { id: 4, age: 40, income: 60000, education: 'Bachelor', purchase: false },
      { id: 5, age: 45, income: 120000, education: 'PhD', purchase: true },
    ]
  };

  cells: NotebookCell[] = [
    {
      id: '1',
      type: 'markdown',
      content: '# Customer Purchase Analysis\n\nThis notebook contains the analysis of customer purchase data.',
      isExecuting: false
    },
    {
      id: '2',
      type: 'code',
      content: '# Load and preview the dataset\nimport pandas as pd\n\ndf = pd.read_csv("customer_purchases.csv")\ndf.head()',
      isExecuting: false,
      output: {
        type: 'text/plain',
        data: ['   customer_id  age  income  purchase_amount  \n0            1   25   50000              120   \n1            2   35   75000              450   \n2            3   42  100000              980   \n3            4   28   60000              230   \n4            5   50  120000              760   ']
      }
    },
    {
      id: '3',
      type: 'code',
      content: '# Basic statistics\ndf.describe()',
      isExecuting: false,
      output: {
        type: 'text/plain',
        data: ['              age        income  purchase_amount\ncount  1000.000000    1000.000000     1000.000000\nmean     42.350000   78500.000000      587.320000\nstd      12.450000   25000.000000      320.450000\nmin      18.000000   30000.000000       50.000000\n25%      32.000000   60000.000000      350.000000\n50%      41.000000   75000.000000      520.000000\n75%      52.000000   90000.000000      780.000000\nmax      70.000000  200000.000000     2000.000000']
      }
    }
  ];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadNotebook();
    this.loadDatasetSchema();
    this.loadDatasetPreview();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.saveNotebook();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private scrollToBottom(): void {
    try {
      if (this.notebookContent) {
        const element = this.notebookContent.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // Add a new cell after the specified index
  addCell(index: number, type: 'code' | 'markdown' = 'code'): void {
    try {
      const newCell: NotebookCell = {
        id: this.generateId(),
        type,
        content: type === 'code' ? '# Your code here' : 'Double click to edit markdown',
        isExecuting: false,
        output: null
      };
      
      this.cells.splice(index + 1, 0, newCell);
      this.saveNotebook();
      
      this.snackBar.open('New cell added', 'Dismiss', {
        duration: 2000
      });
      
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Error adding cell:', error);
      this.snackBar.open('Error adding cell', 'Dismiss', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Delete a cell at the specified index
  deleteCell(index: number): void {
    try {
      if (this.cells.length > 1) {
        this.cells.splice(index, 1);
        this.saveNotebook();
        this.snackBar.open('Cell deleted', 'Dismiss', {
          duration: 2000
        });
      } else {
        this.snackBar.open('Cannot delete the last cell', 'Dismiss', {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error deleting cell:', error);
      this.snackBar.open('Error deleting cell', 'Dismiss', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Update cell content
  onCellContentChange(index: number, content: string): void {
    if (this.cells[index]) {
      this.cells[index].content = content;
      this.saveNotebook();
    }
  }

  private loadDatasetSchema(): void {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.datasetSchema = this.mockSchema;
      this.isLoading = false;
    }, 500);
  }

  private loadDatasetPreview(): void {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.datasetPreview = this.mockPreview;
      this.displayedColumns = this.mockPreview.columns;
      this.isLoading = false;
    }, 500);
  }

  // Move a cell up or down in the notebook
  moveCell(cellId: string, direction: 'up' | 'down'): void {
    try {
      const index = this.cells.findIndex(cell => cell.id === cellId);
      if (index === -1) return;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex >= 0 && newIndex < this.cells.length) {
        const cell = this.cells[index];
        this.cells.splice(index, 1);
        this.cells.splice(newIndex, 0, cell);
        this.saveNotebook();
        
        this.snackBar.open(`Cell moved ${direction}`, 'Dismiss', {
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error moving cell:', error);
      this.snackBar.open('Error moving cell', 'Dismiss', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  async executeCell(cellIndex: number, content: string): Promise<void> {
    if (!this.cells[cellIndex]) return;
    
    const cell = this.cells[cellIndex];
    cell.isExecuting = true;
    
    try {
      cell.content = content;
      
      // Simulate API call to execute code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response based on cell content
      if (content.includes('df.head()')) {
        cell.output = {
          type: 'text/plain',
          data: [
            '   customer_id  age  income  purchase_amount',
            '0            1   25   50000              120',
            '1            2   35   75000              450',
            '2            3   42  100000              980',
            '3            4   28   60000              230',
            '4            5   50  120000              760'
          ]
        };
      } else if (content.includes('df.describe()')) {
        cell.output = {
          type: 'text/plain',
          data: [
            '              age        income  purchase_amount',
            'count  1000.000000    1000.000000     1000.000000',
            'mean     42.350000   78500.000000      587.320000',
            'std      12.450000   25000.000000      320.450000',
            'min      18.000000   30000.000000       50.000000',
            '25%      32.000000   60000.000000      350.000000',
            '50%      41.000000   75000.000000      520.000000',
            '75%      52.000000   90000.000000      780.000000',
            'max      70.000000  200000.000000     2000.000000'
          ]
        };
      } else {
        cell.output = {
          type: 'text/plain',
          data: ['Code executed successfully!']
        };
      }
      
      this.snackBar.open('Cell executed successfully', 'Dismiss', {
        duration: 2000
      });
    } catch (error) {
      console.error('Error executing cell:', error);
      cell.output = {
        type: 'error',
        data: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
      this.snackBar.open('Error executing cell', 'Dismiss', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      cell.isExecuting = false;
    }
  }

  async runAllCells(): Promise<void> {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i].type === 'code') {
        await this.executeCell(i, this.cells[i].content);
      }
    }
  }

  updateCellContent(index: number, content: string): void {
    if (this.cells[index]) {
      this.cells[index].content = content;
    }
  }

  onPreprocess(): void {
    this.dialog.open(DatasetOperationsModal, {
      width: '800px',
      data: { operation: 'preprocess' }
    });
  }

  onValidate(): void {
    this.dialog.open(DatasetOperationsModal, {
      width: '800px',
      data: { operation: 'validate' }
    });
  }

  onTrainTestSplit(): void {
    this.dialog.open(DatasetOperationsModal, {
      width: '800px',
      data: { operation: 'split' }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Dataset split into training and test sets', 'OK', { duration: 3000 });
      }
    });
  }

  saveNotebook(): void {
    try {
      const notebookData = {
        cells: this.cells,
        metadata: {
          lastSaved: new Date().toISOString(),
          name: 'Customer Purchase Analysis'
        }
      };
      
      localStorage.setItem('current_notebook', JSON.stringify(notebookData));
      this.snackBar.open('Notebook saved successfully', 'Dismiss', {
        duration: 2000
      });
    } catch (error) {
      console.error('Error saving notebook:', error);
      this.snackBar.open('Error saving notebook', 'Dismiss', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private loadNotebook(): void {
    try {
      const savedNotebook = localStorage.getItem('current_notebook');
      if (savedNotebook) {
        const notebookData = JSON.parse(savedNotebook);
        if (Array.isArray(notebookData.cells) && notebookData.cells.length > 0) {
          this.cells = notebookData.cells;
        }
      }
    } catch (error) {
      console.error('Error loading notebook:', error);
      this.snackBar.open('Error loading notebook', 'Dismiss', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  exportNotebook(): void {
    // In a real app, this would export the notebook as a file
    const notebookData = {
      cells: this.cells,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notebookData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `notebook-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    this.snackBar.open('Notebook exported successfully', 'OK', { duration: 2000 });
  }
}
