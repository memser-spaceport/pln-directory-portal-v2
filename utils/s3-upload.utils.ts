/**
 * Upload file directly to S3 using presigned URL with real progress tracking
 * @param file - The file to upload
 * @param presignedUrl - The presigned URL from the backend
 * @param contentType - The MIME type of the file
 * @param onProgress - Callback function to track upload progress (0-100)
 * @returns Promise that resolves when upload is complete
 */
export function uploadToS3(
  file: File,
  presignedUrl: string,
  contentType: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    // Handle successful upload
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });

    // Handle upload errors
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    // Handle upload abort
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    // Handle timeout
    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out'));
    });

    // Set up the request
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);

    // Set a reasonable timeout (15 minutes for large files)
    xhr.timeout = 15 * 60 * 1000;

    // Send the file
    xhr.send(file);
  });
}
