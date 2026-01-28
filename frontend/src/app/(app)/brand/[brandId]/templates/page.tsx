import React from 'react';
import TemplatesTab from '@/components/Dashboard/TemplatesTab';

export default function TemplatesPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = React.use(params);
  
  // Validate brandId format (simple check for obviously invalid IDs)
  if (!brandId || typeof brandId !== 'string' || brandId === 'undefined') {
    // For client-side, use window.location; for server-side, throw error
    if (typeof window !== 'undefined') {
      window.location.replace('/overview');
    }
    return null;
  }

  return (
    <div className='p-4'>
      <TemplatesTab brandId={brandId} />
    </div>
  );
}
