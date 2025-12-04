frontend/src/components/TemplateCreator/
├── index.tsx              # Main component with state management
├── types.ts               # Shared TypeScript types
├── CategoryCard.tsx       # Category selection card
├── Step1BasicInfo.tsx     # Step 1: Basic template info
├── Step2VisualEditor.tsx  # Step 2: Konva visual editor
└── Step3SlideSequence.tsx # Step 3: Slide sequence mapping

What Changed
types.ts - Extracted shared types (TextElement, BackgroundConfig, SlideDesign)
CategoryCard.tsx - Separate component for category selection cards
Step1BasicInfo.tsx - Template name, category, and default flag
Step2VisualEditor.tsx - Complete Konva editor with zoom, scroll, and all visual editing features
Step3SlideSequence.tsx - Slide sequence mapping interface
index.tsx - Main component that orchestrates all steps and manages state