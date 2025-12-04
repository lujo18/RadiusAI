// Analytics CRUD Operations

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { 
  AnalyticsData,
  ABTestResult,
  PerformanceMetrics
} from '@/types/analytics';
import { requireUid } from '../auth';

/**
 * Get analytics for a specific post
 */
export async function getPostAnalytics(postId: string): Promise<AnalyticsData | null> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'analytics', postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        postId,
        ...data,
        lastUpdated: data.lastUpdated?.toDate() || null
      } as AnalyticsData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting post analytics:', error);
    throw error;
  }
}

/**
 * Update analytics data for a post
 */
export async function updatePostAnalytics(
  postId: string,
  metrics: Partial<PerformanceMetrics>
): Promise<void> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'analytics', postId);
    await updateDoc(docRef, {
      ...metrics,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating post analytics:', error);
    throw error;
  }
}

/**
 * Create initial analytics entry for a post
 */
export async function createPostAnalytics(postId: string): Promise<void> {
  try {
    const userId = requireUid();
    await addDoc(collection(db, 'users', userId, 'analytics'), {
      postId,
      platform: {},
      totalEngagement: 0,
      totalImpressions: 0,
      engagementRate: 0,
      saves: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating post analytics:', error);
    throw error;
  }
}

/**
 * Get aggregated analytics for a user
 */
export async function getUserAnalytics(userId: string): Promise<AnalyticsData[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'analytics'),
      orderBy('lastUpdated', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const analytics: AnalyticsData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      analytics.push({
        postId: data.postId,
        ...data,
        lastUpdated: data.lastUpdated?.toDate() || null
      } as AnalyticsData);
    });
    
    return analytics;
  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw error;
  }
}

/**
 * Get top performing posts
 */
export async function getTopPerformingPosts(
  userId: string,
  limitCount: number = 10
): Promise<AnalyticsData[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'analytics'),
      orderBy('totalEngagement', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const analytics: AnalyticsData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      analytics.push({
        postId: data.postId,
        ...data,
        lastUpdated: data.lastUpdated?.toDate() || null
      } as AnalyticsData);
    });
    
    return analytics;
  } catch (error) {
    console.error('Error getting top performing posts:', error);
    throw error;
  }
}

/**
 * Create an A/B test
 */
export async function createABTest(
  variantA: string,
  variantB: string,
  testName: string
): Promise<string> {
  try {
    const userId = requireUid();
    const testData = {
      testName,
      variantA: {
        postId: variantA,
        impressions: 0,
        engagement: 0,
        conversions: 0
      },
      variantB: {
        postId: variantB,
        impressions: 0,
        engagement: 0,
        conversions: 0
      },
      status: 'active',
      winner: null,
      confidence: 0,
      startedAt: serverTimestamp(),
      endedAt: null
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'ab_tests'), testData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating A/B test:', error);
    throw error;
  }
}

/**
 * Get A/B test results
 */
export async function getABTest(testId: string): Promise<ABTestResult | null> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'ab_tests', testId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startedAt: data.startedAt?.toDate(),
        endedAt: data.endedAt?.toDate() || null
      } as ABTestResult;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting A/B test:', error);
    throw error;
  }
}

/**
 * Get all A/B tests for a user
 */
export async function getUserABTests(userId: string): Promise<ABTestResult[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'ab_tests'),
      orderBy('startedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tests: ABTestResult[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tests.push({
        id: doc.id,
        ...data,
        startedAt: data.startedAt?.toDate(),
        endedAt: data.endedAt?.toDate() || null
      } as ABTestResult);
    });
    
    return tests;
  } catch (error) {
    console.error('Error getting user A/B tests:', error);
    throw error;
  }
}

/**
 * Update A/B test metrics
 */
export async function updateABTestMetrics(
  testId: string,
  variant: 'A' | 'B',
  metrics: { impressions?: number; engagement?: number; conversions?: number }
): Promise<void> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'ab_tests', testId);
    const variantField = variant === 'A' ? 'variantA' : 'variantB';
    
    const test = await getABTest(testId);
    if (!test) throw new Error('Test not found');
    
    const currentVariant = variant === 'A' ? test.variantA : test.variantB;
    
    await updateDoc(docRef, {
      [variantField]: {
        ...currentVariant,
        ...metrics
      }
    });
  } catch (error) {
    console.error('Error updating A/B test metrics:', error);
    throw error;
  }
}

/**
 * End an A/B test and declare a winner
 */
export async function endABTest(
  testId: string,
  winner: 'A' | 'B',
  confidence: number
): Promise<void> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'ab_tests', testId);
    await updateDoc(docRef, {
      status: 'completed',
      winner,
      confidence,
      endedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error ending A/B test:', error);
    throw error;
  }
}

/**
 * Get analytics for a specific template (aggregated from all posts)
 */
export async function getTemplateAnalytics(templateId: string): Promise<PerformanceMetrics> {
  try {
    // This would require a query to get all posts with this templateId
    // and aggregate their analytics. For now, returning a placeholder.
    // Backend would typically handle this aggregation.
    
    return {
      totalEngagement: 0,
      totalImpressions: 0,
      engagementRate: 0,
      saves: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      lastUpdated: null
    };
  } catch (error) {
    console.error('Error getting template analytics:', error);
    throw error;
  }
}
