import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  UploadMultipleResponseModel,
  UploadResponseModel,
} from '@shared/models/upload';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UploadService {
  readonly #api = inject(ApiService);

  upload(file: File): Observable<UploadResponseModel> {
    const formData = new FormData();
    formData.append('file', file);
    return this.#api.post<UploadResponseModel>('/upload', formData);
  }

  uploadMultiple(files: File[]): Observable<UploadMultipleResponseModel> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return this.#api.post<UploadMultipleResponseModel>(
      '/upload/multiple',
      formData,
    );
  }
}
