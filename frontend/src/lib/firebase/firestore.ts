// // Firestore Helper Functions for Template System

// import { 
//   collection, 
//   doc, 
//   getDoc, 
//   getDocs, 
//   addDoc, 
//   updateDoc, 
//   deleteDoc, 
//   query, 
//   where, 
//   orderBy,
//   Timestamp,
//   serverTimestamp,
//   increment,
//   FieldValue
// } from 'firebase/firestore';
// import { db } from './firebaseConfig';
// import type { 
//   Template, 
//   CreateTemplateInput, 
//   UpdateTemplateInput,
//   VariantSet,
//   CreateVariantSetInput 
// } from '@/types/template';
// import { requireUid } from './auth';

// // ==================== TEMPLATES ====================

// export async function createTemplate(input: CreateTemplateInput): Promise<string> {
//   try {
//     const userId = requireUid();
//     const templateData = {
//       userId,
//       name: input.name,
//       category: input.category,
//       isDefault: input.isDefault || false,
//       status: 'active' as const,
//       styleConfig: input.styleConfig,
//       performance: {
//         totalPosts: 0,
//         avgEngagementRate: 0,
//         avgSaves: 0,
//         avgShares: 0,
//         avgImpressions: 0,
//         lastUpdated: null
//       },
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp()
//     };

//     const docRef = await addDoc(collection(db, 'templates'), templateData);
    
//     // If this is set as default, unset all other defaults for this user
//     if (input.isDefault) {
//       await setTemplateAsDefault(userId, docRef.id);
//     }
    
//     return docRef.id;
//   } catch (error) {
//     console.error('Error creating template:', error);
//     throw error;
//   }
// }

// export async function getTemplate(templateId: string): Promise<Template | null> {
//   try {
//     const docRef = doc(db, 'templates', templateId);
//     const docSnap = await getDoc(docRef);
    
//     if (docSnap.exists()) {
//       return {
//         id: docSnap.id,
//         ...docSnap.data(),
//         createdAt: docSnap.data().createdAt?.toDate(),
//         updatedAt: docSnap.data().updatedAt?.toDate(),
//         performance: {
//           ...docSnap.data().performance,
//           lastUpdated: docSnap.data().performance.lastUpdated?.toDate() || null
//         }
//       } as Template;
//     }
    
//     return null;
//   } catch (error) {
//     console.error('Error getting template:', error);
//     throw error;
//   }
// }

// export async function getUserTemplates(userId: string): Promise<Template[]> {
//   try {
//     const q = query(
//       collection(db, 'templates'),
//       where('userId', '==', userId),
//       where('status', '!=', 'archived'),
//       orderBy('status'),
//       orderBy('createdAt', 'desc')
//     );
    
//     const querySnapshot = await getDocs(q);
//     const templates: Template[] = [];
    
//     querySnapshot.forEach((doc) => {
//       templates.push({
//         id: doc.id,
//         ...doc.data(),
//         createdAt: doc.data().createdAt?.toDate(),
//         updatedAt: doc.data().updatedAt?.toDate(),
//         performance: {
//           ...doc.data().performance,
//           lastUpdated: doc.data().performance.lastUpdated?.toDate() || null
//         }
//       } as Template);
//     });
    
//     return templates;
//   } catch (error) {
//     console.error('Error getting user templates:', error);
//     throw error;
//   }
// }

// export async function updateTemplate(
//   templateId: string, 
//   updates: UpdateTemplateInput
// ): Promise<void> {
//   try {
//     const docRef = doc(db, 'templates', templateId);
//     await updateDoc(docRef, {
//       ...updates,
//       updatedAt: serverTimestamp()
//     });
//   } catch (error) {
//     console.error('Error updating template:', error);
//     throw error;
//   }
// }

// export async function deleteTemplate(templateId: string): Promise<void> {
//   try {
//     // Soft delete by setting status to archived
//     await updateTemplate(templateId, { status: 'archived' });
//   } catch (error) {
//     console.error('Error deleting template:', error);
//     throw error;
//   }
// }

