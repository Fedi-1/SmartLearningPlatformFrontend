// src/app/shared/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

const FASTAPI_URL = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private readonly http: HttpClient) {}

  sendMessage(
    messages: ChatMessage[],
    mode: 'visitor' | 'student',
    context?: string,
  ): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${FASTAPI_URL}/api/chat`, {
      messages,
      mode,
      context: context ?? null,
    });
  }
}
