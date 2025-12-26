'use client';

import { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { DEFAULT_STYLE_CONFIGS } from '@/types';
import type { TemplateCategory, AspectRatio, StyleConfig, CreateTemplateInput } from '@/types';
import { type SlideDesign } from './types';
import Step1BasicInfo from './Step1BasicInfo';
import Step2VisualEditor from './Step2VisualEditor';
import Step3SlideSequence from './Step3SlideSequence';

interface TemplateCreatorProps {
  onClose: () => void;
  onSave: (template: CreateTemplateInput) => void;
  existingTemplate?: any;
}

export default function TemplateCreator({ onClose, onSave, existingTemplate }: TemplateCreatorProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(existingTemplate?.name || '');
  const [category, setCategory] = useState<TemplateCategory>(existingTemplate?.category || 'listicle');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [isDefault, setIsDefault] = useState(existingTemplate?.isDefault || false);
  
  // Slide designs (S1, S2, S3, etc.)
  const [slideDesigns, setSlideDesigns] = useState<SlideDesign[]>([
    {
      id: 'S1',
      name: 'Hook Slide',
      background: { type: 'gradient', gradientColors: ['#667eea', '#764ba2'], gradientAngle: 135 },
      elements: [],
      dynamic: true
    }
  ]);
  
  // Slide sequence mapping (which design to use for each slide number)
  const [slideSequence, setSlideSequence] = useState<{ slideNumber: number; designId: string }[]>([
    { slideNumber: 1, designId: 'S1' }
  ]);
  
  const [totalSlides, setTotalSlides] = useState(5);
  const [selectedDesignId, setSelectedDesignId] = useState('S1');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const handleCategoryChange = (newCategory: TemplateCategory) => {
    setCategory(newCategory);
  };

  const handleSave = () => {
    // Convert slide designs to styleConfig format for backend compatibility
    const styleConfig = {
      layout: {
        aspectRatio: aspectRatio,
        slideCount: totalSlides,
      },
      slideDesigns,
      slideSequence,
    };

    const template: CreateTemplateInput = {
      name,
      category,
      style_config: styleConfig,
      is_default: isDefault
    };
    onSave(template);
  };

  const addNewDesign = () => {
    const newId = `S${slideDesigns.length + 1}`;
    setSlideDesigns([...slideDesigns, {
      id: newId,
      name: `Slide Design ${slideDesigns.length + 1}`,
      background: { type: 'solid', color: '#1a1a1a' },
      elements: [],
      dynamic: true
    }]);
    setSelectedDesignId(newId);
  };

  const deleteDesign = (designId: string) => {
    if (slideDesigns.length === 1) return; // Keep at least one design
    setSlideDesigns(slideDesigns.filter(d => d.id !== designId));
    if (selectedDesignId === designId) {
      setSelectedDesignId(slideDesigns[0].id);
    }
  };

  const duplicateDesign = (designId: string) => {
    const designToDuplicate = slideDesigns.find(d => d.id === designId);
    if (!designToDuplicate) return;
    
    const newId = `S${slideDesigns.length + 1}`;
    setSlideDesigns([...slideDesigns, {
      ...designToDuplicate,
      id: newId,
      name: `${designToDuplicate.name} (Copy)`,
      elements: designToDuplicate.elements.map(el => ({ ...el, id: `${newId}-${Math.random()}` }))
    }]);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-7xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {existingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            {/* Progress Bar - Inline */}
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s}
                  className={`h-1.5 w-12 rounded-full ${
                    s <= step ? 'bg-primary-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">Step {step} of 3</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {step === 1 && (
            <Step1BasicInfo 
              name={name}
              setName={setName}
              category={category}
              setCategory={handleCategoryChange}
              isDefault={isDefault}
              setIsDefault={setIsDefault}
            />
          )}
          {step === 2 && (
            <Step2VisualEditor
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              slideDesigns={slideDesigns}
              setSlideDesigns={setSlideDesigns}
              selectedDesignId={selectedDesignId}
              setSelectedDesignId={setSelectedDesignId}
              selectedElementId={selectedElementId}
              setSelectedElementId={setSelectedElementId}
              addNewDesign={addNewDesign}
              deleteDesign={deleteDesign}
              duplicateDesign={duplicateDesign}
            />
          )}
          {step === 3 && (
            <Step3SlideSequence
              totalSlides={totalSlides}
              setTotalSlides={setTotalSlides}
              slideDesigns={slideDesigns}
              slideSequence={slideSequence}
              setSlideSequence={setSlideSequence}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-3 border-t border-gray-700 bg-gray-900">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <div className="flex gap-2">
            {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !name}
                className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 disabled:cursor-not-allowed px-5 py-2 rounded-lg text-sm font-semibold transition"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
              >
                <FiCheck size={16} />
                Save Template
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
