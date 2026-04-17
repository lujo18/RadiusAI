import React, { useMemo, useState } from 'react';
import { useProducts } from '@/features/billing/products/hooks';
import { startCheckout } from '@/features/billing/checkout/service';
import PricingCard from './PricingCard';
import type { Product } from '@/types/billing';
import { useCurrentPlanDisplay } from '@/hooks/useCurrentPlanDisplay';

type Props = {
  teamId?: string;
  featuredPlanKey?: string; // optional
};

export default function PricingSection({ teamId }: Props) {
  const { data: products, isLoading, error } = useProducts();
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);




  const currentPlan = useCurrentPlanDisplay()

  const productList: Product[] = useMemo(() => products ?? [], [products]);

  const handleCheckout = async (productId: string) => {
    setLoadingPrice(productId);
    try {
      await startCheckout({ productId, successUrl: window.location.href });
    } catch (err) {
      console.error('startCheckout failed', err);
      alert('Checkout failed. See console for details.');
    } finally {
      setLoadingPrice(null);
    }
  };

  if (isLoading) return <div>Loading plans...</div>;
  if (!productList || !Array.isArray(productList)  || error) return <div>Error loading plans {error?.message}</div>;
  

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      {productList.map((p) => (
        <PricingCard key={p.id} activeId={currentPlan.planId} product={p} primaryAction={handleCheckout} />
      ))}
    </div>
  );
}