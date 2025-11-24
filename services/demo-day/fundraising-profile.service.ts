import { customFetch } from '@/utils/fetch-wrapper';

// Types for presigned URL request
export interface GetVideoUploadUrlParams {
  filename: string;
  filesize: number;
  mimetype: string;
  teamUid?: string; // Optional team UID for admin uploads
}

export interface GetVideoUploadUrlResponse {
  uploadUid: string;
  presignedUrl: string;
  s3Key: string;
  expiresAt: string;
}

// Types for confirm upload request
export interface ConfirmVideoUploadParams {
  uploadUid: string;
  teamUid?: string; // Optional team UID for admin uploads
}

export interface ConfirmVideoUploadResponse {
  success: boolean;
  data: any; // FundraisingProfile
}

// Types for one-pager presigned URL request
export interface GetOnePagerUploadUrlParams {
  filename: string;
  filesize: number;
  mimetype: string;
  teamUid?: string; // Optional team UID for admin uploads
}

export interface GetOnePagerUploadUrlResponse {
  uploadUid: string;
  presignedUrl: string;
  s3Key: string;
  expiresAt: string;
}

// Types for one-pager confirm upload request
export interface ConfirmOnePagerUploadParams {
  uploadUid: string;
  teamUid?: string; // Optional team UID for admin uploads
}

export interface ConfirmOnePagerUploadResponse {
  success: boolean;
  data: any; // FundraisingProfile
}

// Types for one-pager preview upload request
export interface UploadOnePagerPreviewParams {
  previewImage: File;
  previewImageSmall: File;
  teamUid?: string; // Optional team UID for admin uploads
}

export interface UploadOnePagerPreviewResponse {
  success: boolean;
  data: any; // Updated FundraisingProfile with preview image URL
}

/**
 * Get presigned upload URL for video upload
 */
export async function getVideoUploadUrl(demoDayId: string, params: GetVideoUploadUrlParams): Promise<GetVideoUploadUrlResponse> {
  const { filename, filesize, mimetype, teamUid } = params;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/${demoDayId}/teams/${teamUid}/fundraising-profile/video/upload-url`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/fundraising-profile/video/upload-url`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        filesize,
        mimetype,
      }),
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to get presigned upload URL');
  }

  const data: GetVideoUploadUrlResponse = await response.json();
  return data;
}

/**
 * Confirm video upload completion
 */
export async function confirmVideoUpload(demoDayId: string, params: ConfirmVideoUploadParams): Promise<ConfirmVideoUploadResponse> {
  const { uploadUid, teamUid } = params;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/${demoDayId}/teams/${teamUid}/fundraising-profile/video/confirm`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/fundraising-profile/video/confirm`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadUid,
      }),
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to confirm video upload');
  }

  const data: ConfirmVideoUploadResponse = await response.json();
  return data;
}

/**
 * Get presigned upload URL for one-pager upload
 */
export async function getOnePagerUploadUrl(demoDayId: string, params: GetOnePagerUploadUrlParams): Promise<GetOnePagerUploadUrlResponse> {
  const { filename, filesize, mimetype, teamUid } = params;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/${demoDayId}/teams/${teamUid}/fundraising-profile/one-pager/upload-url`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/fundraising-profile/one-pager/upload-url`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        filesize,
        mimetype,
      }),
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to get presigned upload URL for one-pager');
  }

  const data: GetOnePagerUploadUrlResponse = await response.json();
  return data;
}

/**
 * Confirm one-pager upload completion
 */
export async function confirmOnePagerUpload(
  demoDayId: string,
  params: ConfirmOnePagerUploadParams,
): Promise<ConfirmOnePagerUploadResponse> {
  const { uploadUid, teamUid } = params;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/${demoDayId}/teams/${teamUid}/fundraising-profile/one-pager/confirm`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/fundraising-profile/one-pager/confirm`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadUid,
      }),
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to confirm one-pager upload');
  }

  const data: ConfirmOnePagerUploadResponse = await response.json();
  return data;
}

/**
 * Upload preview image for one-pager
 */
export async function uploadOnePagerPreview(
  demoDayId: string,
  params: UploadOnePagerPreviewParams,
): Promise<UploadOnePagerPreviewResponse> {
  const { previewImage, previewImageSmall, teamUid } = params;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/${demoDayId}/teams/${teamUid}/fundraising-profile/one-pager/preview`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/fundraising-profile/one-pager/preview`;

  const formData = new FormData();
  formData.append('previewImage', previewImage);
  formData.append('previewImageSmall', previewImageSmall);

  const response = await customFetch(
    url,
    {
      method: 'POST',
      body: formData,
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to upload one-pager preview image');
  }

  const data: UploadOnePagerPreviewResponse = await response.json();
  return data;
}
