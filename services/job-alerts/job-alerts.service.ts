import { customFetch } from '@/utils/fetch-wrapper';
import type {
  IJobAlert,
  IJobAlertConflict,
  IJobAlertsListResponse,
  ICreateJobAlertPayload,
  IUpdateJobAlertPayload,
} from '@/types/job-alerts.types';

const baseUrl = `${process.env.DIRECTORY_API_URL}/v1/job-alerts`;

const parseJson = async <T>(response: Response | undefined, errorMessage: string): Promise<T> => {
  if (!response?.ok) {
    let message = errorMessage;
    try {
      const body = await response?.json();
      if (body?.message) message = String(body.message);
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  return response.json();
};

export type CreateJobAlertResult =
  | { ok: true; alert: IJobAlert }
  | { ok: false; conflict: IJobAlertConflict }
  | { ok: false; error: string };

export async function listJobAlerts(): Promise<IJobAlertsListResponse> {
  const response = await customFetch(baseUrl, { method: 'GET' }, true);
  return parseJson<IJobAlertsListResponse>(response, 'Failed to load your job alert');
}

export async function createJobAlert(payload: ICreateJobAlertPayload): Promise<CreateJobAlertResult> {
  const response = await customFetch(
    baseUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    true,
  );
  if (!response) return { ok: false, error: 'Network error' };
  if (response.status === 201 || response.status === 200) {
    const alert = (await response.json()) as IJobAlert;
    return { ok: true, alert };
  }
  if (response.status === 409) {
    const conflict = (await response.json()) as IJobAlertConflict;
    return { ok: false, conflict };
  }
  let message = 'Failed to save job alert';
  try {
    const body = await response.json();
    if (body?.message) message = String(body.message);
  } catch {
    // ignore
  }
  return { ok: false, error: message };
}

export async function updateJobAlert(uid: string, payload: IUpdateJobAlertPayload): Promise<IJobAlert> {
  const response = await customFetch(
    `${baseUrl}/${uid}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    true,
  );
  return parseJson<IJobAlert>(response, 'Failed to update job alert');
}

export async function deleteJobAlert(uid: string): Promise<void> {
  const response = await customFetch(`${baseUrl}/${uid}`, { method: 'DELETE' }, true);
  if (!response?.ok && response?.status !== 204) {
    throw new Error('Failed to delete job alert');
  }
}
