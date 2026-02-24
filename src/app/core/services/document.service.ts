import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { DocumentItem, UploadResponse } from '../models/document.model';

const API = 'http://localhost:8069/api/documents';

@Injectable({ providedIn: 'root' })
export class DocumentService {

  /** Emits the deleted document id after a successful deletion. */
  readonly documentDeleted$ = new Subject<number>();

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<UploadResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadResponse>(`${API}/upload`, form);
  }

  getMyDocuments(): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(API);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`).pipe(
      tap(() => this.documentDeleted$.next(id))
    );
  }
}
