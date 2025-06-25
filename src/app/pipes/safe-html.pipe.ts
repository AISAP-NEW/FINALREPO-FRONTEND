import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(html: string): SafeHtml {
    // If the input is not a string, convert it to a string
    const safeHtml = typeof html === 'string' ? html : String(html || '');
    return this.sanitizer.bypassSecurityTrustHtml(safeHtml);
  }
}
