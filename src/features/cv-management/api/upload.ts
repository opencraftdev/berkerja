import type { CV } from '@/types/cv';

export async function uploadCV(file: File, userId: string): Promise<CV> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  const response = await fetch('/api/cv/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error((await response.json()).error ?? 'Upload failed');
  }

  return response.json();
}

export async function getUserCVs(userId: string): Promise<CV[]> {
  const response = await fetch(`/api/cv?userId=${encodeURIComponent(userId)}`, {
    headers: {
      'x-user-id': userId,
    },
  });

  if (!response.ok) {
    throw new Error((await response.json()).error ?? 'Failed to fetch CVs');
  }

  return response.json();
}
