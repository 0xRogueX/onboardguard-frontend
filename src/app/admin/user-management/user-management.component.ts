import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface User {
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending' | 'Suspended';
  clearance: number;
  lastLogin: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent {
  users = signal<User[]>([
    { name: 'Sarah Jenkins', email: 'sarah.j@enterprise.com', role: 'L1 Officer', status: 'Active', clearance: 100, lastLogin: '2 mins ago' },
    { name: 'Michael Chen', email: 'm.chen@enterprise.com', role: 'L2 Officer', status: 'Active', clearance: 95, lastLogin: '1 hour ago' },
    { name: 'Elena Rodriguez', email: 'elena.r@enterprise.com', role: 'Admin', status: 'Pending', clearance: 60, lastLogin: 'Never' },
    { name: 'David Smith', email: 'd.smith@enterprise.com', role: 'Compliance Manager', status: 'Suspended', clearance: 100, lastLogin: '3 days ago' },
    { name: 'James Wilson', email: 'j.wilson@enterprise.com', role: 'L1 Officer', status: 'Active', clearance: 100, lastLogin: '5 mins ago' },
    { name: 'Emma Thompson', email: 'e.thompson@enterprise.com', role: 'L2 Officer', status: 'Pending', clearance: 45, lastLogin: '10 mins ago' },
  ]);

  getStatusClass(status: string) {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border border-green-200 shadow-sm';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm';
      case 'Suspended': return 'bg-red-100 text-red-700 border border-red-200 shadow-sm';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200 shadow-sm';
    }
  }
}
