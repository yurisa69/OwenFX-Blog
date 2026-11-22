import { handleR2Presign } from '@/lib/r2-upload-handler';
export const runtime = 'nodejs';
export async function POST(request: Request) { return handleR2Presign(request, 'admin'); }
