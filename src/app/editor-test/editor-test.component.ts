import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { NotebookCellComponent } from '../../components/notebook-cell/notebook-cell.component';

@Component({
  selector: 'app-editor-test',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    NotebookCellComponent
  ],
  template: `
    <div class="editor-test-container">
      <h1>Monaco Editor Test</h1>
      
      <div class="test-section">
        <h2>Code Cell</h2>
        <app-notebook-cell
          type="code"
          [content]="codeContent"
          [isExecuting]="isExecuting"
          (contentChange)="onCodeChange($event)"
          (execute)="onExecute($event)">
        </app-notebook-cell>
      </div>

      <div class="test-section">
        <h2>Markdown Cell</h2>
        <app-notebook-cell
          type="markdown"
          [content]="markdownContent"
          (contentChange)="onMarkdownChange($event)">
        </app-notebook-cell>
      </div>
    </div>
  `,
  styles: [`
    .editor-test-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .test-section {
      margin-bottom: 40px;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      background: white;
    }
    
    h1, h2 {
      color: #333;
    }
    
    h2 {
      margin-top: 0;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
  `]
})
export class EditorTestComponent {
  codeContent = `# Sample Python Code
import numpy as np

def hello_world():
    print("Hello, World!")
    return np.array([1, 2, 3])

# Try editing this code!`;

  markdownContent = `# Markdown Cell

This is a **markdown** cell with some example content.

## Features
- Edit the content
- Toggle between edit and preview modes
- See real-time updates

\`\`\`python
# You can include code blocks
def example():
    return "This is a code block"
\`\`\``;

  isExecuting = false;

  onCodeChange(newCode: string): void {
    console.log('Code changed:', newCode);
    this.codeContent = newCode;
  }

  onMarkdownChange(newMarkdown: string): void {
    console.log('Markdown changed:', newMarkdown);
    this.markdownContent = newMarkdown;
  }

  onExecute(code: string): void {
    console.log('Executing code:', code);
    this.isExecuting = true;
    
    // Simulate code execution
    setTimeout(() => {
      console.log('Code execution complete');
      this.isExecuting = false;
    }, 2000);
  }
}
