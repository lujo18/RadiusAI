import React from "react";
import Link from "next/link";

const LAST_UPDATED = "February 25, 2026";
const EFFECTIVE_DATE = "February 25, 2026";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using Radius ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service.`,
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: `Radius is an AI-powered carousel content automation platform that enables users to create, schedule, and publish multi-slide content for social media platforms including Instagram and TikTok. The Service uses artificial intelligence to generate content based on user-defined templates with A/B testing capabilities.`,
  },
  {
    id: "accounts",
    title: "3. Accounts and Registration",
    content: `To access certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. Radius reserves the right to terminate accounts that violate these Terms.`,
  },
  {
    id: "subscriptions",
    title: "4. Subscriptions and Billing",
    content: `Access to the Service requires an active paid subscription. We offer Pro ($29/month) and Agency ($99/month) plans. Subscriptions are billed on a recurring monthly basis. You authorize us to charge your payment method for the applicable subscription fee. Subscriptions automatically renew unless cancelled before the renewal date. All fees are non-refundable except as required by applicable law. We reserve the right to change pricing with at least 30 days' notice.`,
  },
  {
    id: "content",
    title: "5. User Content",
    content: `You retain ownership of any content you create using the Service ("User Content"). By using the Service, you grant Radius a non-exclusive, worldwide, royalty-free license to use, reproduce, and display your User Content solely to provide the Service. You are solely responsible for your User Content and represent that you have all rights necessary to grant this license. You agree not to upload content that is illegal, harmful, or violates third-party rights.`,
  },
  {
    id: "ai-generated",
    title: "6. AI-Generated Content",
    content: `The Service uses AI models (including Google Gemini) to generate content based on your templates and inputs. AI-generated content is provided "as is" and may not always be accurate, complete, or appropriate. You are solely responsible for reviewing, editing, and approving all AI-generated content before publication. Radius does not guarantee that AI-generated content is free from errors, biases, or intellectual property violations.`,
  },
  {
    id: "prohibited",
    title: "7. Prohibited Uses",
    content: `You agree not to use the Service to: (a) violate any applicable laws or regulations; (b) generate spam, deceptive, or misleading content; (c) infringe on any third party's intellectual property rights; (d) distribute malware or malicious code; (e) attempt to gain unauthorized access to any part of the Service; (f) scrape, crawl, or extract data from the Service without authorization; (g) use the Service for any unlawful, harmful, or fraudulent purpose; or (h) violate the terms of service of any social media platform you connect to Radius.`,
  },
  {
    id: "social-media",
    title: "8. Third-Party Social Media Platforms",
    content: `When you connect social media accounts to Radius, you authorize us to access and interact with those accounts on your behalf. Your use of connected platforms is also subject to their respective terms of service and policies. Radius is not responsible for changes to third-party APIs or platform policies that may affect the Service's functionality. We may lose access to certain platform features at any time without notice.`,
  },
  {
    id: "intellectual-property",
    title: "9. Intellectual Property",
    content: `The Service, including its design, software, logos, trademarks, and content (excluding User Content), is owned by Radius and protected by intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service or its content without our prior written consent. The Radius name, logo, and related marks are trademarks of Radius and may not be used without permission.`,
  },
  {
    id: "disclaimers",
    title: "10. Disclaimers",
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. RADIUS DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.`,
  },
  {
    id: "limitation",
    title: "11. Limitation of Liability",
    content: `TO THE FULLEST EXTENT PERMITTED BY LAW, RADIUS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE. IN NO EVENT SHALL RADIUS'S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO RADIUS IN THE 12 MONTHS PRECEDING THE CLAIM.`,
  },
  {
    id: "termination",
    title: "12. Termination",
    content: `We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. Upon termination, your right to use the Service will cease immediately. You may cancel your account at any time through your account settings. Sections 5, 9, 10, and 11 survive termination.`,
  },
  {
    id: "governing-law",
    title: "13. Governing Law",
    content: `These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved exclusively in the courts located in Delaware.`,
  },
  {
    id: "changes",
    title: "14. Changes to Terms",
    content: `We may update these Terms from time to time. We will notify you of material changes by posting the new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after any changes constitutes your acceptance of the new Terms. If you do not agree to the modified Terms, you must stop using the Service.`,
  },
  {
    id: "contact",
    title: "15. Contact Us",
    content: `If you have questions about these Terms, please contact us at legal@radiusapp.com.`,
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
            Legal
          </div>
          <h1 className="text-4xl font-bold font-main mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-lg mb-6 max-w-2xl">
            Please read these terms carefully before using Radius. By using our
            platform, you agree to be bound by the following terms and conditions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <span>
              <span className="text-foreground font-medium">Effective Date:</span>{" "}
              {EFFECTIVE_DATE}
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <span>
              <span className="text-foreground font-medium">Last Updated:</span>{" "}
              {LAST_UPDATED}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 flex gap-12">
        {/* Sidebar TOC — hidden on mobile */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Contents
            </p>
            <nav className="flex flex-col gap-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5 leading-snug"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Body */}
        <article className="flex-1 min-w-0 space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-8">
              <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{s.content}</p>
            </section>
          ))}

          <div className="border-t border-border pt-10 mt-10">
            <p className="text-sm text-muted-foreground">
              By using Radius, you acknowledge that you have read, understood,
              and agree to be bound by these Terms of Service. See also our{" "}
              <Link
                href="/privacy-policy"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
