import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const STUDY_SESSION_API = 'http://localhost:8069/api/study-sessions';

export interface StudySessionResponse {
  sessionId: number;
  active: boolean;
  totalActiveSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class StudySessionService {
  constructor(private http: HttpClient) {}

  start(courseId: number, lessonId: number): Observable<StudySessionResponse> {
    return this.http.post<StudySessionResponse>(`${STUDY_SESSION_API}/start`, { courseId, lessonId });
  }

  keepSessionActive(sessionId: number): Observable<StudySessionResponse> {
    return this.http.post<StudySessionResponse>(`${STUDY_SESSION_API}/keep-active`, { sessionId });
  }

  stop(sessionId: number): Observable<StudySessionResponse> {
    return this.http.post<StudySessionResponse>(`${STUDY_SESSION_API}/stop`, { sessionId });
  }
}
