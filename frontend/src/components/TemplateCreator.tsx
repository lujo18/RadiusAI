'use client';

import { useState } from 'react';
import { FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { 
  TEMPLATE_CATEGORIES, 
  DEFAULT_STYLE_CONFIGS, 
  type TemplateCategory,
  type StyleConfig,
  type CreateTemplateInput 
} from '@/types/template';

interface TemplateCreatorProps {
  onClose: () => void;
  onSave: (template: CreateTemplateInput) => void;
  existingTemplate?: any;
}

export default function TemplateCreator({ onClose, onSave, existingTemplate }: TemplateCreatorProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(existingTemplate?.name || '');
  const [category, setCategory] = useState<TemplateCategory>(existingTemplate?.category || 'listicle');
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(
    existingTemplate?.styleConfig || DEFAULT_STYLE_CONFIGS[category]
  );
  const [isDefault, setIsDefault] = useState(existingTemplate?.isDefault || false);

  const handleCategoryChange = (newCategory: TemplateCategory) => {
    setCategory(newCategory);
    setStyleConfig(DEFAULT_STYLE_CONFIGS[newCategory]);
  };

  const handleSave = () => {
    const template: CreateTemplateInput = {
      name,
      category,
      styleConfig,
      isDefault
    };
    onSave(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-2xl font-bold">
              {existingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <FiX size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? 'bg-primary-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <Step1 
              name={name}
              setName={setName}
              category={category}
              setCategory={handleCategoryChange}
              isDefault={isDefault}
              setIsDefault={setIsDefault}
            />
          )}
          {step === 2 && (
            <Step2 
              styleConfig={styleConfig}
              setStyleConfig={setStyleConfig}
            />
          )}
          {step === 3 && (
            <Step3 
              styleConfig={styleConfig}
              setStyleConfig={setStyleConfig}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700 bg-gray-900 sticky bottom-0">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-6 py-3 text-gray-400 hover:text-white transition"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <div className="flex gap-3">
            {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !name}
                className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <FiCheck />
                Save Template
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Basic Info & Category
function Step1({ name, setName, category, setCategory, isDefault, setIsDefault }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">Template Name</label>
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Bold Questions, Minimal Quotes"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-5 h-5 accent-primary-500"
          />
          <span className="text-sm font-semibold">Set as default template</span>
        </label>
        <p className="text-xs text-gray-400 mt-1 ml-7">
          This template will be used for new posts unless specified
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-4">Select Category</label>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(TEMPLATE_CATEGORIES).map(([key, info]) => (
            <CategoryCard 
              key={key}
              categoryKey={key as TemplateCategory}
              info={info}
              selected={category === key}
              onSelect={() => setCategory(key as TemplateCategory)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ categoryKey, info, selected, onSelect }: any) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-lg border-2 transition ${
        selected 
          ? 'border-primary-500 bg-primary-500/10' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${selected ? 'text-primary-400' : 'text-gray-400'}`}>
          {info.icon === 'FiList' && '📋'}
          {info.icon === 'FiMessageSquare' && '💬'}
          {info.icon === 'FiBook' && '📖'}
          {info.icon === 'FiAward' && '🎓'}
          {info.icon === 'FiTrendingUp' && '📈'}
          {info.icon === 'FiSettings' && '⚙️'}
        </div>
        <div className="flex-1">
          <h4 className="font-bold mb-1">{info.name}</h4>
          <p className="text-xs text-gray-400 mb-2">{info.bestFor}</p>
          <div className="text-xs text-gray-500">
            {info.structure.length} slides • {info.hookStyles.join(', ')} hooks
          </div>
        </div>
        {selected && <FiCheck className="text-primary-400" />}
      </div>
    </button>
  );
}

// Step 2: Visual Style
function Step2({ styleConfig, setStyleConfig }: any) {
  const updateVisual = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...styleConfig };
    let current: any = newConfig.visual;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setStyleConfig(newConfig);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Visual Style</h3>

      {/* Background */}
      <div>
        <label className="block text-sm font-semibold mb-3">Background Type</label>
        <div className="flex gap-3">
          {['gradient', 'solid', 'image'].map((type) => (
            <button
              key={type}
              onClick={() => updateVisual('background.type', type)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 capitalize transition ${
                styleConfig.visual.background.type === type
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-semibold mb-3">Background Colors</label>
        <div className="flex gap-3">
          {styleConfig.visual.background.colors.map((color: string, index: number) => (
            <div key={index} className="flex-1">
              <input 
                type="color"
                value={color}
                onChange={(e) => {
                  const newColors = [...styleConfig.visual.background.colors];
                  newColors[index] = e.target.value;
                  updateVisual('background.colors', newColors);
                }}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
              <input 
                type="text"
                value={color}
                onChange={(e) => {
                  const newColors = [...styleConfig.visual.background.colors];
                  newColors[index] = e.target.value;
                  updateVisual('background.colors', newColors);
                }}
                className="w-full mt-2 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block text-sm font-semibold mb-3">Accent Color</label>
        <div className="flex gap-3">
          <input 
            type="color"
            value={styleConfig.visual.accentColor}
            onChange={(e) => updateVisual('accentColor', e.target.value)}
            className="w-24 h-12 rounded-lg cursor-pointer"
          />
          <input 
            type="text"
            value={styleConfig.visual.accentColor}
            onChange={(e) => updateVisual('accentColor', e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
          />
        </div>
      </div>

      {/* Font Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Font Family</label>
          <select 
            value={styleConfig.visual.font.family}
            onChange={(e) => updateVisual('font.family', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
          >
            <option>Inter Bold</option>
            <option>Montserrat Bold</option>
            <option>Poppins Bold</option>
            <option>Georgia</option>
            <option>Arial Black</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Font Size</label>
          <input 
            type="number"
            value={styleConfig.visual.font.size}
            onChange={(e) => updateVisual('font.size', parseInt(e.target.value))}
            min={24}
            max={80}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
          />
        </div>
      </div>

      {/* Font Color */}
      <div>
        <label className="block text-sm font-semibold mb-3">Font Color</label>
        <div className="flex gap-3">
          <input 
            type="color"
            value={styleConfig.visual.font.color}
            onChange={(e) => updateVisual('font.color', e.target.value)}
            className="w-24 h-12 rounded-lg cursor-pointer"
          />
          <input 
            type="text"
            value={styleConfig.visual.font.color}
            onChange={(e) => updateVisual('font.color', e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
          />
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="block text-sm font-semibold mb-3">Aspect Ratio</label>
        <div className="flex gap-3">
          {['9:16', '1:1', '4:5'].map((ratio) => (
            <button
              key={ratio}
              onClick={() => setStyleConfig({ ...styleConfig, layout: { ...styleConfig.layout, aspectRatio: ratio } })}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                styleConfig.layout.aspectRatio === ratio
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              {ratio} {ratio === '9:16' && '(Stories)'}
              {ratio === '1:1' && '(Feed)'}
              {ratio === '4:5' && '(Portrait)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 3: Content Rules
function Step3({ styleConfig, setStyleConfig }: any) {
  const updateContent = (key: string, value: any) => {
    setStyleConfig({
      ...styleConfig,
      content: {
        ...styleConfig.content,
        [key]: value
      }
    });
  };

  const addForbiddenWord = () => {
    const word = prompt('Enter word to forbid:');
    if (word) {
      updateContent('forbiddenWords', [...styleConfig.content.forbiddenWords, word.toLowerCase()]);
    }
  };

  const removeForbiddenWord = (word: string) => {
    updateContent('forbiddenWords', styleConfig.content.forbiddenWords.filter((w: string) => w !== word));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Content Rules</h3>

      {/* Tone */}
      <div>
        <label className="block text-sm font-semibold mb-3">Tone</label>
        <div className="grid grid-cols-3 gap-3">
          {['direct', 'casual', 'professional'].map((tone) => (
            <button
              key={tone}
              onClick={() => updateContent('tone', tone)}
              className={`px-4 py-3 rounded-lg border-2 capitalize transition ${
                styleConfig.content.tone === tone
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Hook Style */}
      <div>
        <label className="block text-sm font-semibold mb-3">Hook Style</label>
        <div className="grid grid-cols-3 gap-3">
          {['question', 'statement', 'number'].map((hook) => (
            <button
              key={hook}
              onClick={() => updateContent('hookStyle', hook)}
              className={`px-4 py-3 rounded-lg border-2 capitalize transition ${
                styleConfig.content.hookStyle === hook
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              {hook}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-400 space-y-1">
          <div>• Question: "Want to know the secret?"</div>
          <div>• Statement: "This changed everything"</div>
          <div>• Number: "7 ways to improve..."</div>
        </div>
      </div>

      {/* Emojis */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox"
            checked={styleConfig.content.useEmojis}
            onChange={(e) => updateContent('useEmojis', e.target.checked)}
            className="w-5 h-5 accent-primary-500"
          />
          <span className="text-sm font-semibold">Use Emojis</span>
        </label>
      </div>

      {/* CTA Template */}
      <div>
        <label className="block text-sm font-semibold mb-2">CTA Template</label>
        <input 
          type="text"
          value={styleConfig.content.ctaTemplate}
          onChange={(e) => updateContent('ctaTemplate', e.target.value)}
          placeholder="e.g., Save this for later!"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
        />
        <p className="text-xs text-gray-400 mt-1">
          This will appear on the last slide
        </p>
      </div>

      {/* Forbidden Words */}
      <div>
        <label className="block text-sm font-semibold mb-2">Forbidden Words</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {styleConfig.content.forbiddenWords.map((word: string) => (
            <span 
              key={word}
              className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {word}
              <button 
                onClick={() => removeForbiddenWord(word)}
                className="hover:text-red-300"
              >
                <FiX size={14} />
              </button>
            </span>
          ))}
          <button 
            onClick={addForbiddenWord}
            className="border-2 border-dashed border-gray-600 px-3 py-1 rounded-full text-sm hover:border-primary-500 transition"
          >
            + Add Word
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Gemini will avoid using these words in generated content
        </p>
      </div>

      {/* Slide Count */}
      <div>
        <label className="block text-sm font-semibold mb-2">Number of Slides</label>
        <input 
          type="range"
          min={5}
          max={10}
          value={styleConfig.layout.slideCount}
          onChange={(e) => setStyleConfig({ 
            ...styleConfig, 
            layout: { ...styleConfig.layout, slideCount: parseInt(e.target.value) }
          })}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>5 slides</span>
          <span className="font-bold text-primary-400">{styleConfig.layout.slideCount} slides</span>
          <span>10 slides</span>
        </div>
      </div>

      {/* Preview Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
        <FiAlertCircle className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-blue-400 font-semibold mb-1">Gemini Prompt Generation</p>
          <p className="text-gray-300">
            These rules will be automatically converted into a structured prompt for Gemini 2.0 Flash
            to ensure consistent content generation that matches your brand.
          </p>
        </div>
      </div>
    </div>
  );
}
