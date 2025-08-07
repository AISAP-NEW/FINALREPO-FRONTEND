import { NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor';
import { Provider } from '@angular/core';

export const monacoEditorProvider: Provider = {
  provide: NGX_MONACO_EDITOR_CONFIG,
  useValue: {
    baseUrl: 'assets', // path to Monaco assets
    defaultOptions: { scrollBeyondLastLine: false },
    onMonacoLoad: () => {
      // You can add global Monaco config here if needed
    }
  }
};
