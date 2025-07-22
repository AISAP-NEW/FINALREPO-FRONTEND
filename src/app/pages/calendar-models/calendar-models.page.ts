import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';

interface ModelCalendar {
  id: number;
  title: string;
  date: string;
}

@Component({
  selector: 'app-calendar-models',
  templateUrl: './calendar-models.page.html',
  styleUrls: ['./calendar-models.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    RouterModule,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonButtons
  ]
})
export class CalendarModelsPage implements OnInit {
  events: { [date: string]: ModelCalendar[] } = {};
  selectedDate: string | null = null;
  selectedDateModels: ModelCalendar[] = [];
  daysInMonth: Array<{ date: string, day: number, hasUpload: boolean } | null> = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.http.get<ModelCalendar[]>('http://localhost:5183/api/ModelFile/calendar-view').subscribe(data => {
      this.events = this.groupModelsByDate(data);
      this.generateCalendar();
    });
  }

  groupModelsByDate(models: ModelCalendar[]) {
    const grouped: { [date: string]: ModelCalendar[] } = {};
    for (let model of models) {
      const date = model.date.split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(model);
    }
    return grouped;
  }

  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const days: Array<{ date: string, day: number, hasUpload: boolean } | null> = [];
    // Fill initial empty slots
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    // Fill days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day: d,
        hasUpload: !!this.events[dateStr]
      });
    }
    this.daysInMonth = days;
  }

  selectDate(day: { date: string, day: number, hasUpload: boolean } | null) {
    if (!day) return;
    this.selectedDate = day.date;
    this.selectedDateModels = this.events[day.date] || [];
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
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
    this.generateCalendar();
    this.selectedDate = null;
    this.selectedDateModels = [];
  }

  getWeeks(): Array<Array<{ date: string, day: number, hasUpload: boolean } | null>> {
    const weeks: Array<Array<{ date: string, day: number, hasUpload: boolean } | null>> = [];
    for (let i = 0; i < this.daysInMonth.length; i += 7) {
      weeks.push(this.daysInMonth.slice(i, i + 7));
    }
    return weeks;
  }
}
