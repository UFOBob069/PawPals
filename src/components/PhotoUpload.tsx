import React, { useState, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaCamera } from 'react-icons/fa';
import Image from 'next/image';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  userId: string;
  onPhotoUploaded: (url: string) => void;
  disabled?: boolean;
}

export default function PhotoUpload({ currentPhotoUrl, userId, onPhotoUploaded, disabled }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setImageError(false);
      
      // Create a reference to the file in Firebase Storage
      const photoRef = ref(storage, `profilePhotos/${userId}/${Date.now()}-${file.name}`);
      
      // Upload the file
      await uploadBytes(photoRef, file);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(photoRef);
      
      // Call the callback with the new URL
      onPhotoUploaded(downloadUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setImageError(true);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-32 h-32 group">
      <div 
        onClick={handleClick}
        className={`relative w-full h-full rounded-full overflow-hidden border-2 
          ${isUploading ? 'opacity-50' : ''} 
          ${!disabled ? 'border-primary-coral hover:border-primary-coral/80 cursor-pointer' : 'border-gray-200'}
          transition-colors duration-200`}
      >
        {currentPhotoUrl && !imageError ? (
          <div className="relative w-full h-full">
            <Image
              src={currentPhotoUrl}
              alt="Profile photo"
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized // Add this to bypass Next.js image optimization if still having issues
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <FaCamera className={`text-3xl ${!disabled ? 'text-primary-coral' : 'text-gray-400'}`} />
          </div>
        )}

        {/* Overlay with upload text */}
        {!disabled && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="text-white text-center">
              <FaCamera className="mx-auto text-2xl mb-1" />
              <span className="text-sm">Upload Photo</span>
            </div>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || disabled}
      />
    </div>
  );
} 