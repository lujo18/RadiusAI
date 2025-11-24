'use client';

import Link from 'next/link';
import { FiZap, FiCheck } from 'react-icons/fi';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: 29,
      description: 'Perfect for solo creators testing the waters',
      features: [
        'Up to 50 posts per week',
        '1 Instagram account',
        '1 TikTok account',
        'Basic analytics',
        'Standard style templates',
        'Email support',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Pro',
      price: 79,
      description: 'For serious creators scaling their presence',
      features: [
        '98 posts per week (7/day)',
        '3 Instagram accounts',
        '3 TikTok accounts',
        'Advanced analytics & insights',
        'Custom AI style guides',
        'A/B testing & optimization',
        'Priority support',
        'Custom image generation',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Agency',
      price: 199,
      description: 'For agencies managing multiple clients',
      features: [
        'Unlimited posts',
        '10+ accounts per platform',
        'White-label reports',
        'Team collaboration',
        'API access',
        'Custom integrations',
        'Dedicated account manager',
        'Advanced brand guidelines',
        'Multi-client dashboard',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <FiZap className="text-primary-500 text-3xl mr-2" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-pink-600 bg-clip-text text-transparent">
                SlideForge
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="hover:text-primary-400 transition">
                Log In
              </Link>
              <Link 
                href="/signup"
                className="bg-primary-500 hover:bg-primary-600 px-6 py-2 rounded-lg font-semibold transition"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Choose the plan that fits your content goals. All plans include a 7-day free trial.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <FiCheck className="text-green-500" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-gray-800/50 border rounded-2xl p-8 ${
                  plan.popular
                    ? 'border-primary-500 shadow-xl shadow-primary-500/20 scale-105'
                    : 'border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <FiCheck className="text-primary-500 flex-shrink-0 mt-1" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.cta === 'Contact Sales' ? '#contact' : '/signup'}
                  className={`block text-center py-3 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-primary-500 hover:bg-primary-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FAQItem
              question="How does the free trial work?"
              answer="Start with any plan and get full access for 7 days. No credit card required. Cancel anytime before the trial ends and you won't be charged."
            />
            <FAQItem
              question="Can I change plans later?"
              answer="Yes! Upgrade or downgrade anytime. Changes take effect at the start of your next billing cycle."
            />
            <FAQItem
              question="What happens if I exceed my post limit?"
              answer="You'll receive a notification when approaching your limit. You can upgrade your plan or purchase additional posts as needed."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund."
            />
            <FAQItem
              question="How does the AI optimization work?"
              answer="Our AI analyzes your post performance weekly, identifies winning patterns, and automatically adjusts your content strategy to maximize engagement."
            />
            <FAQItem
              question="Can I use my own images?"
              answer="Absolutely! You can upload custom images or use our AI-generated images. Pro and Agency plans include unlimited custom image generation."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Automate Your Content?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join creators who save 15+ hours per week with SlideForge.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-primary-500 hover:bg-primary-600 px-10 py-4 rounded-lg font-bold text-xl transition transform hover:scale-105"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2025 SlideForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-3">{question}</h3>
      <p className="text-gray-400">{answer}</p>
    </div>
  );
}
