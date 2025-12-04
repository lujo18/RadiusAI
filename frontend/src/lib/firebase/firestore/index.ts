// Main exports for all Firestore operations

// Profiles
export {
  createProfile,
  getUserProfiles,
  getProfile,
  updateProfile,
  updateBrandSettings,
  deleteProfile,
  addIntegration,
  removeIntegration
} from './profiles';

// Templates
export {
  createTemplate,
  getTemplate,
  getUserTemplates,
  updateTemplate,
  deleteTemplate,
  setTemplateAsDefault,
  cloneTemplate
} from './templates';

// Posts
export {
  createPost,
  getPost,
  getUserPosts,
  getPostsByStatus,
  getScheduledPosts,
  getRecentPosts,
  updatePost,
  deletePost,
  publishPost,
  markPostFailed,
  getPostsByTemplate
} from './posts';

// Storage
export {
  uploadSlideImage,
  uploadSlideImages,
  deleteSlideImage,
  deleteTemplateSlideImages,
  uploadProfileImage,
  uploadBrandLogo,
  deleteImage,
  getTemplateSlideImages
} from './storage';

// Analytics
export {
  getPostAnalytics,
  updatePostAnalytics,
  createPostAnalytics,
  getUserAnalytics,
  getTopPerformingPosts,
  createABTest,
  getABTest,
  getUserABTests,
  updateABTestMetrics,
  endABTest,
  getTemplateAnalytics
} from './analytics';
