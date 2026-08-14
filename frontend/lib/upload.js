/**
 * Uploads a file directly to Cloudinary using an unsigned upload preset.
 * Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 * to be set (see README for setup instructions). Returns the resulting secure URL.
 */
export async function uploadToCloudinary(file, resourceType = 'image') {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('رفع الملفات غير مُفعّل بعد على الخادم. تواصل مع المطوّر لإعداد Cloudinary.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل رفع الملف.');
  }

  const data = await response.json();
  return data.secure_url;
}