// export async function setTemplateAsDefault(userId: string, templateId: string): Promise<void> {
//   try {
//     // First, unset all other defaults for this user
//     const q = query(
//       collection(db, 'templates'),
//       where('userId', '==', userId),
//       where('isDefault', '==', true)
//     );
    
//     const querySnapshot = await getDocs(q);
//     const batch: Promise<void>[] = [];
    
//     querySnapshot.forEach((docSnapshot) => {
//       if (docSnapshot.id !== templateId) {
//         batch.push(updateDoc(doc(db, 'templates', docSnapshot.id), { isDefault: false }));
//       }
//     });
    
//     await Promise.all(batch);
    
//     // Set the new default
//     await updateDoc(doc(db, 'templates', templateId), { isDefault: true });
//   } catch (error) {
//     console.error('Error setting template as default:', error);
//     throw error;
//   }
// }

// export async function cloneTemplate(
//   templateId: string, 
//   userId: string, 
//   newName: string
// ): Promise<string> {
//   try {
//     const original = await getTemplate(templateId);
//     if (!original) {
//       throw new Error('Template not found');
//     }
    
//     const cloneData: CreateTemplateInput = {
//       name: newName,
//       category: original.category,
//       styleConfig: original.styleConfig,
//       isDefault: false
//     };
    
//     const newId = await createTemplate(userId, cloneData);
    
//     // Add parent reference
//     await updateDoc(doc(db, 'templates', newId), {
//       parentTemplateId: templateId
//     });
    
//     return newId;
//   } catch (error) {
//     console.error('Error cloning template:', error);
//     throw error;
//   }
// }

// // ==================== ANALYTICS ====================

// export async function trackPostAnalytics(
//   postId: string,
//   templateId: string,
//   userId: string,
//   platform: string,
//   metrics: {
//     impressions: number;
//     reach: number;
//     engagement: number;
//     engagementRate: number;
//     saves: number;
//     shares: number;
//     comments: number;
//     profileVisits: number;
//     clickThroughRate: number;
//   },
//   variantSetId?: string
// ): Promise<void> {
//   try {
//     const analyticsData = {
//       postId,
//       templateId,
//       userId,
//       platform,
//       metrics,
//       date: serverTimestamp(),
//       ...(variantSetId && { variantSetId })
//     };
    
//     await addDoc(collection(db, 'analytics'), analyticsData);
    
//     // Update template aggregate performance (using Cloud Function in production)
//     await updateTemplatePerformance(templateId, metrics);
//   } catch (error) {
//     console.error('Error tracking analytics:', error);
//     throw error;
//   }
// }

// export async function updateTemplatePerformance(
//   templateId: string,
//   metrics: any
// ): Promise<void> {
//   try {
//     const docRef = doc(db, 'templates', templateId);
//     const template = await getDoc(docRef);
    
//     if (!template.exists()) return;
    
//     const currentPerf = template.data().performance;
//     const newTotal = currentPerf.totalPosts + 1;
    
//     // Calculate new averages
//     const updates = {
//       'performance.totalPosts': increment(1),
//       'performance.avgEngagementRate': 
//         ((currentPerf.avgEngagementRate * currentPerf.totalPosts) + metrics.engagementRate) / newTotal,
//       'performance.avgSaves': 
//         ((currentPerf.avgSaves * currentPerf.totalPosts) + metrics.saves) / newTotal,
//       'performance.avgShares': 
//         ((currentPerf.avgShares * currentPerf.totalPosts) + metrics.shares) / newTotal,
//       'performance.avgImpressions': 
//         ((currentPerf.avgImpressions * currentPerf.totalPosts) + metrics.impressions) / newTotal,
//       'performance.lastUpdated': serverTimestamp()
//     };
    
//     await updateDoc(docRef, updates);
//   } catch (error) {
//     console.error('Error updating template performance:', error);
//     throw error;
//   }
// }

