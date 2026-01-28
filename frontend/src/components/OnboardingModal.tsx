"use client";
import React from "react";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiCheck, FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

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
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
              <FiCheck className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-1">AI-Powered Content</h4>
              <p className="text-muted text-sm">Generate viral carousel posts with Gemini 2.0</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
              <FiCheck className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-1">Custom Templates</h4>
              <p className="text-muted text-sm">Create your unique brand style with templates</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
              <FiCheck className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-1">A/B Testing</h4>
              <p className="text-muted text-sm">Test variants and find what performs best</p>
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
          <div className="glass-card p-4 border border-accent/20">
            <h4 className="text-foreground font-semibold mb-2">What's a Template?</h4>
            <p className="text-muted text-sm mb-3">
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
              💡 <strong className="text-foreground">Pro Tip:</strong> Start with a category like "Listicle" or "Quote" 
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
          <div className="glass-card p-4 border border-primary/20">
            <h4 className="text-foreground font-semibold mb-2">The Process</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground">
                  1
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Choose your template</p>
                  <p className="text-xs text-muted-foreground">Select from your saved templates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground">
                  2
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Enter your topic</p>
                  <p className="text-xs text-muted-foreground">What do you want to post about?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground">
                  3
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">AI generates slides</p>
                  <p className="text-xs text-muted-foreground">Get a full carousel in 10 seconds</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg border border">
            <p className="text-sm text-muted-foreground">
              🚀 <strong className="text-foreground">Ready to start?</strong> Let's create your first template!
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
      router.push('/brand/templates');
    }
  };

  const handleSkip = () => {
    onClose();
    router.push('/overview');
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full p-8 relative animate-slide-up">
        {/* Close button */}
        <Button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <FiX className="w-6 h-6" />
        </Button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : index < currentStep
                  ? 'w-2 bg-primary/50'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-muted-foreground mb-6">
            {currentStepData.description}
          </p>
          <div>{currentStepData.content}</div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tutorial
          </Button>
          <Button
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
          </Button>
        </div>
      </div>
    </div>
  );
}
