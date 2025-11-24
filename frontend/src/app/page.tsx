'use client';

import Link from 'next/link';
import { FiZap, FiTrendingUp, FiClock, FiBarChart2, FiRefreshCw, FiTarget } from 'react-icons/fi';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FiZap className="text-primary-500 text-3xl mr-2" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-pink-600 bg-clip-text text-transparent">
                SlideForge
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="hover:text-primary-400 transition">Features</a>
              <Link href="/pricing" className="hover:text-primary-400 transition">Pricing</Link>
              <a href="#how-it-works" className="hover:text-primary-400 transition">How It Works</a>
            </div>
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            98 Carousels Per Week.
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Zero Manual Work.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            AI-powered carousel automation for Instagram & TikTok. Generate, schedule, optimize, and evolve your content on complete autopilot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link 
              href="/signup"
              className="bg-primary-500 hover:bg-primary-600 px-8 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105"
            >
              Get Started Free →
            </Link>
            <a 
              href="#how-it-works"
              className="border border-gray-600 hover:border-primary-500 px-8 py-4 rounded-lg font-semibold transition"
            >
              Watch Demo
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <FiZap className="text-primary-500" />
              <span>No design skills needed</span>
            </div>
            <div className="flex items-center gap-2">
              <FiClock className="text-primary-500" />
              <span>Save 15+ hours/week</span>
            </div>
            <div className="flex items-center gap-2">
              <FiTrendingUp className="text-primary-500" />
              <span>Auto-optimization</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Everything You Need to Dominate Social
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FiZap />}
              title="AI Content Generation"
              description="Enter your niche once. GPT creates 98 unique, on-brand carousels per week with your exact style guide."
            />
            <FeatureCard 
              icon={<FiTarget />}
              title="Smart A/B Testing"
              description="Automatically tests 4-6 variants per topic. Identifies winning formats and evolves your strategy."
            />
            <FeatureCard 
              icon={<FiClock />}
              title="Auto-Scheduling"
              description="One-click scheduling for Instagram & TikTok. 7 posts per day, perfectly timed for maximum reach."
            />
            <FeatureCard 
              icon={<FiBarChart2 />}
              title="Analytics Dashboard"
              description="Real-time tracking of impressions, saves, shares, and reach. Know what's working instantly."
            />
            <FeatureCard 
              icon={<FiRefreshCw />}
              title="Self-Evolving System"
              description="AI analyzes performance weekly and automatically updates your content strategy for better results."
            />
            <FeatureCard 
              icon={<FiTrendingUp />}
              title="Multi-Platform Support"
              description="Perfect carousels for Instagram + TikTok photo posts. Same content, optimized for each platform."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            From Idea to Published in 4 Steps
          </h2>
          <div className="space-y-12">
            <StepCard 
              number="1"
              title="Set Your Style Guide"
              description="Tell the AI your brand colors, fonts, tone, and format preferences. One time setup."
            />
            <StepCard 
              number="2"
              title="Generate Week's Content"
              description="Click 'Generate Week' and AI creates 98 carousels with multiple tested variants."
            />
            <StepCard 
              number="3"
              title="Auto-Schedule & Post"
              description="One-click scheduling across Instagram and TikTok. Sit back and watch them go live."
            />
            <StepCard 
              number="4"
              title="AI Analyzes & Evolves"
              description="System tracks performance, identifies winners, and auto-improves next batch."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Trusted by Growth-Focused Creators</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Sarah Chen"
              role="Fitness Creator"
              content="Went from 8K to 47K followers in 3 months. SlideForge handles all my content while I focus on coaching."
            />
            <TestimonialCard 
              name="Marcus Johnson"
              role="Business Coach"
              content="The A/B testing is insane. It found my winning format in week 2. Now every post performs."
            />
            <TestimonialCard 
              name="Alex Rivera"
              role="Tech Educator"
              content="Saves me 20+ hours per week. The auto-evolution feature keeps improving my engagement monthly."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to 10x Your Content Game?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of creators who automated their way to growth.
          </p>
          <Link 
            href="/signup"
            className="inline-block bg-primary-500 hover:bg-primary-600 px-10 py-4 rounded-lg font-bold text-xl transition transform hover:scale-105"
          >
            Start Your Free Trial
          </Link>
          <p className="text-gray-400 mt-4">No credit card required · 7-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <FiZap className="text-primary-500 text-2xl mr-2" />
                <span className="text-xl font-bold">SlideForge</span>
              </div>
              <p className="text-gray-400">AI-powered carousel automation for modern creators.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-primary-400">Features</a></li>
                <li><Link href="/pricing" className="hover:text-primary-400">Pricing</Link></li>
                <li><a href="#how-it-works" className="hover:text-primary-400">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary-400">About</a></li>
                <li><a href="#" className="hover:text-primary-400">Blog</a></li>
                <li><a href="#" className="hover:text-primary-400">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary-400">Privacy</a></li>
                <li><a href="#" className="hover:text-primary-400">Terms</a></li>
                <li><a href="#" className="hover:text-primary-400">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SlideForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-primary-500 transition">
      <div className="text-primary-500 text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 text-lg">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ name, role, content }: { name: string; role: string; content: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <p className="text-gray-300 mb-4 italic">"{content}"</p>
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-gray-400">{role}</p>
      </div>
    </div>
  );
}
