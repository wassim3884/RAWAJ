import { useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToCloudinary } from '../lib/upload';

/**
 * File upload widget backed by Cloudinary. Shows thumbnails of already-uploaded
 * files with a remove button, plus a button to add more.
 *
 * Props:
 *  - label: field label shown above the widget
 *  - value: array of already-uploaded URLs
 *  - onChange: (nextUrls: string[]) => void
 *  - resourceType: 'image' | 'video'
 *  - multiple: allow selecting more than one file at once
 *  - maxFiles: optional cap on total files
 */
export default function FileUploader({ label, value = [], onChange, resourceType = 'image', multiple = true, maxFiles }) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (maxFiles && value.length + files.length > maxFiles) {
      toast.error(`الحد الأقصى ${maxFiles} ملفات.`);
      return;
    }

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file, resourceType);
        uploaded.push(url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      toast.error(err.message || 'فشل رفع الملف.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAt = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium">{label}</label>}

      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              {resourceType === 'video' ? (
                <video src={url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-500"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 hover:border-primary hover:text-primary dark:border-slate-700">
        {uploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
        {uploading ? 'جاري الرفع...' : (resourceType === 'video' ? 'رفع فيديو من الحاسوب' : 'رفع صور من الحاسوب')}
        <input
          type="file"
          accept={resourceType === 'video' ? 'video/*' : 'image/*'}
          multiple={multiple}
          onChange={handleFiles}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}
