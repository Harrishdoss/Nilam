import { notFound } from 'next/navigation';
import { ROLES, isModule } from '@/lib/registry';
import type { Role } from '@/lib/types';
import { DetailPage } from '@/components/modules';

export default function Page({ params }: { params: { role: string; module: string; id: string } }) {
  if (!ROLES.includes(params.role as Role) || !isModule(params.role as Role, params.module)) notFound();
  return <DetailPage role={params.role as Role} module={params.module} id={decodeURIComponent(params.id)} />;
}
