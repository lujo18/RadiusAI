'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiCheck, FiArrowRight } from 'react-icons/fi';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to ViralStack! 🎉',
      description: 'You\'re all set up! Let\'s take a quick tour of what you can do.',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <FiCheck className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">AI-Powered Content</h4>
              <p className="text-gray-400 text-sm">Generate viral carousel posts with Gemini 2.0</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <FiCheck className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Custom Templates</h4>
              <p className="text-gray-400 text-sm">Create your unique brand style with templates</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <FiCheck className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">A/B Testing</h4>
              <p className="text-gray-400 text-sm">Test variants and find what performs best</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Create Your First Template',
      description: 'Templates define your carousel style - colors, fonts, structure, and AI prompts.',
      content: (
        <div className="space-y-4">
          <div className="glass-card p-4 border border-primary-500/20">
            <h4 className="text-white font-semibold mb-2">What's a Template?</h4>
            <p className="text-gray-400 text-sm mb-3">
              A template is your brand's unique carousel format. It controls:
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                Visual style (colors, fonts, backgrounds)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                Content tone and structure
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                AI generation instructions
              </li>
            </ul>
          </div>
          <div className="bg-dark-500/50 p-4 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">
              💡 <strong className="text-white">Pro Tip:</strong> Start with a category like "Listicle" or "Quote" 
              and customize from there.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Generate Your First Post',
      description: 'Once you have a template, generate carousel posts in seconds with AI.',
      content: (
        <div className="space-y-4">
          <div className="glass-card p-4 border border-primary-500/20">
            <h4 className="text-white font-semibold mb-2">The Process</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                  1
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Choose your template</p>
                  <p className="text-xs text-gray-400">Select from your saved templates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                  2
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Enter your topic</p>
                  <p className="text-xs text-gray-400">What do you want to post about?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                  3
                </div>
                <div>
                  <p className="text-sm text-white font-medium">AI generates slides</p>
                  <p className="text-xs text-gray-400">Get a full carousel in 10 seconds</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-dark-500/50 p-4 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">
              🚀 <strong className="text-white">Ready to start?</strong> Let's create your first template!
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - redirect to template creation
      onClose();
      router.push('/dashboard/templates/create');
    }
  };

  const handleSkip = () => {
    onClose();
    router.push('/dashboard');
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full p-8 relative animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary-500'
                  : index < currentStep
                  ? 'w-2 bg-primary-500/50'
                  : 'w-2 bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-gray-400 mb-6">
            {currentStepData.description}
          </p>
          <div>{currentStepData.content}</div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Skip tutorial
          </button>
          <button
            onClick={handleNext}
            className="btn-primary flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? (
              <>
                Create Template
                <FiCheck className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <FiArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
