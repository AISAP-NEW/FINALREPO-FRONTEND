import { Component, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { NotebookService } from '../services/notebook.service';
import { CommonModule } from '@angular/common';
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

interface ModelCodeResponse {
  code?: string;
  [key: string]: any; // Allow for additional properties
}

// Monaco editor configuration
export const monacoEditorConfig = {
  baseUrl: './assets', // Use relative path for assets
  defaultOptions: {
    theme: 'vs-dark',
    language: 'python',
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    tabSize: 2,
    scrollBeyondLastLine: false,
    glyphMargin: true,
    lineNumbersMinChars: 3,
    folding: true,
    renderLineHighlight: 'all',
    fontFamily: 'Fira Code, monospace',
    formatOnPaste: true,
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    wordBasedSuggestions: true,
    quickSuggestions: true,
    suggestSelection: 'first',
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showVariables: true,
      showModules: true,
      showFiles: true,
      showReferences: true,
      showWords: true,
      showTypeParameters: true,
      showConstants: true,
      showConstructors: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showFolders: true,
      showReferencesCodeLens: true,
      showInlineHints: true
    }
  }
};

@Component({
  selector: 'app-notebook-panel',
  templateUrl: './notebook-panel.component.html',
  styleUrls: ['./notebook-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    MonacoEditorModule, 
    FormsModule
  ],
  providers: [
    { provide: NGX_MONACO_EDITOR_CONFIG, useValue: monacoEditorConfig }
  ]
})
export class NotebookPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() modelId?: number;
  code: string = '# Loading model code...\n';
  output: string = '';
  error: string = '';
  loading: boolean = true;
  private subscriptions = new Subscription();
  
  // Monaco editor options
  editorOptions = {
    theme: 'vs-dark',
    language: 'python',
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    tabSize: 2,
    scrollBeyondLastLine: false,
    glyphMargin: true,
    lineNumbersMinChars: 3,
    folding: true,
    renderLineHighlight: 'all',
    fontFamily: 'Fira Code, monospace',
    formatOnPaste: true,
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    wordBasedSuggestions: true,
    quickSuggestions: true,
    suggestSelection: 'first'
  };

  constructor(private notebookService: NotebookService) {}

  ngOnInit() {
    this.loadModel();
  }

  ngAfterViewInit() {
    // Additional initialization after view is ready
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadModel() {
    if (!this.modelId) {
      this.code = '# No model selected. Please provide a valid model ID.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.output = '';
    this.error = '';

    const sub = this.notebookService.getCode(this.modelId).subscribe({
      next: (response: string | ModelCodeResponse) => {
        try {
          // Handle different response formats
          if (typeof response === 'string') {
            this.code = response;
          } else if (response && 'code' in response && response.code) {
            this.code = response.code;
          } else {
            this.code = JSON.stringify(response, null, 2);
          }
          this.loading = false;
        } catch (err) {
          this.handleError('Failed to parse model code', err);
        }
      },
      error: (err) => this.handleError('Failed to load model code', err)
    });

    this.subscriptions.add(sub);
  }

  private handleError(message: string, error: any) {
    console.error(`${message}:`, error);
    this.error = `${message}: ${error?.message || 'Unknown error'}`;
    this.loading = false;
  }

  /**
   * Called when the Monaco editor is initialized
   * @param editor The Monaco editor instance
   */
  onEditorInit(editor: any) {
    // You can access the editor instance here if needed
    console.log('Monaco editor initialized');
    
    // Example: Auto-format code on initialization
    setTimeout(() => {
      editor.getAction('editor.action.formatDocument').run();
    }, 100);
  }

  /**
   * Execute the current code in the editor
   */
  runCode() {
    if (!this.code?.trim()) {
      this.error = 'No code to execute. Please load a model first.';
      return;
    }

    this.loading = true;
    this.output = '';
    this.error = '';
    
    const sub = this.notebookService.executeCode(this.code).subscribe({
      next: (response) => {
        try {
          // Handle different response formats
          if (response === null || response === undefined) {
            this.output = 'Code executed successfully (no output)';
          } else if (typeof response === 'string') {
            this.output = response;
          } else if (response.stdout || response.stderr) {
            // Handle { stdout: string, stderr: string } format
            if (response.stdout) this.output = response.stdout;
            if (response.stderr) this.error = response.stderr;
            if (!response.stdout && !response.stderr) {
              this.output = 'Code executed successfully (no output)';
            }
          } else {
            // Handle other object types by stringifying
            this.output = JSON.stringify(response, null, 2);
          }
        } catch (err) {
          this.handleError('Error processing execution result', err);
        } finally {
          this.loading = false;
        }
      },
      error: (err) => {
        this.handleError('Execution failed', err);
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Clear the output console
   */
  clearOutput() {
    this.output = '';
    this.error = '';
  }

  /**
   * Handle editor content changes
   */
  onCodeChange(code: string) {
    this.code = code;
    // You can add auto-save or other change handling here
  }
}
