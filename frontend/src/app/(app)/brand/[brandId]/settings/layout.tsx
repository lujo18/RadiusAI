'use client';

import { useParams, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const brandId = params?.brandId as string;

  // Determine active tab based on current path
  const isCtasPage = pathname?.includes('/settings/ctas');
  const activeTab = isCtasPage ? 'ctas' : 'general';

  return (
    <div className="w-full mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ghost-white mb-2">Brand Settings</h1>
        <p className="text-ghost-white/60">
          Manage your brand identity, voice, and social media integrations
        </p>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="bg-card/50 border border-border backdrop-blur-md">
          <TabsTrigger value="general" asChild>
            <Link href={`/brand/${brandId}/settings`}>General</Link>
          </TabsTrigger>
          <TabsTrigger value="ctas" asChild>
            <Link href={`/brand/${brandId}/settings/ctas`}>Call-to-Actions</Link>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {children}
        </div>
      </Tabs>
    </div>
  );
}
