import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

import { DatasetService, ValidationResponse, SplitResponse, PreprocessOptions } from '../../services/dataset.service';
import { ModelService } from '../../services/model.service';
import { DatasetSplitDialogComponent } from '../../components/dataset-split-dialog/dataset-split-dialog.component';
import { NotebookCellComponent } from '../../components/notebook-cell/notebook-cell.component';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

interface NotebookCell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: {
    type: 'text' | 'table' | 'error';
    data: any;
  };
  isExecuting?: boolean;
}

interface DatasetSchema {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    uniqueCount?: number;
    nullCount?: number;
  };
}

@Component({
  selector: 'app-notebook',
  templateUrl: './notebook.page.html',
  styleUrls: ['./notebook.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    NotebookCellComponent,
    MarkdownPipe
  ]
})
export class NotebookPage implements OnInit, OnDestroy {
  datasetId: string = '';
  datasetName: string = 'Loading...';
  selectedDataTab: 'schema' | 'preview' = 'schema';
  notebookCells: NotebookCell[] = [];
  datasetSchema: DatasetSchema[] = [];
  datasetPreview: any = { columns: [], data: [] };
  displayedColumns: string[] = [];
  validationResult: ValidationResponse | null = null;
  isProcessing = false;
  trainTestSplit: { train: number; test: number } = { train: 70, test: 30 };
  splitOptions = [
    { label: '70/30', value: { train: 70, test: 30 } },
    { label: '80/20', value: { train: 80, test: 20 } },
    { label: '60/40', value: { train: 60, test: 40 } },
    { label: '50/50', value: { train: 50, test: 50 } }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datasetService: DatasetService,
    private modelService: ModelService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.datasetId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.datasetId) {
      this.snackBar.open('No dataset ID provided', 'Close', { duration: 3000 });
      this.router.navigate(['/datasets']);
      return;
    }
    this.loadDatasetInfo();
    this.initializeNotebook();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private loadDatasetInfo(): void {
    // Load dataset schema
    this.datasetService.getDatasetSchema(this.datasetId).subscribe({
      next: (schema: any) => {
        this.datasetSchema = schema.fields || [];
        this.datasetName = schema.name || 'Unnamed Dataset';
      },
      error: (error) => {
        console.error('Error loading schema:', error);
        this.snackBar.open('Failed to load dataset schema', 'Close', { duration: 3000 });
      }
    });

    // Load dataset preview
    this.datasetService.getDatasetContent(this.datasetId).subscribe({
      next: (preview: any) => {
        if (preview.content && typeof preview.content === 'string') {
          // Parse CSV content if needed
          const lines = preview.content.split('\n');
          if (lines.length > 0) {
            this.datasetPreview.columns = lines[0].split(',');
            this.datasetPreview.data = lines.slice(1, 6).map((line: string) => {
              const values = line.split(',');
              return this.datasetPreview.columns.reduce((obj: any, key: string, index: number) => {
                obj[key] = values[index] || '';
                return obj;
              }, {});
            });
            this.displayedColumns = [...this.datasetPreview.columns];
          }
        }
      },
      error: (error) => {
        console.error('Error loading preview:', error);
        this.snackBar.open('Failed to load dataset preview', 'Close', { duration: 3000 });
      }
    });
  }

