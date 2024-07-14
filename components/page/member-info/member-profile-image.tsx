import React, { useEffect, useRef } from 'react';

interface ProfileImageProps {
  imageUrl?: string;
  name: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ imageUrl, name }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png') && file.size <= 4 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        if (imageRef.current) {
          imageRef.current.src = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a JPEG or PNG image less than 4MB.');
    }
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    if (imageRef.current) {
      imageRef.current.src = '';
    }
  };

  useEffect(() => {
    console.log('profile loaded')
  }, [])

  return (
    <>
      <div className="profile-image-component">
        {imageUrl && isValidImageUrl(imageUrl) ? (
          <div className="image-container">
            <img className='image-container' ref={imageRef} src={imageUrl} alt="Profile" name={name} />
            <button onClick={handleIconClick}>🔄</button>
            <button onClick={handleDelete}>🗑️</button>
          </div>
        ) : (
          <button onClick={handleIconClick}>📤</button>
        )}
        <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
      </div>
      <style jsx>{`
      
        .image-container {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
      
      `}</style>
    </>
  );
};

export default ProfileImage;
