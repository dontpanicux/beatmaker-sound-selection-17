import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface ProfilePhotoUploadProps {
  accessToken: string | null;
  onPhotoUploaded: (photoUrl: string) => void;
}

export function ProfilePhotoUpload({ accessToken, onPhotoUploaded }: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      if (!accessToken) {
        throw new Error('No access token available');
      }
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/png;base64,")
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e44554cb/profile/photo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Send publicAnonKey in Authorization header for Supabase infrastructure
            'Authorization': `Bearer ${publicAnonKey}`,
            // Send user's actual token in custom header for our server to verify
            'X-Access-Token': accessToken
          },
          body: JSON.stringify({
            photo: base64,
            contentType: file.type
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      onPhotoUploaded(data.photoUrl);
      toast.success('Profile photo updated');
    } catch (error: any) {
      console.error('Upload photo error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="profile-photo-input"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-[4px] p-[6px] bg-[#27272a] hover:bg-[#3f3f46] rounded-[4px] border border-[#3f3f47] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Upload profile photo"
      >
        <Upload className="size-[14px] text-[#99a1af]" />
        <span className="font-['Inter:Medium',sans-serif] font-medium text-[12px] text-[#99a1af]">
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </span>
      </button>
    </>
  );
}