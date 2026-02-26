import React from "react";
import Link from "next/link";

const LAST_UPDATED = "February 25, 2026";
const EFFECTIVE_DATE = "February 25, 2026";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    content: `Radius ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use the Radius platform and related services ("Service"). Please read this policy carefully. By using the Service, you consent to the practices described in this policy.`,
  },
  {
    id: "information-collected",
    title: "2. Information We Collect",
    content: `We collect information you provide directly to us, such as your name, email address, and payment information when you register or subscribe. We also collect information automatically when you use the Service, including usage data, log files, device identifiers, and cookie data. When you connect social media accounts, we collect OAuth tokens and associated profile information necessary to operate the Service on your behalf.`,
  },
  {
    id: "information-use",
    title: "3. How We Use Your Information",
    content: `We use your information to: (a) provide, maintain, and improve the Service; (b) process transactions and send related information including confirmations and invoices; (c) send administrative notices, product updates, and marketing communications (you may opt out at any time); (d) monitor and analyze usage trends and activity; (e) detect, investigate, and prevent fraudulent or illegal activity; and (f) comply with legal obligations.`,
  },
  {
    id: "ai-processing",
    title: "4. AI Processing of Your Content",
    content: `To provide AI-generated content, your template configurations, topic inputs, and associated metadata are sent to Google's Gemini API for processing. This data is subject to Google's privacy policies and data processing terms in addition to ours. We do not sell your content to third parties. AI-generated outputs are stored in our systems to deliver the Service and may be used in aggregate, anonymized form to improve our models.`,
  },
  {
    id: "sharing",
    title: "5. Sharing of Information",
    content: `We do not sell your personal information. We may share your information with: (a) service providers who assist in operating the Service (e.g., Supabase for database hosting, Stripe for payments, Google for AI processing), each bound by confidentiality obligations; (b) analytics partners using anonymized, aggregated data only; (c) law enforcement or government authorities when required by law or to protect our legal rights; and (d) a successor entity in the event of a merger, acquisition, or sale of assets, with notice to you.`,
  },
  {
    id: "social-media",
    title: "6. Social Media Account Data",
    content: `When you connect your social media accounts (e.g., Instagram, TikTok), we store authorization tokens to act on your behalf to schedule and publish content. We access only the permissions you explicitly grant. You may revoke access at any time from your account settings or directly via the social platform. We do not share your social account data with third parties except as necessary to operate the Service.`,
  },
  {
    id: "cookies",
    title: "7. Cookies and Tracking Technologies",
    content: `We use cookies and similar technologies to authenticate users, remember preferences, analyze usage, and improve the Service. Essential cookies are required for the Service to function. You may disable non-essential cookies via your browser settings, though this may affect certain features. We do not respond to "Do Not Track" browser signals at this time.`,
  },
  {
    id: "data-retention",
    title: "8. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide the Service. After account deletion, we may retain certain data for up to 90 days for backup and fraud-prevention purposes, after which it is deleted. Anonymized, aggregated data may be retained indefinitely for analytical purposes. You may request deletion of your data at any time (see Your Rights below).`,
  },
  {
    id: "security",
    title: "9. Security",
    content: `We implement industry-standard technical and organizational measures to protect your information, including encryption in transit (TLS) and at rest, access controls, and regular security reviews. However, no security system is impenetrable. We cannot guarantee the absolute security of your information and are not responsible for unauthorized access caused by circumstances beyond our reasonable control.`,
  },
  {
    id: "rights",
    title: "10. Your Rights",
    content: `Depending on your location, you may have the right to: access the personal information we hold about you; request correction of inaccurate data; request deletion of your data; object to or restrict certain processing; and data portability. To exercise these rights, contact us at support@useradius.app. We will respond within 30 days. If you are in the EU/EEA, you also have the right to lodge a complaint with your local supervisory authority.`,
  },
  {
    id: "children",
    title: "11. Children's Privacy",
    content: `The Service is not directed to children under the age of 16. We do not knowingly collect personal information from children. If we become aware that a child under 16 has provided us personal information, we will delete it promptly. If you believe we have collected information from a child under 16, please contact us at support@useradius.app.`,
  },
  {
    id: "international",
    title: "12. International Data Transfers",
    content: `Radius is based in the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States or other countries where our service providers operate. By using the Service, you consent to such transfers. We take steps to ensure that appropriate safeguards are in place where required by applicable law.`,
  },
  {
    id: "third-party",
    title: "13. Third-Party Links and Services",
    content: `The Service may contain links to third-party websites or services. This Privacy Policy does not apply to those third parties. We encourage you to review the privacy policies of any third-party services you access. We are not responsible for the content or privacy practices of third-party websites.`,
  },
  {
    id: "changes",
    title: "14. Changes to This Policy",
    content: `We may update this Privacy Policy periodically. We will notify you of material changes by posting the updated policy and revising the "Last Updated" date. Your continued use of the Service after changes are posted constitutes your acceptance of the updated policy. We encourage you to review this policy regularly.`,
  },
  {
    id: "contact",
    title: "15. Contact Us",
    content: `If you have questions, concerns, or requests regarding this Privacy Policy, please contact us at support@useradius.app. For EU/EEA residents, you may also contact our data protection team at the same address.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
            Legal
          </div>
          <h1 className="text-4xl font-bold font-main mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg mb-6 max-w-2xl">
            Your privacy matters to us. This policy explains what data we
            collect, how we use it, and the controls you have over your
            information.
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
              For the full terms governing your use of Radius, see our{" "}
              <Link
                href="/terms-of-service"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                Terms of Service
              </Link>
              . Questions? Email us at{" "}
              <a
                href="mailto:support@useradius.app"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                support@useradius.app
              </a>
              .
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
