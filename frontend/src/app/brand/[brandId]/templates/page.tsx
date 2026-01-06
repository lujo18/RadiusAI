import TemplatesTab from '@/components/Dashboard/TemplatesTab';

export default async function TemplatesPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;

  // Validate brandId if necessary
  if (!brandId || typeof brandId !== 'string') {
    throw new Error('Invalid brandId');
  }

  return (
    <div>
      <TemplatesTab brandId={brandId} />
    </div>
  );
}
