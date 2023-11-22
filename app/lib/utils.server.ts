declare global {
	var singletons: Map<any, any>;
}

export function singleton<T>(key: string, value: () => T | Promise<T>) {
	const t = globalThis;
	t.singletons ??= new Map();
	if (!t.singletons.has(key)) {
		t.singletons.set(key, value());
	}
	return t.singletons.get(key) as T;
}
