import { customFetch } from '@/utils/fetch-wrapper';

export async function handleDownloadKit(): Promise<boolean> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/ai-apps/starter-kit/download`,
    { method: 'GET' },
    true,
  );

  if (!response || !response.ok) return false;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-app-starter-kit.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}
