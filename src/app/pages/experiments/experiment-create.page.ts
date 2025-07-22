import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonTitle, IonToolbar, IonSelect, IonSelectOption, IonTextarea, IonIcon, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-experiment-create',
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonTextarea, IonIcon, IonSpinner],
  templateUrl: './experiment-create.page.html'
})
export class ExperimentCreatePage implements OnInit {
  experiment: any = { name: '', description: '', duration: 1, status: 'Draft' };
  durationOptions = [
    { label: '1 hour', value: 1 },
    { label: '6 hours', value: 6 },
    { label: '24 hours', value: 24 }
  ];
  artifactFile: File | null = null;
  artifactError = '';
  jsonError = '';
  showToast = false;
  toastMessage = '';
  variables: { key: string, value: string }[] = [];
  variablesKeyError = false;
  variablesDuplicateError = false;
  missingFields: string[] = [];
  datasets: any[] = [];
  projects: any[] = [];
  submitting = false;

  constructor(private http: HttpClient, public router: Router) {}

  ngOnInit() {
    this.loadDatasets();
    this.loadProjects();
    this.variables = [];
    this.experiment.variablesJson = '{}';
  }

  loadDatasets() {
    this.http.get<any[]>(`${environment.apiUrl}/api/Dataset`).subscribe(data => {
      this.datasets = data;
    });
  }

  loadProjects() {
    this.http.get<any[]>(`${environment.apiUrl}/api/Project`).subscribe(data => {
      this.projects = data;
    });
  }

  addVariable() {
    this.variables.push({ key: '', value: '' });
    this.syncVariablesJson();
  }

  removeVariable(i: number) {
    this.variables.splice(i, 1);
    this.syncVariablesJson();
  }

  onVariableChange() {
    this.syncVariablesJson();
  }

  syncVariablesJson() {
    this.variablesKeyError = this.variables.some(v => !v.key.trim());
    const keys = this.variables.map(v => v.key.trim());
    this.variablesDuplicateError = keys.length !== new Set(keys).size;
    if (!this.variablesKeyError && !this.variablesDuplicateError) {
      const obj: any = {};
      this.variables.forEach(v => { obj[v.key.trim()] = v.value; });
      this.experiment.variablesJson = JSON.stringify(obj);
      this.jsonError = '';
    } else {
      this.jsonError = this.variablesKeyError ? 'Parameter keys cannot be empty.' : 'Duplicate parameter keys are not allowed.';
    }
  }

  onFileChange(event: any) {
    this.artifactError = '';
    const file = event.target.files[0];
    if (file) {
      if (!['application/zip', 'application/json', 'application/x-zip-compressed', 'application/octet-stream'].includes(file.type) && !file.name.endsWith('.zip') && !file.name.endsWith('.json')) {
        this.artifactError = 'Only .zip or .json files are allowed.';
      } else if (file.size > 50 * 1024 * 1024) {
        this.artifactError = 'File size must be less than 50MB.';
      } else {
        this.artifactFile = file;
      }
    }
  }

  formInvalid() {
    return !this.experiment.name || this.experiment.name.length > 50 ||
      !this.experiment.projectId ||
      !this.artifactFile ||
      !!this.jsonError || !!this.artifactError || this.submitting;
  }

  async onSubmit(form: NgForm) {
    console.log('onSubmit called', this.experiment);
    this.syncVariablesJson();
    this.missingFields = [];
    if (!this.experiment.name || this.experiment.name.length > 50) this.missingFields.push('Name');
    if (!this.experiment.projectId) this.missingFields.push('Project');
    if (!this.artifactFile) this.missingFields.push('Artifact');
    if (form.invalid || this.jsonError || this.artifactError || this.missingFields.length) {
      this.showError('Please fix errors before submitting.' + (this.missingFields.length ? ' Missing: ' + this.missingFields.join(', ') : ''));
      return;
    }
    this.submitting = true;
    const formData = new FormData();
    formData.append('name', this.experiment.name);
    formData.append('description', this.experiment.description);
    formData.append('duration', String(this.experiment.duration));
    formData.append('status', this.experiment.status);
    formData.append('variablesJson', this.experiment.variablesJson);
    formData.append('projectId', String(this.experiment.projectId));
    if (this.artifactFile) {
      formData.append('artifactFile', this.artifactFile, this.artifactFile.name);
    }
    try {
      await this.http.post(`${environment.apiUrl}/api/Experiment`, formData).toPromise();
      this.toastMessage = 'Experiment created successfully!';
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
        this.router.navigate(['/experiments']);
      }, 1500);
    } catch (error: any) {
      console.error('Experiment creation failed:', error);
      this.showError(error?.message || 'Failed to create experiment.');
    } finally {
      this.submitting = false;
    }
  }

  showError(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 2500);
  }
} 