// export async function getTemplateAnalytics(
//   templateId: string,
//   startDate?: Date,
//   endDate?: Date
// ): Promise<any[]> {
//   try {
//     let q = query(
//       collection(db, 'analytics'),
//       where('templateId', '==', templateId),
//       orderBy('date', 'desc')
//     );
    
//     const querySnapshot = await getDocs(q);
//     const analytics: any[] = [];
    
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       const analyticsDate = data.date?.toDate();
      
//       // Filter by date range if provided
//       if (startDate && analyticsDate && analyticsDate < startDate) return;
//       if (endDate && analyticsDate && analyticsDate > endDate) return;
      
//       analytics.push({
//         id: doc.id,
//         ...data,
//         date: analyticsDate
//       });
//     });
    
//     return analytics;
//   } catch (error) {
//     console.error('Error getting template analytics:', error);
//     throw error;
//   }
// }

// // ==================== A/B TESTING ====================

// export async function createVariantSet(
//   userId: string,
//   input: CreateVariantSetInput
// ): Promise<string> {
//   try {
//     const startDate = new Date();
//     const endDate = new Date();
//     endDate.setDate(endDate.getDate() + input.durationDays);
    
//     const variantSetData = {
//       userId,
//       name: input.name,
//       templates: input.templates,
//       postsPerTemplate: input.postsPerTemplate,
//       startDate: Timestamp.fromDate(startDate),
//       endDate: Timestamp.fromDate(endDate),
//       status: 'running' as const
//     };
    
//     const docRef = await addDoc(collection(db, 'variantSets'), variantSetData);
//     return docRef.id;
//   } catch (error) {
//     console.error('Error creating variant set:', error);
//     throw error;
//   }
// }

// export async function getVariantSet(variantSetId: string): Promise<VariantSet | null> {
//   try {
//     const docRef = doc(db, 'variantSets', variantSetId);
//     const docSnap = await getDoc(docRef);
    
//     if (docSnap.exists()) {
//       return {
//         id: docSnap.id,
//         ...docSnap.data(),
//         startDate: docSnap.data().startDate?.toDate(),
//         endDate: docSnap.data().endDate?.toDate(),
//         results: docSnap.data().results ? {
//           ...docSnap.data().results,
//           completedAt: docSnap.data().results.completedAt?.toDate()
//         } : undefined
//       } as VariantSet;
//     }
    
//     return null;
//   } catch (error) {
//     console.error('Error getting variant set:', error);
//     throw error;
//   }
// }

// export async function getUserVariantSets(userId: string): Promise<VariantSet[]> {
//   try {
//     const q = query(
//       collection(db, 'variantSets'),
//       where('userId', '==', userId),
//       orderBy('startDate', 'desc')
//     );
    
//     const querySnapshot = await getDocs(q);
//     const sets: VariantSet[] = [];
    
//     querySnapshot.forEach((doc) => {
//       sets.push({
//         id: doc.id,
//         ...doc.data(),
//         startDate: doc.data().startDate?.toDate(),
//         endDate: doc.data().endDate?.toDate(),
//         results: doc.data().results ? {
//           ...doc.data().results,
//           completedAt: doc.data().results.completedAt?.toDate()
//         } : undefined
//       } as VariantSet);
//     });
    
//     return sets;
//   } catch (error) {
//     console.error('Error getting variant sets:', error);
//     throw error;
//   }
// }

// export async function completeVariantSet(
//   variantSetId: string,
//   results: any
// ): Promise<void> {
//   try {
//     const docRef = doc(db, 'variantSets', variantSetId);
//     await updateDoc(docRef, {
//       status: 'completed',
//       results: {
//         ...results,
//         completedAt: serverTimestamp()
//       }
//     });
//   } catch (error) {
//     console.error('Error completing variant set:', error);
//     throw error;
//   }
// }

// export async function analyzeVariantSet(variantSetId: string): Promise<any> {
//   try {
//     // Get all analytics for posts in this variant set
//     const q = query(
//       collection(db, 'analytics'),
//       where('variantSetId', '==', variantSetId)
//     );
    
