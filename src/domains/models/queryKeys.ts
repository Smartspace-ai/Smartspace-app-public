export const modelsKeys = {
	all: ['models'] as const,

	lists: () => [...modelsKeys.all, 'list'] as const,
	list: (opts?: { search?: string; take?: number; skip?: number }) =>
		[
			...modelsKeys.lists(),
			{ search: opts?.search ?? undefined, take: opts?.take ?? undefined, skip: opts?.skip ?? undefined },
		] as const,

	details: () => [...modelsKeys.all, 'detail'] as const,
	detail: (modelId: string) => [...modelsKeys.details(), { modelId }] as const,
};
