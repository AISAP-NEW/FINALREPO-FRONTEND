import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CalendarDateModalComponent } from '../../components/calendar-date-modal/calendar-date-modal.component';

interface CalendarDay {
  day: number;
  date: string;
  hasUpload: boolean;
}

interface ModelUpload {
  id: number;
  title: string;
  date: string;
}

@Component({
  selector: 'app-calendar-models',
  templateUrl: './calendar-models.page.html',
  styleUrls: ['./calendar-models.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class CalendarModelsPage implements OnInit {
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  selectedDate: string | null = null;
  selectedDateModels: ModelUpload[] = [];
  modelUploads: ModelUpload[] = [];
  
  monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(private http: HttpClient, private modalCtrl: ModalController) { }

  ngOnInit() {
    this.loadModelUploads();
  }

  loadModelUploads() {
    console.log('Loading model uploads from:', `${environment.apiUrl}/api/ModelFile/calendar-view`);
    this.http.get<ModelUpload[]>(`${environment.apiUrl}/api/ModelFile/calendar-view`)
      .subscribe({
        next: (data) => {
          console.log('Model uploads loaded:', data);
          this.modelUploads = data;
          // Add some test data if API returns empty
          if (!data || data.length === 0) {
            console.log('No data from API, adding test data');
            this.modelUploads = [
              {
                id: 1,
                title: "Test Model",
                date: "2025-07-22T10:00:00.000Z"
              }
            ];
          }
        },
        error: (error) => {
          console.error('Error loading model uploads:', error);
          console.log('Adding fallback test data due to API error');
          // Add test data for debugging
          this.modelUploads = [
            {
              id: 1,
              title: "nnnn",
              date: "2025-07-21T14:59:05.6064222"
            },
            {
              id: 2,
              title: "Test Model Today",
              date: "2025-07-22T10:00:00.000Z"
            }
          ];
        }
      });
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.selectedDate = null;
    this.selectedDateModels = [];
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.selectedDate = null;
    this.selectedDateModels = [];
  }

  getWeeks(): CalendarDay[][] {
    const weeks: CalendarDay[][] = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    
    // Start from the beginning of the week
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    let currentWeek: CalendarDay[] = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    while (startDate <= endDate) {
      const dateStr = this.formatDate(startDate);
      const hasUpload = this.modelUploads.some(upload => 
        this.formatDate(new Date(upload.date)) === dateStr
      );
      
      if (startDate.getMonth() === this.currentMonth) {
        currentWeek.push({
          day: startDate.getDate(),
          date: dateStr,
          hasUpload: hasUpload
        });
      } else {
        currentWeek.push({
          day: 0,
          date: '',
          hasUpload: false
        });
      }
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return weeks;
  }

  selectDate(day: CalendarDay) {
    if (day.day === 0) return; // Empty cell
    
    console.log('Date clicked:', day);
    console.log('All model uploads:', this.modelUploads);
    
    this.selectedDate = day.date;
    this.selectedDateModels = this.modelUploads.filter(upload => {
      const uploadDate = this.formatDate(new Date(upload.date));
      console.log('Comparing:', uploadDate, 'with', day.date);
      return uploadDate === day.date;
    });
    
    console.log('Selected date models:', this.selectedDateModels);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}