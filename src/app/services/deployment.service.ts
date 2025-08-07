import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

// DTOs matching your backend structure
export interface PipelineResponseDTO {
  pipeline_ID: number;
  name: string;
  repo_URL: string;
  branch: string;
  buildScript: string;
  targetEnvironments: string[];
  createdBy: number;
  creatorName: string;
  createdDate: string;
  lastModified?: string;
  status: string;
}

export interface CreatePipelineDTO {
  name: string;
  repo_URL: string;
  branch: string;
  buildScript: string;
  targetEnvironments: string[];
  createdBy: number;
}

export interface VirtualMachineDTO {
  vm_ID: number;
  name: string;
  hostAddress: string;
  username: string;
  port: string;
  environment: string;
  status: string;
  description: string;
  deploymentPath: string;
  maxConcurrentDeployments: number;
  createdDate: string;
  lastHealthCheck?: string;
  createdBy: string;
  cpuCores?: number;
  ramSizeGB?: number;
  storageSizeGB?: number;
  operatingSystem: string;
  activeDeployments: number;
  isHealthy: boolean;
}

export interface ModelDeploymentResponseDTO {
  deploymentId: number;
  modelInstanceId: number;
  virtualMachineId: number;
  virtualMachineName: string;
  status: string;
  endpoint: string;
  appName: string;
  environment: string;
  version: string;
  deployedAt: string;
  message: string;
}

export interface ScheduleDeploymentRequestDTO {
  pipeline_ID: number;
  scheduledTime: string;
  targetEnv: string;
  createdBy: number;
  notes?: string;
  requireApproval: boolean;
}

export interface DeploymentScheduleResponseDTO {
  schedule_ID: number;
  pipeline_ID: number;
  pipelineName: string;
  scheduledTime: string;
  targetEnv: string;
  status: string;
  createdBy: number;
  creatorName: string;
  createdDate: string;
  notes?: string;
  requireApproval: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeploymentService {
  private readonly baseUrl = environment.apiUrl || 'https://localhost:7001/api';
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  // Reactive state management
  private pipelinesSubject = new BehaviorSubject<PipelineResponseDTO[]>([]);
  private virtualMachinesSubject = new BehaviorSubject<VirtualMachineDTO[]>([]);
  private deploymentsSubject = new BehaviorSubject<ModelDeploymentResponseDTO[]>([]);
  private scheduledDeploymentsSubject = new BehaviorSubject<DeploymentScheduleResponseDTO[]>([]);

  public pipelines$ = this.pipelinesSubject.asObservable();
  public virtualMachines$ = this.virtualMachinesSubject.asObservable();
  public deployments$ = this.deploymentsSubject.asObservable();
  public scheduledDeployments$ = this.scheduledDeploymentsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.getAllPipelines().subscribe();
    this.getVirtualMachines().subscribe();
    this.getScheduledDeployments().subscribe();
  }

  // Pipeline Management
  getAllPipelines(): Observable<PipelineResponseDTO[]> {
    return new Observable(observer => {
      this.http.get<{ pipelines: PipelineResponseDTO[] }>(`${this.baseUrl}/pipeline`, this.httpOptions)
        .subscribe({
          next: (response) => {
            this.pipelinesSubject.next(response.pipelines || []);
            observer.next(response.pipelines || []);
            observer.complete();
          },
          error: (error) => {
            console.error('Error fetching pipelines:', error);
            observer.error(error);
          }
        });
    });
  }

  createPipeline(pipeline: CreatePipelineDTO): Observable<PipelineResponseDTO> {
    return new Observable(observer => {
      this.http.post<{ pipeline: PipelineResponseDTO }>(`${this.baseUrl}/pipeline/configure`, pipeline, this.httpOptions)
        .subscribe({
          next: (response) => {
            // Refresh pipelines list
            this.getAllPipelines().subscribe();
            observer.next(response.pipeline);
            observer.complete();
          },
          error: (error) => {
            console.error('Error creating pipeline:', error);
            observer.error(error);
          }
        });
    });
  }

  getPipelineById(id: number): Observable<PipelineResponseDTO> {
    return new Observable(observer => {
      this.http.get<{ pipeline: PipelineResponseDTO }>(`${this.baseUrl}/pipeline/${id}`, this.httpOptions)
        .subscribe({
          next: (response) => {
            observer.next(response.pipeline);
            observer.complete();
          },
          error: (error) => {
            console.error('Error fetching pipeline:', error);
            observer.error(error);
          }
        });
    });
  }

