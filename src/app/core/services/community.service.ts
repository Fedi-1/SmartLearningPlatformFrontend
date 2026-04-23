// src/app/core/services/community.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConversationDTO {
  id: number;
  otherStudentId: number;
  otherStudentName: string;
  otherStudentInitials: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface MessageDTO {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  isRead: boolean;
  sentAt: string;
  content: string;
  sharedCourseId: number | null;
  sharedCourseTitle: string | null;
  isMine: boolean;
}

export interface SendMessageRequest {
  conversationId: number | null;
  recipientId: number | null;
  content: string;
  courseIdToShare: number | null;
}

export interface StudentSearchResult {
  id: number;
  fullName: string;
  initials: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class CommunityService {

  private readonly API = 'http://localhost:8069/api/community';

  constructor(private http: HttpClient) {}

  getConversations(): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.API}/conversations`);
  }

  getOrCreateConversation(otherStudentId: number): Observable<ConversationDTO> {
    return this.http.get<ConversationDTO>(`${this.API}/conversations/${otherStudentId}`);
  }

  getMessages(conversationId: number): Observable<MessageDTO[]> {
    return this.http.get<MessageDTO[]>(`${this.API}/conversations/${conversationId}/messages`);
  }

  sendMessage(request: SendMessageRequest): Observable<MessageDTO> {
    return this.http.post<MessageDTO>(`${this.API}/messages`, request);
  }

  searchStudents(query: string): Observable<StudentSearchResult[]> {
    return this.http.get<StudentSearchResult[]>(`${this.API}/students/search`, {
      params: { query }
    });
  }
}
