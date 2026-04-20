import backendClient from '@/lib/api/clients/backendClient';

type CheckoutArgs = {
  productId: string;
  successUrl: string;
};

export async function startCheckout({ productId, successUrl }: CheckoutArgs) {
  const body = {
    product_id: productId,
    success_url: successUrl,
  };

  console.log('Starting checkout with body:', body);

  const resp = await backendClient.post('/api/v1/billing/checkout/create', body);
  const data = resp?.data ?? resp;
  const url = data?.checkout_url || data?.url;
  if (!url) throw new Error('Checkout URL not returned by server');

  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}
