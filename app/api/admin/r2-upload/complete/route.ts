import { handleR2Complete } from '@/lib/r2-upload-handler';
export const runtime = 'nodejs';
export async function POST(request: Request) { return handleR2Complete(request, 'admin'); }
