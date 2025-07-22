import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserService, User } from '../../services/user.service';
import { ProjectService, Project } from '../../services/project.service';
import { ClientService, Client } from '../../services/client.service';
import { DatasetService, Dataset } from '../../services/dataset.service';
import { firstValueFrom } from 'rxjs';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

Chart.register(...registerables);

interface TableData {
  headers: string[];
  rows: any[];
}

interface ExtendedUser extends User {
  lastActive?: Date;
  createdAt: Date;
  firstName: string;
  lastName: string;
}

interface ExtendedProject extends Project {
  status: string;
  team: any[];
  startDate: Date;
  dueDate: Date;
}

interface DatasetActivity {
  datasetName: string;
  action: string;
  userName: string;
  timestamp: Date;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ReportsComponent implements OnInit, AfterViewInit {
  @ViewChild('usersPieChart') usersPieChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendsBarChart') trendsBarChart!: ElementRef<HTMLCanvasElement>;

  datasetActivities: TableData = {
    headers: ['Dataset Name', 'Action', 'User', 'Date'],
    rows: []
  };

  usersReport: TableData = {
    headers: ['Name', 'Email', 'Role', 'Status', 'Last Active'],
    rows: []
  };

  projectsReport: TableData = {
    headers: ['Project Name', 'Status', 'Team Size', 'Start Date', 'Due Date'],
    rows: []
  };

  clientsReport: TableData = {
    headers: ['Client Name', 'Projects Count', 'Status', 'Join Date'],
    rows: []
  };

  userStats = {
    active: 0,
    inactive: 0,
    new: 0
  };

  projectActivity: number[] = [];

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private clientService: ClientService,
    private datasetService: DatasetService
  ) {}

  async ngOnInit() {
    await this.loadAllData();
  }

  ngAfterViewInit() {
    // Charts will be created after data is loaded
  }

  async loadAllData() {
    try {
      await Promise.all([
        this.loadUsersData(),
        this.loadProjectsData(),
        this.loadClientsData(),
        this.loadDatasetActivities()
      ]);

      // Create charts after data is loaded
      this.createUsersPieChart();
      this.createTrendsBarChart();
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  }

  async loadUsersData() {
    const users = await firstValueFrom(this.userService.getUsers()) as ExtendedUser[];
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));

    this.userStats = {
      active: 0,
      inactive: 0,
      new: 0
    };

    this.usersReport.rows = users.map(user => {
      // Calculate user statistics
      const lastActive = new Date(user.lastActive || user.createdAt);
      const isNew = lastActive >= thirtyDaysAgo;
      const isActive = lastActive >= new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));

      if (isNew) this.userStats.new++;
      if (isActive) this.userStats.active++;
      else this.userStats.inactive++;

      return {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        status: isActive ? 'Active' : 'Inactive',
        lastActive: new Date(user.lastActive || user.createdAt).toLocaleDateString()
      };
    });
  }

  async loadProjectsData() {
    const projects = await firstValueFrom(this.projectService.getProjects());
    
    // Process projects for the report
    this.projectsReport.rows = projects.map((project: Project) => ({
      name: project.name,
      status: project.isActive ? 'Active' : 'Inactive',
      teamSize: project.members?.length || 0,
      startDate: new Date(project.createdDate).toLocaleDateString(),
      dueDate: new Date(project.estimatedTimeline).toLocaleDateString()
    }));

    // Calculate monthly activity
    const monthlyActivity = new Array(6).fill(0);
    const currentDate = new Date();
    
    projects.forEach((project: Project) => {
      const projectDate = new Date(project.createdDate);
      const monthDiff = currentDate.getMonth() - projectDate.getMonth() + 
        (12 * (currentDate.getFullYear() - projectDate.getFullYear()));
      
      if (monthDiff >= 0 && monthDiff < 6) {
        monthlyActivity[5 - monthDiff]++;
      }
    });

    this.projectActivity = monthlyActivity;
  }

  async loadClientsData() {
    const clients = await firstValueFrom(this.clientService.getClients());
    const projects = await firstValueFrom(this.projectService.getProjects());

    this.clientsReport.rows = clients.map((client: Client) => {
      const clientProjects = projects.filter((p: Project) => p.projectId === client.clientId);
      return {
        name: client.name,
        projectsCount: clientProjects.length,
        status: 'Active',
        joinDate: new Date().toLocaleDateString()
      };
    });
  }

  async loadDatasetActivities() {
    const datasets = await firstValueFrom(this.datasetService.getAllDatasets());
    
    this.datasetActivities.rows = datasets.map((dataset: Dataset) => ({
      name: dataset.datasetName,
      action: 'Created',
      user: 'System',
      date: new Date(dataset.createdAt).toLocaleDateString()
    }));
  }

  createUsersPieChart() {
    if (!this.usersPieChart?.nativeElement) return;

    const canvas = this.usersPieChart.nativeElement;
    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Active Users', 'Inactive Users', 'New Users'],
        datasets: [{
          data: [
            this.userStats.active,
            this.userStats.inactive,
            this.userStats.new
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(75, 192, 192, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'User Distribution'
          }
        }
      }
    });
  }

  createTrendsBarChart() {
    if (!this.trendsBarChart?.nativeElement) return;

    const canvas = this.trendsBarChart.nativeElement;
    const months = this.getLast6Months();

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Project Activity',
          data: this.projectActivity,
          backgroundColor: 'rgba(54, 162, 235, 0.8)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Project Trends (Last 6 Months)'
          }
        }
      }
    });
  }

  getLast6Months(): string[] {
    const months: string[] = [];
    const date = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }
    
    return months;
  }

  downloadChartAsPNG(chartType: string) {
    const canvas = chartType === 'users' ? this.usersPieChart.nativeElement : this.trendsBarChart.nativeElement;
    const link = document.createElement('a');
    link.download = `${chartType}-report.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  downloadTableAsPDF(data: TableData, title: string) {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(title, 180);
    doc.text(titleLines, 15, 15);
    
    // Add table using autoTable
    (doc as any).autoTable({
      head: [data.headers],
      body: data.rows.map(row => Object.values(row)),
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Save PDF
    doc.save(`${title.toLowerCase().replace(' ', '-')}.pdf`);
  }

  downloadTableAsJSON(data: any, filename: string) {
    const jsonStr = JSON.stringify(data.rows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.toLowerCase().replace(' ', '-')}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
} 