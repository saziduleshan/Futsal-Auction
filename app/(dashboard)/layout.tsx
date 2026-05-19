import { headers } from 'next/headers';
import { SiteShell } from '@/components/layout/site-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const url = headersList.get('x-invoke-path') ||
              headersList.get('x-pathname') ||
              headersList.get('next-url') || '';
  const bgImage = url.includes('/admin/players') ? '/Player%20Database.jpg' : undefined;

  return <SiteShell bgImage={bgImage}>{children}</SiteShell>;
}
