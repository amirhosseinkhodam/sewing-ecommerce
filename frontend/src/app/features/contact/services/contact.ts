import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ContactPayloadModel,
  ContactSubmitResponseModel,
} from '@domain/models/contact';

@Injectable({ providedIn: 'root' })
export class ContactService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/contact';

  submit(payload: ContactPayloadModel): Observable<ContactSubmitResponseModel> {
    return this.#http.post<ContactSubmitResponseModel>(this.#baseUrl, payload);
  }
}