  deletePipeline(id: number): Observable<any> {
    return new Observable(observer => {
      this.http.delete(`${this.baseUrl}/pipeline/${id}`, this.httpOptions)
        .subscribe({
          next: (response) => {
            // Refresh pipelines list
            this.getAllPipelines().subscribe();
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            console.error('Error deleting pipeline:', error);
            observer.error(error);
          }
        });
    });
  }

  // Virtual Machine Management
  getVirtualMachines(): Observable<VirtualMachineDTO[]> {
    return new Observable(observer => {
      this.http.get<VirtualMachineDTO[]>(`${this.baseUrl}/modeldeployment/virtual-machines`, this.httpOptions)
        .subscribe({
          next: (response) => {
            this.virtualMachinesSubject.next(response || []);
            observer.next(response || []);
            observer.complete();
          },
          error: (error) => {
            console.error('Error fetching virtual machines:', error);
            observer.error(error);
          }
        });
    });
  }

  // Model Deployment Management
  deployModelToVM(deploymentRequest: any): Observable<ModelDeploymentResponseDTO> {
    return this.http.post<ModelDeploymentResponseDTO>(`${this.baseUrl}/modeldeployment/deploy`, deploymentRequest, this.httpOptions);
  }

  getDeploymentStatus(deploymentId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/modeldeployment/deployment/${deploymentId}/status`, this.httpOptions);
  }

  getVMDeployments(vmId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/modeldeployment/vm/${vmId}/deployments`, this.httpOptions);
  }

  // Deployment Scheduling
  scheduleDeployment(scheduleRequest: ScheduleDeploymentRequestDTO): Observable<DeploymentScheduleResponseDTO> {
    return new Observable(observer => {
      this.http.post<{ schedule: DeploymentScheduleResponseDTO }>(`${this.baseUrl}/deployments/schedule`, scheduleRequest, this.httpOptions)
        .subscribe({
          next: (response) => {
            // Refresh scheduled deployments list
            this.getScheduledDeployments().subscribe();
            observer.next(response.schedule);
            observer.complete();
          },
          error: (error) => {
            console.error('Error scheduling deployment:', error);
            observer.error(error);
          }
        });
    });
  }

  getScheduledDeployments(): Observable<DeploymentScheduleResponseDTO[]> {
    return new Observable(observer => {
      this.http.get<{ schedules: DeploymentScheduleResponseDTO[] }>(`${this.baseUrl}/deployments/schedule`, this.httpOptions)
        .subscribe({
          next: (response) => {
            this.scheduledDeploymentsSubject.next(response.schedules || []);
            observer.next(response.schedules || []);
            observer.complete();
          },
          error: (error) => {
            console.error('Error fetching scheduled deployments:', error);
            observer.error(error);
          }
        });
    });
  }

  getScheduledDeploymentsByPipeline(pipelineId: number): Observable<DeploymentScheduleResponseDTO[]> {
    return new Observable(observer => {
      this.http.get<{ schedules: DeploymentScheduleResponseDTO[] }>(`${this.baseUrl}/deployments/schedule/pipeline/${pipelineId}`, this.httpOptions)
        .subscribe({
          next: (response) => {
            observer.next(response.schedules || []);
            observer.complete();
          },
          error: (error) => {
            console.error('Error fetching scheduled deployments by pipeline:', error);
            observer.error(error);
          }
        });
    });
  }

  cancelScheduledDeployment(scheduleId: number, reason: string): Observable<any> {
    return new Observable(observer => {
      const cancelRequest = { schedule_ID: scheduleId, reason: reason };
      this.http.post(`${this.baseUrl}/deployments/schedule/cancel`, cancelRequest, this.httpOptions)
        .subscribe({
          next: (response) => {
            // Refresh scheduled deployments list
            this.getScheduledDeployments().subscribe();
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            console.error('Error canceling scheduled deployment:', error);
            observer.error(error);
          }
        });
    });
  }

  executeScheduledDeployment(scheduleId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/deployments/schedule/${scheduleId}/execute`, {}, this.httpOptions);
  }

  getDueDeployments(): Observable<DeploymentScheduleResponseDTO[]> {
    return new Observable(observer => {
      this.http.get<{ schedules: DeploymentScheduleResponseDTO[] }>(`${this.baseUrl}/deployments/due`, this.httpOptions)
        .subscribe({
          next: (response) => {
            observer.next(response.schedules || []);
            observer.complete();
          },
          error: (error) => {
            console.error('Error fetching due deployments:', error);
            observer.error(error);
          }
        });
    });
  }

  getEnvironmentStatus(environmentName: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/deployments/environment/${environmentName}/status`, this.httpOptions);
  }

  // Health checks
  checkPipelineServiceHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/pipeline/health`, this.httpOptions);
  }

  checkDeploymentServiceHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/deployments/schedule/health`, this.httpOptions);
  }
}
