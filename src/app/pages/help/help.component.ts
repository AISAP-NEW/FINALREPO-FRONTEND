import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonSearchbar,
  IonChip,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  helpCircleOutline, 
  peopleOutline, 
  folderOutline, 
  cloudUploadOutline,
  barChartOutline,
  settingsOutline,
  documentTextOutline,
  rocketOutline,
  shieldCheckmarkOutline,
  searchOutline,
  refreshOutline
} from 'ionicons/icons';

interface HelpSection {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  matchInfo?: {
    matches: MatchInfo[];
    totalMatches: number;
  };
}

interface MatchInfo {
  type: 'title' | 'content' | 'tag' | 'category';
  text: string;
  context: string;
  position?: number;
}

@Component({
  selector: 'app-help',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <ion-icon name="help-circle-outline"></ion-icon>
          Help & Documentation
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- SEARCH BAR SECTION -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: 0;">
        <div style="text-align: center; margin-bottom: 16px;">
          <h2 style="margin: 0 0 8px 0; color: white;">Search Help Topics</h2>
          <p style="margin: 0; opacity: 0.9;">Find answers quickly by searching below</p>
        </div>
        
        <ion-searchbar 
          [(ngModel)]="searchTerm" 
          (ionInput)="filterContent($event)"
          placeholder="Search help topics, features, troubleshooting..."
          show-clear-button="focus"
          debounce="300"
          style="--background: white; --color: #333; --border-radius: 12px;"
        ></ion-searchbar>
        
        <div *ngIf="searchTerm && searchTerm.length > 0" style="margin-top: 12px; display: flex; gap: 8px;">
          <ion-chip color="light" *ngIf="filteredSections.length > 0">
            <ion-label>{{ filteredSections.length }} results found</ion-label>
          </ion-chip>
          <ion-chip color="warning" *ngIf="filteredSections.length === 0">
            <ion-label>No results found</ion-label>
          </ion-chip>
        </div>
        
        <div *ngIf="!searchTerm || searchTerm.length === 0" style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
          <ion-chip 
            *ngFor="let tag of quickFilterTags" 
            (click)="applyQuickFilter(tag)"
            [color]="selectedQuickFilter === tag ? 'light' : 'medium'"
            style="cursor: pointer;"
          >
            <ion-label>{{ tag }}</ion-label>
          </ion-chip>
        </div>
      </div>
      
      <!-- SEARCH RESULTS SECTION - Show detailed matches when searching -->
      <div *ngIf="searchTerm && searchTerm.length > 0 && filteredSections.length > 0" style="padding: 20px; background: #f8f9fa;">
        <h3 style="color: #333; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <ion-icon name="search-outline" color="primary"></ion-icon>
          Search Results for "{{ searchTerm }}"
        </h3>
        
        <div *ngFor="let section of filteredSections" style="margin-bottom: 24px; background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="color: #667eea; margin: 0;">{{ section.title }}</h4>
            <ion-chip color="primary" *ngIf="section.matchInfo">
              <ion-label>{{ section.matchInfo.totalMatches }} matches</ion-label>
            </ion-chip>
          </div>
          
          <div *ngIf="section.matchInfo" style="display: flex; flex-direction: column; gap: 8px;">
            <div *ngFor="let match of section.matchInfo.matches" 
                 style="padding: 8px 12px; background: #f1f3f4; border-radius: 6px; border-left: 3px solid #667eea;">
              <div style="font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; font-weight: 500;">
                {{ match.type }}
              </div>
              <div [innerHTML]="match.text" style="line-height: 1.4;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        <!-- Welcome Section -->
        <div *ngIf="shouldShowSection('welcome')">
        <ion-card class="welcome-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="rocket-outline" color="primary"></ion-icon>
            Welcome to AISAP - AI Solutions & Analytics Platform
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>
            <strong>AISAP</strong> is your comprehensive enterprise platform for managing machine learning projects from conception to deployment. 
            This system streamlines the entire ML lifecycle, helping you organize clients, manage datasets, train models, deploy solutions, 
            and monitor performance with enterprise-grade security and scalability.
          </p>
          <p>
            <strong>Key Benefits:</strong>
          </p>
          <ul>
            <li>🎯 <strong>Centralized Management:</strong> All your ML projects in one place</li>
            <li>🔒 <strong>Role-Based Security:</strong> Granular access control and permissions</li>
            <li>📊 <strong>Real-time Analytics:</strong> Monitor model performance and system metrics</li>
            <li>🚀 <strong>Automated Deployment:</strong> Seamless model deployment and scaling</li>
            <li>👥 <strong>Team Collaboration:</strong> Multi-user support with project sharing</li>
          </ul>
        </ion-card-content>
      </ion-card>
      </div>

      <!-- Quick Start Guide -->
      <div *ngIf="shouldShowSection('quick-start')">
      <ion-card>
        <ion-card-header>
          <ion-card-title>🚀 Quick Start Guide - Your First ML Project</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p><strong>Follow these steps to get started with your first machine learning project:</strong></p>
          
          <ion-list>
            <ion-item>
              <ion-label>
                <h3>1. 👤 Set Up Your Client</h3>
                <p><strong>Navigate to:</strong> Clients → Add New Client</p>
                <p><strong>Required Information:</strong></p>
                <ul>
                  <li>Client name and contact details</li>
                  <li>South African phone number (format: +27XX XXX XXXX or 0XX XXX XXXX)</li>
                  <li>Business sector and project requirements</li>
                </ul>
                <p><strong>Tip:</strong> Complete client profiles help with project organization and reporting</p>
              </ion-label>
            </ion-item>
            
            <ion-item>
              <ion-label>
                <h3>2. 📁 Create Your Project</h3>
                <p><strong>Navigate to:</strong> Projects → New Project</p>
                <p><strong>Best Practices:</strong></p>
                <ul>
                  <li>Use descriptive project names (e.g., "Customer_Churn_Prediction_2024")</li>
                  <li>Associate with the correct client</li>
                  <li>Set realistic timelines and milestones</li>
                  <li>Define clear success metrics</li>
                </ul>
                <p><strong>Project Types:</strong> Classification, Regression, NLP, Computer Vision, Time Series</p>
              </ion-label>
            </ion-item>
            
            <ion-item>
              <ion-label>
                <h3>3. 📊 Upload & Prepare Your Dataset</h3>
                <p><strong>Navigate to:</strong> Datasets → Upload Dataset</p>
                <p><strong>Supported Formats:</strong> CSV, JSON, Parquet, Excel (.xlsx)</p>
                <p><strong>Data Preparation Checklist:</strong></p>
                <ul>
                  <li>✅ Clean column names (no spaces or special characters)</li>
                  <li>✅ Handle missing values appropriately</li>
                  <li>✅ Ensure consistent data types</li>
                  <li>✅ Remove or encode categorical variables</li>
                  <li>✅ Validate data quality and completeness</li>
                </ul>
                <p><strong>Size Limits:</strong> Up to 500MB per file, 10GB total per project</p>
              </ion-label>
            </ion-item>
            
            <ion-item>
              <ion-label>
                <h3>4. 🤖 Create & Train Your Model</h3>
                <p><strong>Navigate to:</strong> Models → New Model</p>
                <p><strong>Model Configuration:</strong></p>
                <ul>
                  <li>Select algorithm type (Random Forest, XGBoost, Neural Network, etc.)</li>
                  <li>Configure hyperparameters</li>
                  <li>Set training/validation split (recommended: 80/20)</li>
                  <li>Choose evaluation metrics</li>
                </ul>
                <p><strong>Training Tips:</strong></p>
                <ul>
                  <li>Start with simple models before complex ones</li>
                  <li>Monitor training progress in real-time</li>
                  <li>Use cross-validation for robust evaluation</li>
                </ul>
              </ion-label>
            </ion-item>
            
            <ion-item>
              <ion-label>
                <h3>5. 🚀 Deploy & Monitor</h3>
                <p><strong>Navigate to:</strong> Deployments → Deploy Model</p>
                <p><strong>Deployment Options:</strong></p>
                <ul>
                  <li>🌐 <strong>REST API:</strong> For web applications and services</li>
                  <li>📱 <strong>Batch Processing:</strong> For large-scale data processing</li>
                  <li>⚡ <strong>Real-time Inference:</strong> For low-latency applications</li>
                </ul>
                <p><strong>Monitoring Features:</strong></p>
                <ul>
                  <li>Performance metrics and accuracy tracking</li>
                  <li>Request volume and response times</li>
                  <li>Model drift detection and alerts</li>
                  <li>Automated retraining triggers</li>
                </ul>
              </ion-label>
            </ion-item>
          </ion-list>
          
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h4>💡 Pro Tip: First Project Success</h4>
            <p>Start with a small, well-defined problem and clean dataset. This helps you learn the platform workflow before tackling complex projects.</p>
          </div>
        </ion-card-content>
      </ion-card>
      </div>

      <!-- Feature Documentation -->
      <div *ngIf="shouldShowSection('features')">
      <ion-accordion-group>
        <!-- Client Management -->
        <ion-accordion value="clients">
          <ion-item slot="header">
            <ion-icon name="people-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>Client Management</h2>
              <p>Manage your clients and their contact information</p>
            </ion-label>
          </ion-item>
          <div slot="content" class="accordion-content">
            <h3>📋 Client Management Overview:</h3>
            <p>The Client Management system helps you organize and maintain relationships with your business clients, track their projects, and manage contact information efficiently.</p>
            
            <h3>🔧 Key Features:</h3>
            <ul>
              <li><strong>📝 Add New Clients:</strong> Create comprehensive client profiles with contact details</li>
              <li><strong>📞 Phone Validation:</strong> Automatic South African phone number validation and formatting</li>
              <li><strong>🔗 Project Linking:</strong> Associate multiple projects with specific clients</li>
              <li><strong>📊 Client Analytics:</strong> Track project history and performance metrics per client</li>
              <li><strong>🔍 Search & Filter:</strong> Quickly find clients using advanced search options</li>
              <li><strong>📋 Export Data:</strong> Export client lists and reports in various formats</li>
            </ul>

            <h3>📝 How to Add a New Client:</h3>
            <ol>
              <li><strong>Navigate:</strong> Go to Clients → Add New Client</li>
              <li><strong>Basic Information:</strong>
                <ul>
                  <li>Client Name (required)</li>
                  <li>Company/Organization</li>
                  <li>Industry sector</li>
                </ul>
              </li>
              <li><strong>Contact Details:</strong>
                <ul>
                  <li>Email address (required)</li>
                  <li>Phone number (SA format: +27XX XXX XXXX or 0XX XXX XXXX)</li>
                  <li>Physical address</li>
                  <li>Postal address (if different)</li>
                </ul>
              </li>
              <li><strong>Project Information:</strong>
                <ul>
                  <li>Project requirements and scope</li>
                  <li>Budget range and timeline</li>
                  <li>Technical specifications</li>
                </ul>
              </li>
              <li><strong>Save:</strong> Click "Save Client" to create the profile</li>
            </ol>

            <h3>📞 Phone Number Validation:</h3>
            <p><strong>Supported South African Formats:</strong></p>
            <ul>
              <li>✅ <code>+27 11 123 4567</code> (International format)</li>
              <li>✅ <code>+2711 123 4567</code> (International without spaces)</li>
              <li>✅ <code>011 123 4567</code> (National format)</li>
              <li>✅ <code>0111234567</code> (National without spaces)</li>
              <li>✅ <code>27111234567</code> (International without +)</li>
            </ul>
            
            <h3>🔧 Troubleshooting Common Issues:</h3>
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;">
              <h4>❌ Phone Number Rejected:</h4>
              <p><strong>Problem:</strong> "Invalid phone number format" error</p>
              <p><strong>Solution:</strong></p>
              <ul>
                <li>Ensure the number starts with +27, 27, or 0</li>
                <li>Check that the area code is valid (011, 012, 021, 031, 041, 051, 061, 071-084)</li>
                <li>Remove any extra characters like brackets or dashes</li>
                <li>Example: Change "(011) 123-4567" to "011 123 4567"</li>
              </ul>
            </div>

            <div style="background: #d1ecf1; padding: 10px; border-radius: 5px; margin: 10px 0;">
              <h4>💡 Best Practices:</h4>
              <ul>
                <li><strong>Complete Profiles:</strong> Fill in all available fields for better project management</li>
                <li><strong>Regular Updates:</strong> Keep contact information current</li>
                <li><strong>Consistent Naming:</strong> Use consistent naming conventions for easy searching</li>
                <li><strong>Project Association:</strong> Always link new projects to the correct client</li>
              </ul>
            </div>

            <h3>📊 Client Analytics & Reports:</h3>
            <ul>
              <li><strong>Project History:</strong> View all projects associated with each client</li>
              <li><strong>Performance Metrics:</strong> Track project success rates and timelines</li>
              <li><strong>Revenue Tracking:</strong> Monitor project values and billing status</li>
              <li><strong>Communication Log:</strong> Record of all client interactions</li>
            </ul>
          </div>
        </ion-accordion>

        <!-- Project Management -->
        <ion-accordion value="projects">
          <ion-item slot="header">
            <ion-icon name="folder-outline" slot="start" color="secondary"></ion-icon>
            <ion-label>
              <h2>Project Management</h2>
              <p>Organize and track your ML projects</p>
            </ion-label>
          </ion-item>
          <div slot="content" class="accordion-content">
            <h3>Features:</h3>
            <ul>
              <li><strong>Project Creation:</strong> Set up new ML projects</li>
              <li><strong>Client Association:</strong> Link projects to clients</li>
              <li><strong>Project Tracking:</strong> Monitor project progress and status</li>
              <li><strong>Resource Management:</strong> Organize datasets and models per project</li>
            </ul>
          </div>
        </ion-accordion>

        <!-- Dataset Management -->
        <ion-accordion value="datasets">
          <ion-item slot="header">
            <ion-icon name="document-text-outline" slot="start" color="tertiary"></ion-icon>
            <ion-label>
              <h2>Dataset Management</h2>
              <p>Upload, validate, and preprocess your training data</p>
            </ion-label>
          </ion-item>
          <div slot="content" class="accordion-content">
            <h3>Dataset Workflow:</h3>
            <ul>
              <li><strong>Upload:</strong> Import your datasets from various sources</li>
              <li><strong>Validation:</strong> Check data quality and integrity</li>
              <li><strong>Preprocessing:</strong> Clean and prepare data for training</li>
              <li><strong>Data Splitting:</strong> Create train/validation/test splits</li>
            </ul>
            <h3>Supported Formats:</h3>
            <p>CSV, JSON, Excel, and other common data formats</p>
          </div>
        </ion-accordion>

        <!-- Model Management -->
        <ion-accordion value="models">
          <ion-item slot="header">
            <ion-icon name="bar-chart-outline" slot="start" color="success"></ion-icon>
            <ion-label>
              <h2>Model Management</h2>
              <p>Train, evaluate, and manage your ML models</p>
            </ion-label>
          </ion-item>
          <div slot="content" class="accordion-content">
            <h3>Model Features:</h3>
            <ul>
              <li><strong>Model Upload:</strong> Import pre-trained models</li>
              <li><strong>Training Dashboard:</strong> Monitor training progress in real-time</li>
              <li><strong>Model Evaluation:</strong> View performance metrics and results</li>
              <li><strong>Version Control:</strong> Track different model versions</li>
            </ul>
            <h3>Training Process:</h3>
            <ol>
              <li>Select your prepared dataset</li>
              <li>Configure training parameters</li>
              <li>Monitor training progress</li>
              <li>Evaluate model performance</li>
            </ol>
          </div>
        </ion-accordion>

        <!-- Deployments -->
        <ion-accordion value="deployments">
          <ion-item slot="header">
            <ion-icon name="cloud-upload-outline" slot="start" color="warning"></ion-icon>
            <ion-label>
              <h2>Model Deployment</h2>
              <p>Deploy your trained models to production</p>
            </ion-label>
          </ion-item>
          <div slot="content" class="accordion-content">
            <h3>🚀 Model Deployment Overview:</h3>
            <p>The Deployment system enables you to take your trained models from development to production, making them accessible to end-users and applications through various deployment methods.</p>
            
            <h3>🔧 Deployment Options:</h3>
            <ul>
              <li><strong>🌐 REST API Deployment:</strong> Create HTTP endpoints for real-time predictions</li>
              <li><strong>📱 Batch Processing:</strong> Deploy models for large-scale data processing</li>
              <li><strong>⚡ Real-time Inference:</strong> Low-latency predictions for time-sensitive applications</li>
              <li><strong>☁️ Cloud Deployment:</strong> Deploy to AWS, Azure, or Google Cloud platforms</li>
              <li><strong>🐳 Container Deployment:</strong> Docker-based deployments for scalability</li>
              <li><strong>📊 A/B Testing:</strong> Deploy multiple model versions for comparison</li>
            </ul>

            <h3>📝 How to Deploy a Model:</h3>
            <ol>
              <li><strong>Select Model:</strong> Choose a trained and validated model from your Models page</li>
              <li><strong>Choose Deployment Type:</strong>
                <ul>
                  <li><strong>REST API:</strong> For web applications and mobile apps</li>
                  <li><strong>Batch:</strong> For processing large datasets offline</li>
                  <li><strong>Streaming:</strong> For real-time data processing</li>
                </ul>
              </li>
              <li><strong>Configure Settings:</strong>
                <ul>
                  <li>Resource allocation (CPU, memory, GPU)</li>
                  <li>Auto-scaling parameters</li>
                  <li>Security and authentication settings</li>
                  <li>Monitoring and logging preferences</li>
                </ul>
              </li>
              <li><strong>Test Deployment:</strong> Run test predictions before going live</li>
              <li><strong>Deploy:</strong> Launch your model to production</li>
            </ol>

            <h3>🔍 Monitoring & Performance:</h3>
            <ul>
              <li><strong>📈 Real-time Metrics:</strong> Request volume, response times, error rates</li>
              <li><strong>🎯 Accuracy Tracking:</strong> Monitor model performance over time</li>
              <li><strong>🚨 Alerting:</strong> Automatic alerts for performance degradation</li>
              <li><strong>📊 Usage Analytics:</strong> Track API usage patterns and costs</li>
              <li><strong>🔄 Model Drift Detection:</strong> Identify when models need retraining</li>
            </ul>

            <h3>🔧 Troubleshooting Deployment Issues:</h3>
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;">
              <h4>❌ Deployment Failed:</h4>
              <p><strong>Common Causes & Solutions:</strong></p>
              <ul>
                <li><strong>Insufficient Resources:</strong> Increase CPU/memory allocation</li>
                <li><strong>Model Size Too Large:</strong> Optimize model or use model compression</li>
                <li><strong>Dependencies Missing:</strong> Ensure all required packages are included</li>
                <li><strong>Port Conflicts:</strong> Check if the specified port is available</li>
              </ul>
            </div>

            <div style="background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0;">
              <h4>⚠️ High Response Times:</h4>
              <p><strong>Performance Optimization:</strong></p>
              <ul>
                <li><strong>Scale Up:</strong> Increase instance size or add more replicas</li>
                <li><strong>Caching:</strong> Implement prediction caching for repeated requests</li>
                <li><strong>Model Optimization:</strong> Use quantization or pruning techniques</li>
                <li><strong>Load Balancing:</strong> Distribute requests across multiple instances</li>
              </ul>
            </div>

            <h3>🔐 Security & Best Practices:</h3>
            <ul>
              <li><strong>API Authentication:</strong> Use API keys or OAuth for secure access</li>
              <li><strong>Rate Limiting:</strong> Prevent abuse with request rate limits</li>
              <li><strong>Data Encryption:</strong> Encrypt data in transit and at rest</li>
              <li><strong>Version Control:</strong> Maintain deployment versioning for rollbacks</li>
              <li><strong>Health Checks:</strong> Implement automated health monitoring</li>
            </ul>

            <h3>💰 Cost Management:</h3>
            <ul>
              <li><strong>Resource Optimization:</strong> Right-size your deployments</li>
              <li><strong>Auto-scaling:</strong> Scale down during low usage periods</li>
              <li><strong>Usage Monitoring:</strong> Track costs and set budget alerts</li>
              <li><strong>Spot Instances:</strong> Use cost-effective compute options when available</li>
            </ul>
          </div>
        </ion-accordion>

        <!-- Reports & Analytics -->
        <ion-accordion value="reports">
          <ion-item slot="header">
            <ion-icon name="bar-chart-outline" slot="start" color="danger"></ion-icon>
            <ion-label>
              <h2>Reports & Analytics</h2>
              <p>Generate insights and performance reports</p>
            </ion-label>
          </ion-item>
          <div slot="content" class="accordion-content">
            <h3>Available Reports:</h3>
            <ul>
              <li><strong>Project Reports:</strong> Overall project progress and metrics</li>
              <li><strong>Model Performance:</strong> Training and validation metrics</li>
              <li><strong>Usage Analytics:</strong> Deployment usage statistics</li>
              <li><strong>Client Reports:</strong> Client-specific project summaries</li>
            </ul>
          </div>
        </ion-accordion>

        <!-- User Management -->
        <ion-accordion value="users">
          <ion-item slot="header">
            <ion-icon name="shield-checkmark-outline" slot="start" color="medium"></ion-icon>
            <ion-label>
              <h2>User Management</h2>
              <p>Manage team members and access permissions</p>
            </ion-label>
          </ion-item>
          <div slot="content" class="accordion-content">
            <h3>User Roles:</h3>
            <ul>
              <li><strong>Developer:</strong> Full access to development features</li>
              <li><strong>Lead Developer:</strong> Additional project management permissions</li>
              <li><strong>Project Manager:</strong> Project oversight and client management</li>
              <li><strong>Client:</strong> Limited access to project status and reports</li>
            </ul>
            <h3>Access Control:</h3>
            <ul>
              <li>Role-based permissions</li>
              <li>Project-specific access</li>
              <li>Secure authentication with session timeout</li>
            </ul>
          </div>
        </ion-accordion>
      </ion-accordion-group>
      </div>

      <!-- No Results Message -->
      <div class="no-results" *ngIf="searchTerm && filteredSections.length === 0">
        <ion-card>
          <ion-card-content class="text-center">
            <ion-icon name="search-outline" size="large" color="medium"></ion-icon>
            <h3>No results found</h3>
            <p>Try searching for different keywords or browse the categories above.</p>
            <ion-button fill="clear" (click)="clearSearch()">
              <ion-icon name="refresh-outline" slot="start"></ion-icon>
              Clear Search
            </ion-button>
          </ion-card-content>
        </ion-card>
        </div>
      </div>

      <!-- Security & Session Info -->
      <div class="content-area">
      <ion-card class="security-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="shield-checkmark-outline" color="success"></ion-icon>
            Security & Session Management
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p><strong>Session Timeout:</strong> For security, your session will automatically expire after 30 seconds of inactivity. You'll receive a warning 10 seconds before timeout.</p>
          <p><strong>Data Security:</strong> All data is encrypted and securely stored. Access is controlled through role-based permissions.</p>
        </ion-card-content>
      </ion-card>

      <!-- Support Section -->
      <ion-card class="support-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="help-circle-outline" color="primary"></ion-icon>
            Need More Help?
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>If you need additional assistance or have questions not covered in this guide:</p>
          <ul>
            <li>Contact your system administrator</li>
            <li>Check with your project lead</li>
            <li>Review the project documentation</li>
          </ul>
        </ion-card-content>
      </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .welcome-card {
      background: linear-gradient(135deg, var(--ion-color-primary-tint), var(--ion-color-secondary-tint));
      color: white;
    }

    .welcome-card ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
    }

    .accordion-content {
      padding: 16px;
    }

    .accordion-content h3 {
      color: var(--ion-color-primary);
      margin-top: 16px;
      margin-bottom: 8px;
    }

    .accordion-content ul, .accordion-content ol {
      margin: 8px 0;
      padding-left: 20px;
    }

    .accordion-content li {
      margin: 4px 0;
      line-height: 1.4;
    }

    .security-card {
      border-left: 4px solid var(--ion-color-success);
    }

    .support-card {
      border-left: 4px solid var(--ion-color-primary);
    }

    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    ion-accordion ion-item {
      --padding-start: 16px;
    }

    ion-accordion ion-item ion-icon {
      margin-right: 12px;
    }

    ion-header ion-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-section-top {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px 20px;
      margin: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .search-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .search-header h3 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: white;
    }

    .search-header p {
      font-size: 16px;
      margin: 0;
      opacity: 0.9;
      color: white;
    }

    .prominent-search {
      --background: white;
      --color: #333;
      --placeholder-color: #666;
      --border-radius: 12px;
      --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin: 0;
    }

    .content-area {
      padding: 20px;
    }

    .search-results {
      margin: 12px 0;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .quick-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .quick-filters ion-chip {
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .quick-filters ion-chip:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .no-results {
      margin: 40px 0;
    }

    .no-results .text-center {
      text-align: center;
      padding: 40px 20px;
    }

    .no-results ion-icon {
      margin-bottom: 16px;
      opacity: 0.6;
    }

    .no-results h3 {
      color: var(--ion-color-medium);
      margin-bottom: 8px;
    }

    .no-results p {
      color: var(--ion-color-medium);
      margin-bottom: 20px;
    }

    ion-searchbar.prominent-search {
      --background: white;
      --color: #333;
      --placeholder-color: #666;
      --border-radius: 12px;
      --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      font-size: 16px;
    }

    ion-searchbar.prominent-search .searchbar-input {
      font-size: 16px !important;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonAccordion,
    IonAccordionGroup,
    IonSearchbar,
    IonChip
  ]
})
export class HelpComponent {
  searchTerm: string = '';
  selectedQuickFilter: string = '';
  filteredSections: HelpSection[] = [];
  
  quickFilterTags = [
    'Getting Started',
    'Clients',
    'Projects', 
    'Datasets',
    'Models',
    'Deployments',
    'Troubleshooting',
    'Security',
    'API'
  ];

  helpSections: HelpSection[] = [
    {
      id: 'welcome',
      title: 'Welcome to AISAP',
      content: 'AISAP AI Solutions Analytics Platform comprehensive enterprise machine learning projects conception deployment streamline ML lifecycle organize clients manage datasets train models deploy solutions monitor performance enterprise-grade security scalability centralized management role-based security real-time analytics automated deployment team collaboration',
      tags: ['welcome', 'overview', 'introduction', 'getting started', 'platform'],
      category: 'Getting Started'
    },
    {
      id: 'quick-start',
      title: 'Quick Start Guide',
      content: 'first ML project client setup navigate clients add new client contact details phone number business sector project requirements create project descriptive names associate client timelines milestones success metrics upload dataset prepare data CSV JSON Parquet Excel clean column names missing values data types categorical variables quality completeness create train model algorithm Random Forest XGBoost Neural Network hyperparameters training validation split evaluation metrics deploy monitor REST API batch processing real-time inference performance metrics accuracy tracking request volume response times model drift detection alerts automated retraining',
      tags: ['quick start', 'tutorial', 'first project', 'getting started', 'walkthrough'],
      category: 'Getting Started'
    },
    {
      id: 'features',
      title: 'Feature Documentation',
      content: 'client management organize maintain relationships business clients track projects contact information efficiently add edit delete clients contact details phone email address business information project associations search filter clients view client history project timeline client management system developers team members user accounts role-based access control permissions manage user profiles assign roles projects collaboration team management project management create organize track machine learning projects project lifecycle planning execution monitoring project templates milestones deliverables timeline management resource allocation project status tracking collaboration tools dataset management upload organize manage datasets data preprocessing cleaning transformation validation dataset versioning data quality checks supported formats CSV JSON Parquet Excel dataset metadata schema management data lineage model management create train deploy machine learning models algorithm selection hyperparameter tuning model versioning performance tracking model comparison evaluation metrics model registry deployment management deploy models production environments REST API endpoints batch processing real-time inference monitoring scaling load balancing deployment pipelines CI/CD integration',
      tags: ['features', 'client management', 'project management', 'dataset management', 'model management', 'deployment'],
      category: 'Features'
    }
  ];

  constructor(private modalController: ModalController) {
    addIcons({
      closeOutline,
      helpCircleOutline,
      peopleOutline,
      folderOutline,
      cloudUploadOutline,
      barChartOutline,
      settingsOutline,
      documentTextOutline,
      rocketOutline,
      shieldCheckmarkOutline,
      searchOutline,
      refreshOutline
    });
    
    // Initialize with all sections visible
    this.filteredSections = [...this.helpSections];
  }

  filterContent(event: any) {
    const searchTerm = event.target.value.toLowerCase().trim();
    this.searchTerm = searchTerm;
    this.selectedQuickFilter = '';
    
    if (!searchTerm) {
      this.filteredSections = [...this.helpSections];
      return;
    }
    
    // Enhanced search: find all sections with matches and add match details
    this.filteredSections = this.helpSections.filter(section => {
      const titleMatch = section.title.toLowerCase().includes(searchTerm);
      const contentMatch = section.content.toLowerCase().includes(searchTerm);
      const tagMatch = section.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      const categoryMatch = section.category.toLowerCase().includes(searchTerm);
      
      if (titleMatch || contentMatch || tagMatch || categoryMatch) {
        // Add match information to the section
        section.matchInfo = this.getMatchInfo(section, searchTerm);
        return true;
      }
      return false;
    });
  }
  
  getMatchInfo(section: HelpSection, searchTerm: string): { matches: MatchInfo[], totalMatches: number } {
    const matches: MatchInfo[] = [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Check title matches
    if (section.title.toLowerCase().includes(lowerSearchTerm)) {
      matches.push({
        type: 'title',
        text: this.highlightText(section.title, searchTerm),
        context: section.title
      });
    }
    
    // Check content matches with context
    const contentMatches = this.findContentMatches(section.content, searchTerm);
    matches.push(...contentMatches);
    
    // Check tag matches
    section.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerSearchTerm)) {
        matches.push({
          type: 'tag',
          text: this.highlightText(tag, searchTerm),
          context: `Tag: ${tag}`
        });
      }
    });
    
    // Check category matches
    if (section.category.toLowerCase().includes(lowerSearchTerm)) {
      matches.push({
        type: 'category',
        text: this.highlightText(section.category, searchTerm),
        context: `Category: ${section.category}`
      });
    }
    
    return {
      matches,
      totalMatches: matches.length
    };
  }
  
  findContentMatches(content: string, searchTerm: string): MatchInfo[] {
    const matches: MatchInfo[] = [];
    const lowerContent = content.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const contextLength = 100; // Characters of context around each match
    
    let startIndex = 0;
    while (true) {
      const matchIndex = lowerContent.indexOf(lowerSearchTerm, startIndex);
      if (matchIndex === -1) break;
      
      // Get context around the match
      const contextStart = Math.max(0, matchIndex - contextLength);
      const contextEnd = Math.min(content.length, matchIndex + lowerSearchTerm.length + contextLength);
      const contextText = content.substring(contextStart, contextEnd);
      
      matches.push({
        type: 'content',
        text: this.highlightText(contextText, searchTerm),
        context: `...${contextText}...`,
        position: matchIndex
      });
      
      startIndex = matchIndex + 1;
    }
    
    return matches;
  }
  
  highlightText(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
  }

  applyQuickFilter(tag: string) {
    this.selectedQuickFilter = this.selectedQuickFilter === tag ? '' : tag;
    this.searchTerm = '';
    
    if (!this.selectedQuickFilter) {
      this.filteredSections = [...this.helpSections];
      return;
    }
    
    this.filteredSections = this.helpSections.filter(section => {
      return (
        section.category.toLowerCase().includes(this.selectedQuickFilter.toLowerCase()) ||
        section.tags.some(sectionTag => sectionTag.toLowerCase().includes(this.selectedQuickFilter.toLowerCase()))
      );
    });
  }

  shouldShowSection(sectionId: string): boolean {
    if (!this.searchTerm && !this.selectedQuickFilter) {
      return true; // Show all sections when no search/filter is active
    }
    
    return this.filteredSections.some(section => section.id === sectionId);
  }

  clearSearch() {
    this.searchTerm = '';
    this.selectedQuickFilter = '';
    this.filteredSections = [...this.helpSections];
  }

  async dismiss() {
    await this.modalController.dismiss();
  }
}
