import type { UploadInfo } from '@/services/demo-day/hooks/useGetFundraisingProfile';

const HLS_READY_AFTER_MS = 5 * 60 * 1000;

/** Prefer MP4 until HLS transcoding has had time to finish, then use streamUrl when available. */
export function getVideoPlaybackUrl(upload: UploadInfo | null | undefined): string {
  if (!upload) return '';

  const mp4Url = upload.url ?? '';
  const streamUrl = upload.streamUrl ?? '';

  if (!mp4Url && !streamUrl) return '';

  const createdAt = upload.createdAt ? new Date(upload.createdAt).getTime() : 0;
  const isHlsReady = Date.now() - createdAt >= HLS_READY_AFTER_MS;

  if (isHlsReady && streamUrl) {
    return streamUrl;
  }

  return mp4Url;
}

/** CDN workaround — use S3 direct URLs until pfps.plnetwork.io is fixed */
function toS3(url: string | undefined, bucket: string, key?: string): string | undefined {
  if (!url || url.includes('amazonaws.com')) return url;
  const objectKey = key ?? url.replace(/^https?:\/\/[^/]+\//, '');
  return `https://${bucket}.s3.us-west-1.amazonaws.com/${objectKey}`;
}

export function withOnePagerS3Urls<T extends { onePagerUpload?: UploadInfo | null }>(profile: T): T {
  const upload = profile.onePagerUpload;
  if (!upload?.bucket) return profile;

  const { bucket, key } = upload;
  return {
    ...profile,
    onePagerUpload: {
      ...upload,
      url: toS3(upload.url, bucket, key) ?? upload.url,
      previewImageUrl: toS3(upload.previewImageUrl, bucket) ?? upload.previewImageUrl,
      previewImageSmallUrl: toS3(upload.previewImageSmallUrl, bucket) ?? upload.previewImageSmallUrl,
    },
  };
}
