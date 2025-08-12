import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

export interface CalendarDay {
  day: number;
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  models: any[];
  modelCount: number;
}

export interface CalendarData {
  date: string;
  models: any[];
}

// Backend response interface
export interface BackendModelResponse {
  id: number;
  title: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  constructor(private http: HttpClient) { }

  /**
   * Get calendar data for a specific month and year
   */
  getCalendarData(year: number, month: number): Observable<CalendarData[]> {
    const url = `${environment.apiUrl}/api/ModelFile/calendar-view?year=${year}&month=${month}`;
    return this.http.get<BackendModelResponse[]>(url).pipe(
      map(response => this.transformBackendResponse(response))
    );
  }

  /**
   * Transform backend response to CalendarData format
   */
  private transformBackendResponse(response: BackendModelResponse[]): CalendarData[] {
    console.log('Backend response received:', response);
    
    if (!response || !Array.isArray(response)) {
      console.log('No response or invalid response, returning empty array');
      return [];
    }

    // Check if the response is already in the expected format (grouped by date)
    if (response.length > 0 && response[0].hasOwnProperty('date') && response[0].hasOwnProperty('models')) {
      console.log('Response is already in grouped format, returning as is');
      return response as any;
    }

    // Group models by date (for raw model array format)
    const groupedByDate = response.reduce((acc, model) => {
      const dateStr = model.date.split('T')[0]; // Extract YYYY-MM-DD from ISO string
      console.log(`Processing model ${model.id}: ${model.title} on date ${dateStr}`);
      
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      
      // Transform backend model to frontend model format
      acc[dateStr].push({
        id: model.id,
        modelName: model.title,
        updatedAt: model.date,
        version: 'v1.0', // Default version since backend doesn't provide it
        status: 'updated' as const // Default status since backend doesn't provide it
      });
      
      return acc;
    }, {} as Record<string, any[]>);

    console.log('Grouped by date:', groupedByDate);

    // Convert to CalendarData array
    const result = Object.entries(groupedByDate).map(([date, models]) => ({
      date,
      models
    }));
    
    console.log('Final transformed data:', result);
    return result;
  }

  /**
   * Generate calendar weeks for a given month and year
   */
  generateCalendarWeeks(year: number, month: number, calendarData: CalendarData[] = [], selectedDate: string | null = null): CalendarDay[][] {
    console.log('Generating calendar weeks for:', { year, month, calendarData, selectedDate });
    
    const weeks: CalendarDay[][] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const today = new Date();

    // Start from the beginning of the week
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: CalendarDay[] = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    while (startDate <= endDate) {
      const dateStr = this.formatDate(startDate);
      const isCurrentMonth = startDate.getMonth() === month;
      const isToday = this.formatDate(startDate) === this.formatDate(today);
      const isSelected = selectedDate === dateStr;

      // Find models for this date
      const dayData = calendarData.find(d => d.date === dateStr);
      const models = dayData?.models || [];
      
      if (isCurrentMonth && models.length > 0) {
        console.log(`Date ${dateStr} has ${models.length} models:`, models);
      }

      if (isCurrentMonth) {
        currentWeek.push({
          day: startDate.getDate(),
          date: dateStr,
          isCurrentMonth: true,
          isToday: isToday,
          isSelected: isSelected,
          models: models,
          modelCount: models.length
        });
      } else {
        currentWeek.push({
          day: 0,
          date: '',
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          models: [],
          modelCount: 0
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

  /**
   * Get month name by index
   */
  getMonthName(monthIndex: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthIndex];
  }

  /**
   * Get week day names
   */
  getWeekDayNames(): string[] {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  /**
   * Navigate to previous month
   */
  getPreviousMonth(currentMonth: number, currentYear: number): { month: number; year: number } {
    if (currentMonth === 0) {
      return { month: 11, year: currentYear - 1 };
    } else {
      return { month: currentMonth - 1, year: currentYear };
    }
  }

  /**
   * Navigate to next month
   */
  getNextMonth(currentMonth: number, currentYear: number): { month: number; year: number } {
    if (currentMonth === 11) {
      return { month: 0, year: currentYear + 1 };
    } else {
      return { month: currentMonth + 1, year: currentYear };
    }
  }

  /**
   * Check if a date is today
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return this.formatDate(date) === this.formatDate(today);
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get total models count for calendar data
   */
  getTotalModelsCount(calendarData: CalendarData[] | undefined): number {
    if (!calendarData || !Array.isArray(calendarData)) {
      return 0;
    }
    return calendarData.reduce((total, day) => total + (day.models?.length || 0), 0);
  }

  /**
   * Get models for a specific date
   */
  getModelsForDate(date: string, calendarData: CalendarData[] | undefined): any[] {
    if (!calendarData || !Array.isArray(calendarData)) {
      return [];
    }
    const dayData = calendarData.find(d => d.date === date);
    return dayData?.models || [];
  }

  /**
   * Get models count for a specific date
   */
  getModelsCountForDate(date: string, calendarData: CalendarData[] | undefined): number {
    if (!calendarData || !Array.isArray(calendarData)) {
      return 0;
    }
    const dayData = calendarData.find(d => d.date === date);
    return dayData?.models?.length || 0;
  }
}
