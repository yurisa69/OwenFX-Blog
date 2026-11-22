import { requireAdmin } from '@/lib/admin-auth';
import SoftwareManager from './software-manager';

export default async function SoftwareAdminPage({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  return <SoftwareManager initialCreate={params.create === '1'} />;
}
