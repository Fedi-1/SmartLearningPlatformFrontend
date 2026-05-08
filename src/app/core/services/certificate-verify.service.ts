// C:/Users/firas/Desktop/PFE Project/SmartLearningPlatformFrontend/src/app/core/services/certificate-verify.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:8069/api/admin/certificates';

export interface CertificateVerifyResponse {
  valid: boolean;
  studentName: string | null;
  courseTitle: string | null;
  score: number | null;
  issuedAt: string | null;
  status: string | null;
}

@Injectable({ providedIn: 'root' })
export class CertificateVerifyService {
  constructor(private http: HttpClient) {}

  verifyCertificate(uuid: string): Observable<CertificateVerifyResponse> {
    return this.http.get<CertificateVerifyResponse>(`${API}/verify/${uuid}`);
  }
}
