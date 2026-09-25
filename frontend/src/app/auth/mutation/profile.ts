import { inject } from '@angular/core';
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import type { UserModel } from '@domain/models/user';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import type { UpdateProfilePayloadModel } from '../models/auth';
import { AuthService } from '../services/auth';

export function injectUpdateProfileMutation(options?: {
  readonly onSuccess?: (user: UserModel) => void;
}) {
  const authService = inject(AuthService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (payload: UpdateProfilePayloadModel) =>
      firstValueFrom(authService.updateProfile(payload)),
    onSuccess: (user) => {
      // The PATCH already returned the fresh user, so the cache is seeded
      // directly instead of refetching GET /me.
      queryClient.setQueryData<UserModel>([QUERY_KEYS.profile], user);
      feedback.success('profileUpdated');
      options?.onSuccess?.(user);
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}