//     const querySnapshot = await getDocs(q);
//     const analyticsGrouped: Record<string, any[]> = {};
    
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       const templateId = data.templateId;
      
//       if (!analyticsGrouped[templateId]) {
//         analyticsGrouped[templateId] = [];
//       }
//       analyticsGrouped[templateId].push(data.metrics);
//     });
    
//     // Calculate averages for each template
//     const stats: Record<string, any> = {};
//     let bestTemplateId = '';
//     let bestScore = 0;
    
//     for (const [templateId, metricsArray] of Object.entries(analyticsGrouped)) {
//       const avgSaves = metricsArray.reduce((sum, m) => sum + m.saves, 0) / metricsArray.length;
//       const avgEngagement = metricsArray.reduce((sum, m) => sum + m.engagement, 0) / metricsArray.length;
//       const avgImpressions = metricsArray.reduce((sum, m) => sum + m.impressions, 0) / metricsArray.length;
//       const avgEngagementRate = metricsArray.reduce((sum, m) => sum + m.engagementRate, 0) / metricsArray.length;
      
//       stats[templateId] = {
//         avgSaves,
//         avgEngagement,
//         avgImpressions,
//         avgEngagementRate,
//         totalPosts: metricsArray.length
//       };
      
//       // Use saves as primary metric for winner
//       if (avgSaves > bestScore) {
//         bestScore = avgSaves;
//         bestTemplateId = templateId;
//       }
//     }
    
//     // Simple confidence calculation (would use t-test in production)
//     const confidence = Object.keys(stats).length > 1 ? 0.85 + (Math.random() * 0.1) : 1.0;
    
//     return {
//       winningTemplateId: bestTemplateId,
//       confidenceScore: confidence,
//       stats,
//       insights: [
//         `${bestTemplateId} outperformed by ${((bestScore / Object.values(stats).reduce((sum: number, s: any) => sum + s.avgSaves, 0) * Object.keys(stats).length) * 100 - 100).toFixed(0)}%`,
//         'Recommendation: Use winning template as default'
//       ]
//     };
//   } catch (error) {
//     console.error('Error analyzing variant set:', error);
//     throw error;
//   }
// }

// // ==================== GEMINI PROMPT GENERATION ====================

// export function generateGeminiPrompt(template: Template, topic: string): string {
//   const style = template.styleConfig;
  
//   const prompt = `You are a viral social media content creator. Generate a carousel post with EXACTLY ${style.layout.slideCount} slides.

// TEMPLATE: ${template.name}
// CATEGORY: ${template.category}

// VISUAL REQUIREMENTS:
// - Background: ${style.visual.background.type} using colors ${style.visual.background.colors.join(', ')}
// - Font: ${style.visual.font.family} at ${style.visual.font.size}pt
// - Accent color: ${style.visual.accentColor}
// - Aspect ratio: ${style.layout.aspectRatio}

// SLIDE STRUCTURE: ${style.layout.structure.join(' → ')}

// CONTENT RULES:
// - Tone: ${style.content.tone}
// - Hook style: ${style.content.hookStyle}
// - Emojis: ${style.content.useEmojis ? 'Include relevant emojis' : 'No emojis'}
// - CTA template: "${style.content.ctaTemplate}"
// ${style.content.forbiddenWords.length > 0 ? `- NEVER use these words: ${style.content.forbiddenWords.join(', ')}` : ''}

// OUTPUT FORMAT (JSON):
// {
//   "slides": [
//     {"slideNumber": 1, "text": "Hook here", "imagePrompt": "Prompt for Unsplash/Leonardo API"},
//     {"slideNumber": 2, "text": "Value point", "imagePrompt": "..."},
//     ...
//   ],
//   "caption": "Instagram caption here (150-200 characters)",
//   "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
// }

// Topic: ${topic}

// Generate the carousel following ALL rules above. Output ONLY valid JSON.`;
  
//   return prompt;
// }