  private initializeNotebook(): void {
    this.notebookCells = [
      {
        id: this.generateId(),
        type: 'markdown',
        content: `# Dataset Analysis\n\nThis notebook analyzes the dataset: **${this.datasetName}**`
      },
      {
        id: this.generateId(),
        type: 'code',
        content: `# Load and prepare dataset\nimport pandas as pd\n\n# Load dataset\ndf = pd.read_csv('dataset_${this.datasetId}.csv')\n\n# Display basic info\nprint("Dataset shape:", df.shape)\nprint("\\nColumn types:")\nprint(df.dtypes)`
      }
    ];
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  addCell(type: 'code' | 'markdown'): void {
    const newCell: NotebookCell = {
      id: this.generateId(),
      type,
      content: type === 'code' ? '# Your code here' : 'Double click to edit markdown'
    };
    this.notebookCells = [...this.notebookCells, newCell];
  }

  deleteCell(cellId: string): void {
    if (this.notebookCells.length <= 1) {
      this.snackBar.open('Cannot delete the last cell', 'Close', { duration: 3000 });
      return;
    }
    this.notebookCells = this.notebookCells.filter(cell => cell.id !== cellId);
  }

  moveCell(cellId: string, direction: 'up' | 'down'): void {
    const index = this.notebookCells.findIndex(cell => cell.id === cellId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.notebookCells.length) return;

    const cells = [...this.notebookCells];
    [cells[index], cells[newIndex]] = [cells[newIndex], cells[index]];
    this.notebookCells = cells;
  }

  executeCell(cell: NotebookCell, content: string): void {
    cell.content = content;
    cell.isExecuting = true;

    // In a real implementation, this would call a backend service to execute the code
    // For now, we'll simulate execution with mock results
    setTimeout(() => {
      cell.isExecuting = false;
      
      // Mock execution results based on content
      if (content.includes('df.describe()')) {
        cell.output = {
          type: 'table',
          data: {
            columns: this.datasetPreview.columns.filter((col: string) => 
              this.datasetSchema.some((s: any) => s.name === col && s.type === 'number')
            ),
            data: [
              // Mock statistics
              ['count', '100.0', '100.0'],
              ['mean', '42.35', '78500.00'],
              ['std', '12.45', '25000.00'],
              ['min', '18.00', '30000.00'],
              ['25%', '32.00', '60000.00'],
              ['50%', '41.00', '75000.00'],
              ['75%', '52.00', '90000.00'],
              ['max', '70.00', '200000.00']
            ]
          }
        };
      } else if (content.includes('df.shape')) {
        cell.output = {
          type: 'text',
          data: `Dataset shape: (${this.datasetPreview.data?.length || 0}, ${this.datasetPreview.columns?.length || 0})`
        };
      } else if (content.includes('df.dtypes')) {
        const dtypes = this.datasetSchema.map((s: any) => `${s.name.padEnd(12)} ${s.type}`).join('\n');
        cell.output = {
          type: 'text',
          data: dtypes || 'No schema information available'
        };
      } else {
        cell.output = {
          type: 'text',
          data: 'Code executed successfully.'
        };
      }
    }, 1000);
  }

  onCellContentChange(cell: NotebookCell, content: string): void {
    cell.content = content;
  }

  onPreprocess(): void {
    this.isProcessing = true;
    const options: PreprocessOptions = {
      handleMissingValues: true,
      removeDuplicates: true,
      fixDataTypes: true,
      scalingMethod: 'standard'
    };

    this.datasetService.preprocessDataset(this.datasetId, options).subscribe({
      next: (response) => {
        this.snackBar.open('Dataset preprocessed successfully', 'Close', { duration: 3000 });
        this.loadDatasetInfo(); // Refresh dataset info
      },
      error: (error) => {
        console.error('Error preprocessing dataset:', error);
        this.snackBar.open('Failed to preprocess dataset', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.isProcessing = false;
      }
    });
  }

  onValidate(): void {
    this.isProcessing = true;
    this.datasetService.validateDataset(this.datasetId).subscribe({
      next: (response) => {
        this.validationResult = response;
        if (response.status === 'success' || response.status === 'warning') {
          this.snackBar.open(`Validation ${response.status}: ${response.message}`, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open(`Validation failed: ${response.message}`, 'Close', { duration: 5000 });
        }
      },
      error: (error) => {
        console.error('Error validating dataset:', error);
        this.snackBar.open('Failed to validate dataset', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.isProcessing = false;
      }
    });
  }

  onTrainTestSplit(): void {
    const dialogRef = this.dialog.open(DatasetSplitDialogComponent, {
      width: '400px',
      data: { 
        trainRatio: this.trainTestSplit.train,
        testRatio: this.trainTestSplit.test,
        splitOptions: this.splitOptions
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performSplit(result.train, result.test);
      }
    });
  }

  private performSplit(trainRatio: number, testRatio: number): void {
    this.isProcessing = true;
    this.datasetService.splitDataset(this.datasetId, trainRatio, testRatio).subscribe({
      next: (response) => {
        this.snackBar.open(
          `Dataset split completed: ${response.trainCount} training, ${response.testCount} test samples`,
          'Close',
          { duration: 5000 }
        );
        // Update UI with split information if needed
      },
      error: (error) => {
        console.error('Error splitting dataset:', error);
        this.snackBar.open('Failed to split dataset', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.isProcessing = false;
      }
    });
  }

  saveNotebook(): void {
    // In a real implementation, this would save the notebook to the backend
    const notebookData = {
      cells: this.notebookCells,
      datasetId: this.datasetId,
      lastModified: new Date().toISOString()
    };
    
    // For now, just show a success message
    this.snackBar.open('Notebook saved successfully', 'Close', { duration: 2000 });
    console.log('Saving notebook:', notebookData);
  }

  exportNotebook(): void {
    const dataStr = 'data:text/json;charset=utf-8,' + 
      encodeURIComponent(JSON.stringify(this.notebookCells, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `notebook_${this.datasetId}_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    this.snackBar.open('Notebook exported successfully', 'Close', { duration: 2000 });
  }

  onTabChange(event: any): void {
    // Handle tab changes if needed
  }

  getValidationIcon(): string {
    if (!this.validationResult) return 'help_outline';
    
    switch (this.validationResult.status) {
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'help_outline';
    }
  }

  getColumnType(columnName: string): string {
    const column = this.datasetSchema.find((col: any) => col.name === columnName);
    return column?.type || 'string';
  }

  executeAllCells(): void {
    // Execute all code cells
    this.notebookCells.forEach(cell => {
      if (cell.type === 'code') {
        this.executeCell(cell, cell.content);
      }
    });
  }
}
