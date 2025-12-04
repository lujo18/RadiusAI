import { type SlideDesign } from './types';

interface Step3SlideSequenceProps {
  totalSlides: number;
  setTotalSlides: (count: number) => void;
  slideDesigns: SlideDesign[];
  slideSequence: { slideNumber: number; designId: string }[];
  setSlideSequence: (sequence: { slideNumber: number; designId: string }[]) => void;
}

export default function Step3SlideSequence({ 
  totalSlides, 
  setTotalSlides, 
  slideDesigns, 
  slideSequence, 
  setSlideSequence 
}: Step3SlideSequenceProps) {
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
                <span className="font-semibold">{design.id}</span> used in {count} slide{count > 1 ? 's' : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
