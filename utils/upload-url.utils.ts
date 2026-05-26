import type { UploadInfo } from '@/services/demo-day/hooks/useGetFundraisingProfile';

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
