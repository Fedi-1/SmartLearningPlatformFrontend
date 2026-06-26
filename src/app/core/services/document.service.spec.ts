import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentService]
    });
    service = TestBed.inject(DocumentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads files as FormData', () => {
    const file = new File(['hello'], 'lesson.pdf', { type: 'application/pdf' });

    service.upload(file).subscribe();

    const req = http.expectOne('http://localhost:8069/api/documents/upload');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({ documentId: 1, courseId: 2, courseTitle: 'Math', totalLessons: 3 });
  });

  it('loads current student documents', () => {
    service.getMyDocuments().subscribe(docs => expect(docs.length).toBe(1));

    const req = http.expectOne('http://localhost:8069/api/documents');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, fileName: 'lesson.pdf', fileType: 'PDF', fileSize: 1000, uploadedAt: '2026-01-01', status: 'COMPLETED', courseId: 2, category: 'Math' }]);
  });

  it('emits deleted document id after successful delete', () => {
    const deletedIds: number[] = [];
    service.documentDeleted$.subscribe(id => deletedIds.push(id));

    service.deleteDocument(9).subscribe();

    const req = http.expectOne('http://localhost:8069/api/documents/9');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(deletedIds).toEqual([9]);
  });
});
