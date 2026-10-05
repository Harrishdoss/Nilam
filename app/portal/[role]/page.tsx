import { redirect } from 'next/navigation';
export default function PortalHome({ params }: { params: { role: string } }) { redirect(`/portal/${params.role}/overview`); }
