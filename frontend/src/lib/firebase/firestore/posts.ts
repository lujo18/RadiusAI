// Post CRUD Operations

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
  Post, 
  CreatePostInput, 
  UpdatePostInput,
  PostStatus
} from '@/types/post';
import { requireUid } from '../auth';

/**
 * Create a new post
 */
export async function createPost(input: CreatePostInput): Promise<string> {
  try {
    const userId = requireUid();
    const postData = {
      templateId: input.templateId,
      content: input.content,
      platforms: input.platforms,
      scheduledFor: input.scheduledFor ? Timestamp.fromDate(input.scheduledFor) : null,
      status: input.scheduledFor ? ('scheduled' as PostStatus) : ('draft' as PostStatus),
      isDynamic: input.isDynamic || false,
      slides: input.slides || [],
      performance: {
        platform: {},
        totalEngagement: 0,
        totalImpressions: 0,
        lastUpdated: null
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'posts'), postData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

/**
 * Get a single post by ID
 */
export async function getPost(postId: string): Promise<Post | null> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'posts', postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        scheduledFor: data.scheduledFor?.toDate() || null,
        publishedAt: data.publishedAt?.toDate() || null,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        performance: {
          ...data.performance,
          lastUpdated: data.performance.lastUpdated?.toDate() || null
        }
      } as Post;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
}

/**
 * Get all posts for a user
 */
export async function getUserPosts(userId: string): Promise<Post[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'posts'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        scheduledFor: data.scheduledFor?.toDate() || null,
        publishedAt: data.publishedAt?.toDate() || null,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        performance: {
          ...data.performance,
          lastUpdated: data.performance.lastUpdated?.toDate() || null
        }
      } as Post);
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
}

/**
 * Get posts by status
 */
export async function getPostsByStatus(
  userId: string, 
  status: PostStatus
): Promise<Post[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'posts'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        scheduledFor: data.scheduledFor?.toDate() || null,
        publishedAt: data.publishedAt?.toDate() || null,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        performance: {
          ...data.performance,
          lastUpdated: data.performance.lastUpdated?.toDate() || null
        }
      } as Post);
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting posts by status:', error);
    throw error;
  }
}

/**
 * Get scheduled posts
 */
export async function getScheduledPosts(userId: string): Promise<Post[]> {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'users', userId, 'posts'),
      where('status', '==', 'scheduled'),
      where('scheduledFor', '>', now),
      orderBy('scheduledFor', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        scheduledFor: data.scheduledFor?.toDate() || null,
        publishedAt: data.publishedAt?.toDate() || null,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        performance: {
          ...data.performance,
          lastUpdated: data.performance.lastUpdated?.toDate() || null
        }
      } as Post);
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting scheduled posts:', error);
    throw error;
  }
}

/**
 * Get recent posts
 */
export async function getRecentPosts(
  userId: string, 
  limitCount: number = 10
): Promise<Post[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        scheduledFor: data.scheduledFor?.toDate() || null,
        publishedAt: data.publishedAt?.toDate() || null,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        performance: {
          ...data.performance,
          lastUpdated: data.performance.lastUpdated?.toDate() || null
        }
      } as Post);
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting recent posts:', error);
    throw error;
  }
}

/**
 * Update a post
 */
export async function updatePost(
  postId: string, 
  updates: UpdatePostInput
): Promise<void> {
  try {
    const userId = requireUid();
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    // Convert scheduledFor to Timestamp if provided
    if (updates.scheduledFor) {
      updateData.scheduledFor = Timestamp.fromDate(updates.scheduledFor);
    }
    
    const docRef = doc(db, 'users', userId, 'posts', postId);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

/**
 * Delete a post
 */
export async function deletePost(postId: string): Promise<void> {
  try {
    await updatePost(postId, { status: 'deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

/**
 * Publish a post (update status to published)
 */
export async function publishPost(postId: string): Promise<void> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'posts', postId);
    await updateDoc(docRef, {
      status: 'published',
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    throw error;
  }
}

/**
 * Mark a post as failed
 */
export async function markPostFailed(
  postId: string, 
  errorMessage: string
): Promise<void> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'posts', postId);
    await updateDoc(docRef, {
      status: 'failed',
      error: errorMessage,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking post as failed:', error);
    throw error;
  }
}

/**
 * Get posts by template
 */
export async function getPostsByTemplate(templateId: string): Promise<Post[]> {
  try {
    const userId = requireUid();
    const q = query(
      collection(db, 'users', userId, 'posts'),
      where('templateId', '==', templateId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        scheduledFor: data.scheduledFor?.toDate() || null,
        publishedAt: data.publishedAt?.toDate() || null,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        performance: {
          ...data.performance,
          lastUpdated: data.performance.lastUpdated?.toDate() || null
        }
      } as Post);
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting posts by template:', error);
    throw error;
  }
}
