import React from 'react';
import type { Product } from '@/types/billing';
import { Card, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '../ui/button';

type Props = {
  activeId: string | null;
  product: Product;
  primaryAction: (priceExternalId: string) => void;
  secondaryAction?: () => void;
  variant?: 'featured' | 'compact';
};

export default function PricingCard({ activeId, product, primaryAction, secondaryAction, variant = 'compact' }: Props) {
  const price = product.prices[0]
  return (
    <Card size={variant === 'compact' ? 'sm' : 'default'} className={`pricing-card ${variant} ${product.metadata?.most_popular ? "border-primary" : ""}`}>
      <CardContent className='h-full'>
        <CardTitle className='lead'>{product.name}</CardTitle>

        {price && (
          <div className="mt-3">
            <h2 className="">
              {(price.price_amount / 100).toFixed(2)} {price.price_currency?.toUpperCase()}
            </h2>
            <p className='m-0 muted'>{price.recurring_interval ?? 'monthly'}</p>
          </div>
        )}

        {product?.benefits && (
          <ul>
          {product.benefits.map((benefit) => (
            <li key={benefit.description}>
              <span className='muted'>{benefit.properties.units} {benefit.description}</span>

            </li>
          ))}
          </ul>
        )}
      </CardContent>

      <CardFooter>
        <div className="w-full flex gap-2">
          {activeId ?
          
            activeId == product.id ?
            <Button disabled className='w-full' variant="secondary">
              Active plan
            </Button>
            :
            <Button onClick={() => primaryAction(product.id)} className='w-full' variant="default">
              Switch Plan
            </Button>
          :
          price && (
            <Button onClick={() => primaryAction(product.id)} className='w-full' variant="default">
              Get started
            </Button>
          )}
          {secondaryAction && (
            <button onClick={secondaryAction} className="btn-ghost px-3 py-1">
              Learn more
            </button>
          )
        }
        </div>
      </CardFooter>
    </Card>
  );
}