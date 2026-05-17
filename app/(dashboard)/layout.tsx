import { SiteShell } from '@/components/layout/site-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
