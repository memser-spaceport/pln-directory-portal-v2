/**
 * Formats file size in bytes to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted string like "3KB", "2MB", "1.5GB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = bytes / Math.pow(k, i);
  
  // Format to 1 decimal place for sizes >= 1KB, no decimals for bytes
  const formattedSize = i === 0 ? size.toString() : size.toFixed(1);
  
  // Remove unnecessary .0
  const cleanSize = formattedSize.replace(/\.0$/, '');
  
  return `${cleanSize}${sizes[i]}`;
}

/**
 * Validates file type against allowed types
 * @param file - File object
 * @param allowedTypes - Array of allowed MIME types
 * @returns boolean indicating if file type is valid
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validates file size against maximum allowed size
 * @param file - File object
 * @param maxSizeInBytes - Maximum allowed size in bytes
 * @returns boolean indicating if file size is valid
 */
export function validateFileSize(file: File, maxSizeInBytes: number): boolean {
  return file.size <= maxSizeInBytes;
}

/**
 * Gets file extension from filename
 * @param filename - Name of the file
 * @returns File extension (without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.slice(lastDotIndex + 1).toLowerCase() : '';
}

/**
 * Checks if a file is a PDF based on its type or extension
 * @param file - File object or URL string
 * @returns boolean indicating if file is a PDF
 */
export function isPDF(file: File | string): boolean {
  if (typeof file === 'string') {
    return file.toLowerCase().includes('.pdf') || file.toLowerCase().includes('pdf');
  }
  return file.type === 'application/pdf';
}

/**
 * Checks if a file is a video based on its type
 * @param file - File object
 * @returns boolean indicating if file is a video
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Checks if a file is an image based on its type
 * @param file - File object
 * @returns boolean indicating if file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}
