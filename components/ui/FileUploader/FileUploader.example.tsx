// Example usage of the FileUploader component

import React from 'react';
import { FileUploader } from './FileUploader';

export const FileUploaderExample: React.FC = () => {
  const handleUpload = (files: File[]) => {
    console.log('Uploaded files:', files);
    // Handle the uploaded files here
    // You can send them to an API, process them, etc.
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>File Uploader Examples</h2>
      
      {/* Pitch Deck Uploader - matching the provided example */}
      <div style={{ marginBottom: '40px' }}>
        <FileUploader
          title="Upload Your Pitch Deck"
          description="Accepted format: PDF, max 1 slide only, up to 5MB."
          supportedFormats={['PDF']}
          maxFiles={1}
          maxFileSize={5}
          onUpload={handleUpload}
        />
      </div>

      {/* Document Uploader */}
      <div style={{ marginBottom: '40px' }}>
        <FileUploader
          title="Upload Documents"
          description="Accepted formats: PDF, DOC, DOCX, up to 10MB each, maximum 3 files."
          supportedFormats={['PDF', 'DOC', 'DOCX']}
          maxFiles={3}
          maxFileSize={10}
          onUpload={handleUpload}
        />
      </div>

      {/* Image Uploader */}
      <div style={{ marginBottom: '40px' }}>
        <FileUploader
          title="Upload Images"
          description="Accepted formats: JPG, PNG, GIF, up to 2MB each, maximum 5 files."
          supportedFormats={['JPG', 'JPEG', 'PNG', 'GIF']}
          maxFiles={5}
          maxFileSize={2}
          onUpload={handleUpload}
        />
      </div>

      {/* Disabled Uploader */}
      <div style={{ marginBottom: '40px' }}>
        <FileUploader
          title="Upload Disabled"
          description="This uploader is currently disabled."
          supportedFormats={['PDF']}
          maxFiles={1}
          maxFileSize={5}
          onUpload={handleUpload}
          disabled={true}
        />
      </div>
    </div>
  );
};
