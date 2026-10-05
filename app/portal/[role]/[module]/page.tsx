import { notFound } from 'next/navigation';
import { ROLES, isModule } from '@/lib/registry';
import type { Role } from '@/lib/types';
import { ModulePage } from '@/components/modules';

export default function Page({ params }: { params: { role: string; module: string } }) {
  if (!ROLES.includes(params.role as Role) || !isModule(params.role as Role, params.module)) notFound();
  return <ModulePage role={params.role as Role} module={params.module} />;
}
