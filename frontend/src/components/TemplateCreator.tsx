'use client';

import { useState, useRef, useEffect } from 'react';
import { FiX, FiCheck, FiPlus, FiTrash2, FiCopy, FiLayers, FiType, FiImage, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage } from 'react-konva';
import { 
  TEMPLATE_CATEGORIES, 
  DEFAULT_STYLE_CONFIGS, 
  type TemplateCategory,
  type StyleConfig,
  type CreateTemplateInput, 
  AspectRatio,
  ASPECT_RATIOS
} from '@/types/template';

// Aspect ratio presets


// Text element types
type TextElement = {
  id: string;
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'bold' | 'italic';
  color: string;
  x: number;
  y: number;
  width: number;
  align: 'left' | 'center' | 'right';
};

// Background types
type BackgroundConfig = {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradientColors?: [string, string];
  gradientAngle?: number;
  imageUrl?: string;
};

// Slide design
type SlideDesign = {
  id: string;
  name: string;
  background: BackgroundConfig;
  elements: TextElement[];
};

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
      elements: []
    }
  ]);
  
  // Slide sequence mapping (which design to use for each slide number)
  const [slideSequence, setSlideSequence] = useState<{ slideNumber: number; designId: string }[]>([
    { slideNumber: 1, designId: 'S1' }
  ]);
  
  const [totalSlides, setTotalSlides] = useState(5);

  const [selectedDesignId, setSelectedDesignId] = useState('S1');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const selectedDesign = slideDesigns.find(d => d.id === selectedDesignId);

  const handleCategoryChange = (newCategory: TemplateCategory) => {
    setCategory(newCategory);
  };

  const handleSave = () => {
    // Convert slide designs to styleConfig format for backend compatibility
    const styleConfig = {
      ...DEFAULT_STYLE_CONFIGS[category],
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
      styleConfig,
      isDefault
    };
    onSave(template);
  };

  const addNewDesign = () => {
    const newId = `S${slideDesigns.length + 1}`;
    setSlideDesigns([...slideDesigns, {
      id: newId,
      name: `Slide Design ${slideDesigns.length + 1}`,
      background: { type: 'solid', color: '#1a1a1a' },
      elements: []
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

// Step 1: Basic Info & Category
function Step1({ name, setName, category, setCategory, isDefault, setIsDefault }: any) {
  return (
    <div className="p-6 overflow-y-auto h-full space-y-4">
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

// Step 2: Konva Visual Editor (Figma-inspired)
function Step2VisualEditor({ 
  aspectRatio, 
  setAspectRatio, 
  slideDesigns, 
  setSlideDesigns,
  selectedDesignId,
  setSelectedDesignId,
  selectedElementId,
  setSelectedElementId,
  addNewDesign,
  deleteDesign,
  duplicateDesign
}: any) {
  const selectedDesign = slideDesigns.find((d: SlideDesign) => d.id === selectedDesignId);
  const canvasDimensions = ASPECT_RATIOS[aspectRatio as AspectRatio];
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);

  // Calculate maximum zoom that fits in container
  useEffect(() => {
    const calculateMaxZoom = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 40; // Account for padding
      const containerHeight = container.clientHeight - 100; // Account for controls and margins
      
      const scaleX = containerWidth / canvasDimensions.width;
      const scaleY = containerHeight / canvasDimensions.height;
      const calculatedMaxZoom = Math.min(scaleX, scaleY, 1); // Don't exceed 100%
      
      setMaxZoom(calculatedMaxZoom);
      setZoom(calculatedMaxZoom); // Set initial zoom to fit
    };

    calculateMaxZoom();
    window.addEventListener('resize', calculateMaxZoom);
    return () => window.removeEventListener('resize', calculateMaxZoom);
  }, [canvasDimensions]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 1)); // Max 100%
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.2)); // Min 20%
  };

  const handleResetZoom = () => {
    setZoom(maxZoom);
  };

  const updateBackground = (updates: Partial<BackgroundConfig>) => {
    setSlideDesigns(slideDesigns.map((d: SlideDesign) => 
      d.id === selectedDesignId 
        ? { ...d, background: { ...d.background, ...updates } }
        : d
    ));
  };

  const addTextElement = (textType: 'header' | 'body' | 'subheader' | 'caption') => {
    const fontSizes = {
      header: 72,
      body: 48,
      subheader: 56,
      caption: 36
    };

    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: textType === 'header' ? 'Add Header' : textType === 'body' ? 'Add Body Text' : textType === 'subheader' ? 'Add Subheader' : 'Add Caption',
      fontSize: fontSizes[textType],
      fontFamily: 'Inter',
      fontStyle: textType === 'header' || textType === 'subheader' ? 'bold' : 'normal',
      color: '#ffffff',
      x: 100,
      y: 100 + (selectedDesign?.elements.length || 0) * 100,
      width: canvasDimensions.width - 200,
      align: 'center'
    };

    setSlideDesigns(slideDesigns.map((d: SlideDesign) =>
      d.id === selectedDesignId
        ? { ...d, elements: [...d.elements, newElement] }
        : d
    ));
    setSelectedElementId(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<TextElement>) => {
    setSlideDesigns(slideDesigns.map((d: SlideDesign) =>
      d.id === selectedDesignId
        ? { 
            ...d, 
            elements: d.elements.map(el => 
              el.id === elementId ? { ...el, ...updates } : el
            )
          }
        : d
    ));
  };

  const deleteElement = (elementId: string) => {
    setSlideDesigns(slideDesigns.map((d: SlideDesign) =>
      d.id === selectedDesignId
        ? { ...d, elements: d.elements.filter(el => el.id !== elementId) }
        : d
    ));
    setSelectedElementId(null);
  };

  const selectedElement = selectedDesign?.elements.find((el: TextElement) => el.id === selectedElementId);

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Design List */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold mb-2">Slide Designs</h3>
          <button
            onClick={addNewDesign}
            className="w-full bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
          >
            <FiPlus /> New Design
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {slideDesigns.map((design: SlideDesign) => (
            <div
              key={design.id}
              onClick={() => setSelectedDesignId(design.id)}
              className={`p-3 rounded-lg cursor-pointer border-2 transition ${
                selectedDesignId === design.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{design.id}</span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateDesign(design.id); }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <FiCopy size={14} />
                  </button>
                  {slideDesigns.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDesign(design.id); }}
                      className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">{design.name}</p>
              <p className="text-xs text-gray-500 mt-1">{design.elements.length} elements</p>
            </div>
          ))}
        </div>
      </div>

      {/* Center Canvas */}
      <div ref={containerRef} className="flex-1 flex flex-col items-center bg-gray-800/30 p-4 overflow-hidden">
        <div className="mb-2 flex items-center gap-3 flex-shrink-0">
          {/* Aspect Ratio Selector */}
          <div className="flex gap-2">
            {Object.entries(ASPECT_RATIOS).map(([ratio, dims]) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio as AspectRatio)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                  aspectRatio === ratio
                    ? 'bg-primary-500'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 ml-4 border-l border-gray-600 pl-4">
            <button
              onClick={handleZoomOut}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition"
              title="Zoom Out"
            >
              <FiZoomOut size={16} />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold transition"
              title="Fit to Screen"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition"
              title="Zoom In"
            >
              <FiZoomIn size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Canvas Container */}
        <div className="flex-1 overflow-auto w-full flex items-center justify-center">
          <div 
            className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden m-4"
            style={{
              width: canvasDimensions.width * zoom,
              height: canvasDimensions.height * zoom
            }}
          >
            <Stage 
              width={canvasDimensions.width * zoom} 
              height={canvasDimensions.height * zoom}
              scaleX={zoom}
              scaleY={zoom}
            >
          
            <Layer>
              {/* Background */}
              {selectedDesign?.background.type === 'solid' && (
                <Rect
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  fill={selectedDesign.background.color || '#000000'}
                />
              )}
              {selectedDesign?.background.type === 'gradient' && (
                <Rect
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ 
                    x: canvasDimensions.width, 
                    y: canvasDimensions.height 
                  }}
                  fillLinearGradientColorStops={[
                    0, selectedDesign.background.gradientColors?.[0] || '#667eea',
                    1, selectedDesign.background.gradientColors?.[1] || '#764ba2'
                  ]}
                />
              )}

              {/* Text Elements */}
              {selectedDesign?.elements.map((element: TextElement) => (
                <KonvaText
                  key={element.id}
                  text={element.content}
                  x={element.x}
                  y={element.y}
                  width={element.width}
                  fontSize={element.fontSize}
                  fontFamily={element.fontFamily}
                  fontStyle={element.fontStyle}
                  fill={element.color}
                  align={element.align}
                  draggable
                  onClick={() => setSelectedElementId(element.id)}
                  onTap={() => setSelectedElementId(element.id)}
                  onDragEnd={(e) => {
                    updateElement(element.id, {
                      x: e.target.x(),
                      y: e.target.y()
                    });
                  }}
                  stroke={selectedElementId === element.id ? '#6366f1' : undefined}
                  strokeWidth={selectedElementId === element.id ? 2 : 0}
                />
              ))}
            </Layer>
          </Stage>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-400 flex-shrink-0">
          Click and drag to reposition • {canvasDimensions.width} × {canvasDimensions.height}px
        </div>
      </div>

      {/* Right Sidebar - Properties Panel */}
      <div className="w-80 border-l border-gray-700 flex flex-col overflow-y-auto">
        {/* Design Name */}
        <div className="p-4 border-b border-gray-700">
          <label className="block text-xs font-semibold mb-2 text-gray-400">Design Name</label>
          <input
            type="text"
            value={selectedDesign?.name || ''}
            onChange={(e) => {
              setSlideDesigns(slideDesigns.map((d: SlideDesign) =>
                d.id === selectedDesignId ? { ...d, name: e.target.value } : d
              ));
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Add Elements */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <FiPlus /> Add Element
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addTextElement('header')}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2"
            >
              <FiType /> Header
            </button>
            <button
              onClick={() => addTextElement('subheader')}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2"
            >
              <FiType /> Subheader
            </button>
            <button
              onClick={() => addTextElement('body')}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2"
            >
              <FiType /> Body
            </button>
            <button
              onClick={() => addTextElement('caption')}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2"
            >
              <FiType /> Caption
            </button>
          </div>
        </div>

        {/* Background Settings */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <FiImage /> Background
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-2 text-gray-400">Type</label>
              <div className="flex gap-2">
                {['solid', 'gradient', 'image'].map((type) => (
                  <button
                    key={type}
                    onClick={() => updateBackground({ type: type as any })}
                    className={`flex-1 px-3 py-2 rounded text-xs font-semibold capitalize ${
                      selectedDesign?.background.type === type
                        ? 'bg-primary-500'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {selectedDesign?.background.type === 'solid' && (
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">Color</label>
                <input
                  type="color"
                  value={selectedDesign.background.color}
                  onChange={(e) => updateBackground({ color: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
            )}

            {selectedDesign?.background.type === 'gradient' && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">Color 1</label>
                  <input
                    type="color"
                    value={selectedDesign.background.gradientColors?.[0]}
                    onChange={(e) => updateBackground({ 
                      gradientColors: [e.target.value, selectedDesign.background.gradientColors?.[1] || '#764ba2'] 
                    })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">Color 2</label>
                  <input
                    type="color"
                    value={selectedDesign.background.gradientColors?.[1]}
                    onChange={(e) => updateBackground({ 
                      gradientColors: [selectedDesign.background.gradientColors?.[0] || '#667eea', e.target.value] 
                    })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Element Properties */}
        {selectedElement && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FiLayers /> Text Properties
              </h3>
              <button
                onClick={() => deleteElement(selectedElement.id)}
                className="text-red-400 hover:text-red-300"
              >
                <FiTrash2 size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">Content</label>
                <textarea
                  value={selectedElement.content}
                  onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">Font Size</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize}
                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                    min={12}
                    max={120}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">Color</label>
                  <input
                    type="color"
                    value={selectedElement.color}
                    onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                    className="w-full h-9 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">Font Family</label>
                <select
                  value={selectedElement.fontFamily}
                  onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                >
                  <option>Inter</option>
                  <option>Montserrat</option>
                  <option>Poppins</option>
                  <option>Georgia</option>
                  <option>Arial</option>
                  <option>Helvetica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">Font Style</label>
                <div className="flex gap-2">
                  {['normal', 'bold', 'italic'].map((style) => (
                    <button
                      key={style}
                      onClick={() => updateElement(selectedElement.id, { fontStyle: style as any })}
                      className={`flex-1 px-3 py-2 rounded text-xs font-semibold capitalize ${
                        selectedElement.fontStyle === style
                          ? 'bg-primary-500'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">Alignment</label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => updateElement(selectedElement.id, { align: align as any })}
                      className={`flex-1 px-3 py-2 rounded text-xs font-semibold capitalize ${
                        selectedElement.align === align
                          ? 'bg-primary-500'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 3: Slide Sequence Mapping
function Step3SlideSequence({ totalSlides, setTotalSlides, slideDesigns, slideSequence, setSlideSequence }: any) {
  const updateSlideMapping = (slideNumber: number, designId: string) => {
    const existing = slideSequence.find((s: any) => s.slideNumber === slideNumber);
    if (existing) {
      setSlideSequence(
        slideSequence.map((s: any) => 
          s.slideNumber === slideNumber ? { ...s, designId } : s
        )
      );
    } else {
      setSlideSequence([...slideSequence, { slideNumber, designId }]);
    }
  };

  const getDesignForSlide = (slideNumber: number) => {
    return slideSequence.find((s: any) => s.slideNumber === slideNumber)?.designId || slideDesigns[0]?.id;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto overflow-y-auto h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-1">Slide Sequence</h3>
        <p className="text-gray-400 text-sm">
          Map your slide designs to specific slide positions. You can reuse the same design across multiple slides.
        </p>
      </div>

      {/* Total Slides Control */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Total Number of Slides</label>
        <input
          type="range"
          min={3}
          max={10}
          value={totalSlides}
          onChange={(e) => setTotalSlides(parseInt(e.target.value))}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>3 slides</span>
          <span className="font-bold text-primary-400">{totalSlides} slides</span>
          <span>10 slides</span>
        </div>
      </div>

      {/* Slide Mapping Grid */}
      <div className="space-y-3">
        {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slideNum) => (
          <div key={slideNum} className="flex items-center gap-4 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex-shrink-0 w-24">
              <span className="text-sm font-semibold text-gray-400">Slide {slideNum}</span>
            </div>
            
            <div className="flex-1">
              <select
                value={getDesignForSlide(slideNum)}
                onChange={(e) => updateSlideMapping(slideNum, e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
              >
                {slideDesigns.map((design: SlideDesign) => (
                  <option key={design.id} value={design.id}>
                    {design.id} - {design.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview indicator */}
            <div className="flex-shrink-0">
              {(() => {
                const designId = getDesignForSlide(slideNum);
                const design = slideDesigns.find((d: SlideDesign) => d.id === designId);
                return (
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-600"
                    style={{
                      background: design?.background.type === 'solid' 
                        ? design.background.color 
                        : design?.background.type === 'gradient'
                        ? `linear-gradient(135deg, ${design.background.gradientColors?.[0]}, ${design.background.gradientColors?.[1]})`
                        : '#1a1a1a'
                    }}
                  />
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Summary</h4>
        <div className="text-sm text-gray-300 space-y-1">
          {slideDesigns.map((design: SlideDesign) => {
            const count = slideSequence.filter((s: any) => s.designId === design.id).length;
            if (count === 0) return null;
            return (
              <div key={design.id}>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}