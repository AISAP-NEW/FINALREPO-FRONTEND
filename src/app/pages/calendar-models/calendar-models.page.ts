import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CalendarDateModalComponent } from '../../components/calendar-date-modal/calendar-date-modal.component';
import { Subject, takeUntil } from 'rxjs';
import { CalendarService, CalendarDay, CalendarData } from '../../services/calendar.service';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';

// Enhanced interface for model uploads
interface ModelUpload {
  id: number;
  modelName: string;
  updatedAt: string;
  version: string;
  status: 'new' | 'updated' | 'deprecated';
}

@Component({
  selector: 'app-calendar-models',
  templateUrl: './calendar-models.page.html',
  styleUrls: ['./calendar-models.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    HttpClientModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonSpinner
  ]
})
export class CalendarModelsPage implements OnInit, OnDestroy {
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  selectedDate: string | null = null;
  selectedDateModels: ModelUpload[] = [];
  calendarData: CalendarData[] = [];
  isLoading = false;
  
  // Sample data for demonstration
  sampleModels: ModelUpload[] = [
    { 
      id: 1, 
      modelName: "Model A", 
      updatedAt: "2025-08-05T10:30:00Z", 
      version: "v2.1", 
      status: "updated" 
    },
    { 
      id: 2, 
      modelName: "Model B", 
      updatedAt: "2025-08-12T14:20:00Z", 
      version: "v1.4", 
      status: "new" 
    },
    { 
      id: 3, 
      modelName: "Model C", 
      updatedAt: "2025-08-15T09:15:00Z", 
      version: "v3.0", 
      status: "new" 
    },
    { 
      id: 4, 
      modelName: "Model D", 
      updatedAt: "2025-08-18T16:45:00Z", 
      version: "v1.2", 
      status: "deprecated" 
    },
    { 
      id: 5, 
      modelName: "Model E", 
      updatedAt: "2025-08-20T11:30:00Z", 
      version: "v2.5", 
      status: "updated" 
    }
  ];
  
  monthNames: string[] = [];
  weekDays: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient, 
    private modalCtrl: ModalController,
    private calendarService: CalendarService
  ) { }

  ngOnInit() {
    console.log('Calendar models page initialized');
    this.initializeCalendarData();
    this.loadCalendarData();
  }

  private initializeCalendarData() {
    // Initialize month names and week days
    this.monthNames = [];
    for (let i = 0; i < 12; i++) {
      this.monthNames.push(this.calendarService.getMonthName(i));
    }
    this.weekDays = this.calendarService.getWeekDayNames();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCalendarData() {
    this.isLoading = true;
    
    this.calendarService.getCalendarData(this.currentYear, this.currentMonth + 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Calendar data loaded:', data);
          this.calendarData = data || [];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading calendar data:', error);
          // Use sample data for demonstration
          this.calendarData = this.generateSampleCalendarData();
          this.isLoading = false;
        }
      });
  }

  private generateSampleCalendarData(): CalendarData[] {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const data: CalendarData[] = [];
    
    // Generate sample data for current month
    for (let day = 1; day <= daysInMonth; day++) {
      const random = Math.random();
      if (random > 0.7) { // 30% chance of having models
        const modelCount = Math.floor(Math.random() * 3) + 1;
        const models = this.sampleModels.slice(0, modelCount).map((model, index) => ({
          ...model,
          id: model.id + index * 100,
          updatedAt: new Date(currentYear, currentMonth, day, 
            Math.floor(Math.random() * 24), 
            Math.floor(Math.random() * 60)
          ).toISOString()
        }));
        
        data.push({
          date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          models: models
        });
      }
    }
    
    return data;
  }

  prevMonth() {
    const prev = this.calendarService.getPreviousMonth(this.currentMonth, this.currentYear);
    this.currentMonth = prev.month;
    this.currentYear = prev.year;
    this.selectedDate = null;
    this.selectedDateModels = [];
    this.loadCalendarData();
  }

  nextMonth() {
    const next = this.calendarService.getNextMonth(this.currentMonth, this.currentYear);
    this.currentMonth = next.month;
    this.currentYear = next.year;
    this.selectedDate = null;
    this.selectedDateModels = [];
    this.loadCalendarData();
  }

  getWeeks(): CalendarDay[][] {
    const weeks = this.calendarService.generateCalendarWeeks(this.currentYear, this.currentMonth, this.calendarData, this.selectedDate);
    console.log('Generated weeks:', weeks);
    return weeks;
  }

  // Force refresh of calendar display
  refreshCalendar() {
    // Trigger change detection by updating a property
    this.calendarData = [...this.calendarData];
  }

  selectDate(day: CalendarDay) {
    if (day.day === 0 || !day.isCurrentMonth) return;
    
    console.log('Date clicked:', day);
    
    this.selectedDate = day.date;
    
    // Look up models from the current calendarData instead of day.models
    const dayData = this.calendarData.find(d => d.date === day.date);
    this.selectedDateModels = dayData?.models || [];
    
    console.log('Selected date:', this.selectedDate);
    console.log('Selected date models:', this.selectedDateModels);
    console.log('Calendar data for this date:', dayData);
    
    // Refresh the calendar display to show the selection
    this.refreshCalendar();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'new': return '#4CAF50'; // Green
      case 'updated': return '#2196F3'; // Blue
      case 'deprecated': return '#9E9E9E'; // Gray
      default: return '#9E9E9E';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'new': return 'add-circle-outline';
      case 'updated': return 'refresh-outline';
      case 'deprecated': return 'remove-circle-outline';
      default: return 'help-outline';
    }
  }

  async openDateModal(day: CalendarDay) {
    if (day.day === 0 || !day.isCurrentMonth) return;
    
    const modal = await this.modalCtrl.create({
      component: CalendarDateModalComponent,
      componentProps: {
        date: day.date,
        models: day.models,
        modelCount: day.modelCount
      },
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.5
    });
    
    await modal.present();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get total models count for the current month
  getTotalModelsCount(): number {
    return this.calendarService.getTotalModelsCount(this.calendarData);
  }

  // Get models count for selected date
  getSelectedDateModelsCount(): number {
    return this.selectedDateModels.length;
  }

  // Get tooltip text for calendar day
  getDayTooltip(day: CalendarDay): string {
    if (day.day === 0 || !day.isCurrentMonth) return '';
    
    let tooltip = `${day.date}`;
    if (day.isToday) tooltip += ' (Today)';
    if (day.modelCount > 0) {
      tooltip += `\n${day.modelCount} model${day.modelCount > 1 ? 's' : ''} updated`;
      day.models.forEach(model => {
        tooltip += `\n• ${model.modelName} (${model.status})`;
      });
    }
    return tooltip;
  }

  // Get CSS class for model count badge
  getModelCountClass(count: number): string {
    if (count === 1) return 'count-single';
    if (count === 2) return 'count-double';
    if (count === 3) return 'count-triple';
    return 'count-multiple';
  }

  // Get number of days with models in current month
  getDaysWithModels(): number {
    return this.calendarData.length;
  }

  // Go to today's date
  goToToday() {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.selectedDate = this.formatDate(today);
    this.selectedDateModels = this.calendarData.find(d => d.date === this.selectedDate)?.models || [];
    this.loadCalendarData();
  }
}