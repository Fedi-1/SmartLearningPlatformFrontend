import { of, throwError } from 'rxjs';
import { DocumentsComponent } from './documents.component';
import { DocumentService } from '../../core/services/document.service';
import { CourseService } from '../../core/services/course.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Router } from '@angular/router';
import { CertificateInfo, DocumentItem } from '../../core/models/document.model';

describe('DocumentsComponent', () => {
  let component: DocumentsComponent;
  let documentService: jasmine.SpyObj<DocumentService>;
  let courseService: jasmine.SpyObj<CourseService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    documentService = jasmine.createSpyObj<DocumentService>('DocumentService', ['getMyDocuments', 'upload', 'deleteDocument']);
    courseService = jasmine.createSpyObj<CourseService>('CourseService', ['getMyCertificates', 'getCourseCertificate', 'downloadCertificateUrl']);
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    component = new DocumentsComponent(documentService, courseService, toastService, router);
  });

  it('maps certificate statuses by course id', () => {
    courseService.getMyCertificates.and.returnValue(of([
      certificate(1, 'APPROVED'),
      certificate(2, 'PENDING')
    ]));

    component.loadCertificates();

    expect(component.getCertStatus(1)).toBe('APPROVED');
    expect(component.getCertStatus(2)).toBe('PENDING');
  });

  it('loads documents then certificates', () => {
    const docs: DocumentItem[] = [documentItem(10, 'Math')];
    documentService.getMyDocuments.and.returnValue(of(docs));
    courseService.getMyCertificates.and.returnValue(of([]));

    component.loadDocuments();

    expect(component.loadingDocs).toBeFalse();
    expect(component.documents).toEqual(docs);
    expect(courseService.getMyCertificates).toHaveBeenCalled();
  });

  it('does not download certificates unless status is approved', () => {
    component.certificateMap.set(1, 'PENDING');

    component.downloadCertificate(1);

    expect(courseService.getCourseCertificate).not.toHaveBeenCalled();
  });

  it('opens certificate download URL for approved certificates', () => {
    spyOn(window, 'open');
    component.certificateMap.set(1, 'APPROVED');
    courseService.getCourseCertificate.and.returnValue(of(certificate(1, 'APPROVED')));
    courseService.downloadCertificateUrl.and.returnValue('http://localhost:8069/api/certificates/uuid/download');

    component.downloadCertificate(1);

    expect(courseService.getCourseCertificate).toHaveBeenCalledWith(1);
    expect(window.open).toHaveBeenCalledWith('http://localhost:8069/api/certificates/uuid/download', '_blank');
    expect(component.certLoading.has(1)).toBeFalse();
  });

  it('shows toast when approved certificate lookup fails', () => {
    component.certificateMap.set(1, 'APPROVED');
    courseService.getCourseCertificate.and.returnValue(throwError(() => new Error('missing')));

    component.downloadCertificate(1);

    expect(toastService.error).toHaveBeenCalledWith('No certificate found for this course.');
    expect(component.certLoading.has(1)).toBeFalse();
  });

  it('filters documents by selected category', () => {
    component.documents = [documentItem(1, 'Math'), documentItem(2, 'Physics')];
    component.setCategory('Math');

    expect(component.filteredDocuments.length).toBe(1);
    expect(component.filteredDocuments[0].category).toBe('Math');
  });

  it('validates file extension before upload selection', () => {
    const file = new File(['x'], 'malware.exe');

    (component as any).validateAndSetFile(file);

    expect(component.selectedFile).toBeNull();
    expect(toastService.error).toHaveBeenCalled();
  });

  function certificate(courseId: number, status: CertificateInfo['status']): CertificateInfo {
    return {
      id: courseId,
      certificateUuid: 'uuid',
      courseId,
      courseTitle: 'Math',
      score: 90,
      issuedAt: '2026-01-01',
      hasPdf: true,
      status
    };
  }

  function documentItem(id: number, category: string): DocumentItem {
    return {
      id,
      fileName: 'lesson.pdf',
      fileType: 'PDF',
      fileSize: 1000,
      uploadedAt: '2026-01-01',
      status: 'COMPLETED',
      courseId: id,
      category
    };
  }
});
