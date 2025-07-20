import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { monacoEditorProvider } from '../monaco-editor-config';

import { NotebookPageComponent } from './notebook-page.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [ 
    NotebookPageComponent
  ],
  providers: [monacoEditorProvider],
})
export class NotebookPageModule {}
