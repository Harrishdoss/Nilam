import { notFound } from 'next/navigation';
import PortalFrame from '@/components/shell/PortalFrame';
import { ROLES } from '@/lib/registry';
import type { Role } from '@/lib/types';

export default function PortalLayout({ children, params }: { children: React.ReactNode; params: { role: string } }) {
  if (!ROLES.includes(params.role as Role)) notFound();
  return <PortalFrame role={params.role as Role}>{children}</PortalFrame>;
}
