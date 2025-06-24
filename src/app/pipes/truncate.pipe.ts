import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 50, trail: string = '...'): string {
    if (!value) return '';
    
    // Convert to string in case it's a number or other type
    const stringValue = String(value);
    
    return stringValue.length > limit 
      ? stringValue.substring(0, limit) + trail 
      : stringValue;
  }
}
