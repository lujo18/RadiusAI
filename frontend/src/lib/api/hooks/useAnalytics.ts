export const useAnalytics = () => {
  return {
    data: null,
    isLoading: false,
    refetch: () => Promise.resolve(),
  };
};
