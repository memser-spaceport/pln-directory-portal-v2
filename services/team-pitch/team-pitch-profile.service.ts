import { customFetch } from '@/utils/fetch-wrapper';
import type {
  ConfirmOnePagerUploadResponse,
  ConfirmVideoUploadResponse,
  GetOnePagerUploadUrlParams,
  GetOnePagerUploadUrlResponse,
  GetVideoUploadUrlParams,
  GetVideoUploadUrlResponse,
} from '@/services/demo-day/fundraising-profile.service';

function pitchProfileBase(slug: string) {
  return `${process.env.DIRECTORY_API_URL}/v1/team-pitches/${slug}/profile`;
}

export async function getTeamPitchVideoUploadUrl(
  pitchSlug: string,
  params: GetVideoUploadUrlParams,
): Promise<GetVideoUploadUrlResponse> {
  const response = await customFetch(
    `${pitchProfileBase(pitchSlug)}/video/upload-url`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: params.filename,
        filesize: params.filesize,
        mimetype: params.mimetype,
      }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to get presigned upload URL');
  }

  return response.json();
}

export async function confirmTeamPitchVideoUpload(
  pitchSlug: string,
  uploadUid: string,
): Promise<ConfirmVideoUploadResponse> {
  const response = await customFetch(
    `${pitchProfileBase(pitchSlug)}/video/confirm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadUid }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to confirm video upload');
  }

  return response.json();
}

export async function getTeamPitchOnePagerUploadUrl(
  pitchSlug: string,
  params: GetOnePagerUploadUrlParams,
): Promise<GetOnePagerUploadUrlResponse> {
  const response = await customFetch(
    `${pitchProfileBase(pitchSlug)}/one-pager/upload-url`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: params.filename,
        filesize: params.filesize,
        mimetype: params.mimetype,
      }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to get presigned upload URL');
  }

  return response.json();
}

export async function confirmTeamPitchOnePagerUpload(
  pitchSlug: string,
  uploadUid: string,
): Promise<ConfirmOnePagerUploadResponse> {
  const response = await customFetch(
    `${pitchProfileBase(pitchSlug)}/one-pager/confirm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadUid }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to confirm one-pager upload');
  }

  return response.json();
}

export async function deleteTeamPitchOnePager(pitchSlug: string) {
  const response = await customFetch(`${pitchProfileBase(pitchSlug)}/one-pager`, { method: 'DELETE' }, true);
  if (!response?.ok) {
    throw new Error('Failed to delete one-pager file');
  }
  return response.json();
}

export async function deleteTeamPitchVideo(pitchSlug: string) {
  const response = await customFetch(`${pitchProfileBase(pitchSlug)}/video`, { method: 'DELETE' }, true);
  if (!response?.ok) {
    throw new Error('Failed to delete video file');
  }
  return response.json();
}

export async function updateTeamPitchDescription(pitchSlug: string, description: string) {
  const response = await customFetch(
    `${pitchProfileBase(pitchSlug)}/description`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update fundraise description');
  }

  return response.json();
}

export async function updateTeamPitchTeam(
  pitchSlug: string,
  body: {
    logo?: string;
    name: string;
    shortDescription: string;
    industryTags: string[];
    fundingStage?: string;
    website?: string;
  },
) {
  const response = await customFetch(
    `${pitchProfileBase(pitchSlug)}/team`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update team pitch profile');
  }

  return response.json();
}
