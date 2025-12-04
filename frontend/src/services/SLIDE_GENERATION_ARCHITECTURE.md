# Slide Generation System Architecture

## Overview

This system generates slide images from template designs with AI-filled content. It maintains visual consistency between the editor and exported slides by sharing core rendering logic.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Creates Template                    │
│                  (Step2VisualEditor.tsx)                     │
│                                                               │
│  • Designs slides visually in Konva                          │
│  • Saves SlideDesign[] to template.styleConfig.slideDesigns  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Template Stored in                        │
│                    Firebase Firestore                        │
│                                                               │
│  users/{userId}/templates/{templateId}                       │
│    └── styleConfig                                           │
│         ├── slideDesigns: SlideDesign[]                      │
│         ├── slideSequence: {slideNumber, designId}[]         │
│         └── layout: LayoutConfig                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI Generates Content                        │
│                                                               │
│  • Takes template structure                                  │
│  • Generates text for each slide                             │
│  • Returns string[] (one per slide)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Create PostContent Object                       │
│                                                               │
│  PostContent {                                               │
│    slides: PostSlide[] ← Template + AI text                  │
│    layout: LayoutConfig ← From template                      │
│    caption: string                                           │
│    hashtags: string[]                                        │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          generateAndUploadSlides(postContent)                │
│                                                               │
│  1. Sends PostContent to Web Worker                          │
│  2. Worker generates PNG blob for each slide                 │
│  3. Uploads blobs to Firebase Storage                        │
│  4. Returns download URLs                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure & Responsibilities

### 1. **Types** (`src/types/`)

#### `template.ts`
- **Template**: Complete template with metadata and styleConfig
- **StyleConfig**: Contains slideDesigns, slideSequence, layout
- **SlideDesign**: Reusable slide design (from TemplateCreator/types)
- **LayoutConfig**: Aspect ratio, slide count, structure

#### `post.ts`
- **PostContent**: The complete post data sent to worker
- **PostSlide**: Extends SlideDesign with filled content
- **Post**: Full post document with analytics, storage URLs

#### `TemplateCreator/types.ts`
- **SlideDesign**: Core slide structure (background + elements)
- **TextElement**: Positioned text with styling
- **BackgroundConfig**: Solid/gradient/image backgrounds

---

### 2. **Shared Rendering Logic** (`src/lib/konva/`)

#### `stageBuilder.ts`
**Purpose**: Single source of truth for Konva stage creation

**Functions**:
- `createBackgroundLayer()` - Builds background from BackgroundConfig
- `createContentLayer()` - Builds text elements layer
- `buildStageFromSlide()` - Complete stage from SlideDesign
- `buildStageForExport()` - High-DPI stage for image generation
- `stageToBlob()` - Converts stage to PNG blob

**Why**: Ensures visual consistency between editor and exported images

---

### 3. **Web Worker** (`src/services/`)

#### `slideGenWorker.ts`
**Purpose**: Generate slide images in background thread

**Process**:
1. Receives `PostContent` from main thread
2. Extracts layout dimensions from `ASPECT_RATIOS[layout.aspectRatio]`
3. For each `PostSlide`:
   - Creates `OffscreenCanvas` (no DOM needed)
   - Builds Konva stage with background + text elements
   - Renders to canvas
   - Converts to PNG blob via `convertToBlob()`
4. Posts blob back to main thread with progress

**Benefits**:
- Non-blocking UI during batch generation
- High DPI (2x pixel ratio) for quality
- Sequential processing ensures memory efficiency

---

### 4. **Service Layer** (`src/services/`)

#### `slideGenerator.ts`
**Purpose**: High-level API for slide generation

**Functions**:

##### `generateSlideImages(postContent, onProgress)`
- Creates worker
- Sends PostContent
- Collects results
- Returns ordered array of {slideIndex, blob}

##### `generateSingleSlide(slide, aspectRatio)`
- Preview single slide
- Useful for UI previews before creating post

##### `generateAndUploadSlides(postContent, postId, onProgress)`
- Generates all slides
- Uploads to Firebase Storage
- Returns download URLs
- All-in-one solution for post creation

---

## Data Flow Example

### Step-by-Step: Creating a Post

```typescript
// 1. User creates template in TemplateCreator
const template: Template = {
  id: 'template-123',
  styleConfig: {
    slideDesigns: [
      {
        id: 'design-hook',
        name: 'Hook Slide',
        background: { type: 'gradient', gradientColors: ['#000', '#111'] },
        elements: [
          { id: 'text-1', content: 'PLACEHOLDER', fontSize: 72, ... }
        ],
        dynamic: true
      },
      // ... more designs
    ],
    slideSequence: [
      { slideNumber: 1, designId: 'design-hook' },
      { slideNumber: 2, designId: 'design-point' },
    ],
    layout: { aspectRatio: '9:16', slideCount: 2 }
  }
}

// 2. AI generates content
const aiText = [
  '5 Tips to Boost Productivity',
  'Tip #1: Start with the hardest task'
]

// 3. Fill template with AI content
const postSlides: PostSlide[] = template.styleConfig.slideSequence.map((seq, i) => {
  const design = template.styleConfig.slideDesigns.find(d => d.id === seq.designId)!
  return {
    id: `slide-${i}`,
    slideNumber: seq.slideNumber,
    designId: design.id,
    background: design.background,
    elements: design.elements.map(el => ({
      ...el,
      content: design.dynamic ? aiText[i] : el.content
    }))
  }
})

// 4. Create PostContent
const postContent: PostContent = {
  slides: postSlides,
  layout: template.styleConfig.layout,
  caption: 'Boost your productivity today!',
  hashtags: ['#productivity']
}

// 5. Generate and upload
const imageUrls = await generateAndUploadSlides(
  postContent,
  'post-456',
  (progress) => console.log(`${progress.progress}% complete`)
)

// Result: ['https://storage.../slide_0.png', 'https://storage.../slide_1.png']
```

---

## Key Design Principles

### 1. **Single Source of Truth**
- SlideDesign type used everywhere (template, post, editor, worker)
- Shared rendering logic in `stageBuilder.ts`
- No duplication of Konva rendering code

### 2. **Type Safety**
- PostSlide extends SlideDesign (structural compatibility)
- TypeScript ensures PostContent always has required fields
- Worker receives strongly-typed messages

### 3. **Separation of Concerns**
- **Editor**: User creates designs visually
- **Template**: Stores reusable designs
- **AI**: Generates content text
- **Worker**: Renders images
- **Service**: Orchestrates workflow

### 4. **Performance**
- Worker runs in separate thread (non-blocking)
- OffscreenCanvas (no DOM manipulation)
- Sequential processing (memory efficient)
- High DPI (2x) for quality

### 5. **Extensibility**
- Easy to add new element types (images, shapes)
- New background types just need BackgroundConfig update
- Worker logic isolated - can be enhanced independently

---

## Common Pitfalls & Solutions

### Problem: "OffscreenCanvas not supported"
**Solution**: Check browser compatibility, fallback to main thread rendering

### Problem: "Fonts not loading in worker"
**Solution**: Pre-load fonts in main thread, use web-safe fallbacks

### Problem: "Images not rendering in background"
**Solution**: Convert images to data URLs before sending to worker

### Problem: "Memory leaks with many slides"
**Solution**: Worker processes sequentially, calls `stage.destroy()` after each

---

## Testing Strategy

### Unit Tests
- `stageBuilder.ts`: Test each function independently
- Verify correct Konva node creation
- Check gradient angle calculations

### Integration Tests
- Send PostContent to worker, verify blob output
- Compare worker output with editor rendering
- Test error handling (missing data, invalid types)

### Visual Regression Tests
- Capture screenshots of editor
- Generate slides with same data
- Compare pixel-by-pixel

---

## Future Enhancements

1. **Parallel processing**: Multiple workers for faster generation
2. **Image backgrounds**: Support for background.type === 'image'
3. **Custom fonts**: Load Google Fonts in worker context
4. **Video export**: Animate slides for video posts
5. **Caching**: Store generated slides, regenerate only on content change

---

## References

- **Konva Docs**: https://konvajs.org/docs/
- **OffscreenCanvas**: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- **Web Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
