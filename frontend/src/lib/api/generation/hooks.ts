// Provide minimal generation hooks used by legacy imports. Replace with real
// exports from feature folders when migrating.
export const useGenerateBrand = () => {
	return {
		mutateAsync: async (_: any) => {
			throw new Error('useGenerateBrand shim called');
		},
		isPending: false,
	};
};

export const useGeneratePostFromPrompt = () => {
	return {
		mutateAsync: async (_: any) => {
			// Return empty posts by default; real implementation should call backend
			return [] as any[];
		},
		isPending: false,
	};
};

