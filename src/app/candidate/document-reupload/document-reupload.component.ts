import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-document-reupload',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './document-reupload.component.html',
  styleUrl: './document-reupload.component.css'
})
export class DocumentReuploadComponent {}
