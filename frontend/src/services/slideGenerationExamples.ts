/**
 * Example Usage of Slide Generation System
 * 
 * This file demonstrates how to use the slide generation system
 * to create posts from templates with AI-generated content.
 */

import { generateAndUploadSlides } from '@/services/slideGenerator';
import { createPost } from '@/lib/supabase/db/index';
import type { PostContent, PostSlide } from '@/types/post';
import type { Template } from '@/types/template';
import { contentApi } from '@/lib/api/client';
import { profile } from 'console';
import { BrandSettings } from '@/types/user';
import { UserProfile } from '@/types/user';

/**
 * Example 1: Generate a post from a template with AI content
 */
export async function createPostFromTemplate(
  template: Template,
  profile: UserProfile,
): Promise<string> {
  // 1. Extract template structure
  const { styleConfig } = template;
  const slideDesigns = styleConfig.slideDesigns || [];
  const slideSequence = styleConfig.slideSequence || [];


  const brandSettings = profile.brandSettings as BrandSettings;

  // T
  const posts = await contentApi.generatePosts(template, brandSettings, 1)
  

  // 2. Create PostSlides by filling template designs with AI content
  const postSlides: PostSlide[] = slideSequence.map((seq, index) => {
    const design = slideDesigns.find(d => d.id === seq.designId)!;
    
    return {
      id: `slide-${Date.now()}-${index}`,
      slideNumber: seq.slideNumber,
      designId: design.id,
      background: design.background,
      dynamic: design.dynamic,
      // Fill text elements with AI-generated content
      elements: design.elements.map(element => ({
        ...element,
        content: design.dynamic ? aiGeneratedText[index] : element.content,
      })),
    };
  });

  // 3. Create PostContent
  const postContent: PostContent = {
    slides: postSlides,
    layout: styleConfig.layout,
    caption: 'AI-generated caption here',
    hashtags: ['#example', '#ai'],
  };

  // 4. Create post in Firestore (without images yet)
  const postId = await createPost({
    templateId: template.id,
    platforms: ['instagram'],
    content: postContent,
    isDynamic: true,
  });

  // 5. Generate and upload slide images
  const imageUrls = await generateAndUploadSlides(
    postContent,
    postId,
    (progress) => {
      console.log(`Progress: ${progress.progress}%`);
    }
  );

  console.log('Post created with images:', imageUrls);
  return postId;
}

/**
 * Example 2: Preview a single slide before creating post
 */
export async function previewSlide(
  template: Template,
  slideIndex: number,
  previewText: string
): Promise<Blob> {
  const { styleConfig } = template;
  const slideDesigns = styleConfig.slideDesigns || [];
  const slideSequence = styleConfig.slideSequence || [];
  
  const seq = slideSequence[slideIndex];
  const design = slideDesigns.find(d => d.id === seq.designId)!;

  // Create preview slide
  const previewSlide: PostSlide = {
    id: `preview-${Date.now()}`,
    slideNumber: 0,
    designId: design.id,
    background: design.background,
    dynamic: design.dynamic,
    elements: design.elements.map(element => ({
      ...element,
      content: previewText,
    })),
  };

  const postContent: PostContent = {
    slides: [previewSlide],
    layout: styleConfig.layout,
    caption: '',
    hashtags: [],
  };

  const { generateSlideImages } = await import('@/services/slideGenerator');
  const results = await generateSlideImages(postContent);
  
  return results[0].blob;
}

/**
 * Example 3: Batch generate posts for A/B testing
 */
export async function generateVariantPosts(
  templates: Template[],
  aiContent: string[]
): Promise<string[]> {
  const postIds: string[] = [];

  for (const template of templates) {
    const postId = await createPostFromTemplate(template, aiContent);
    postIds.push(postId);
  }

  return postIds;
}
