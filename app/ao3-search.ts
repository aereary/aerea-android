export const normalizeTag = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function matchesAllTags(tags: string[], selected: string[]) {
    const available = new Set(tags.map(normalizeTag));
    return selected.every(tag => available.has(normalizeTag(tag)));
}
export function suggestTags(works: {
    tags: string[];
}[], query: string, selected: string[]) {
    const needle = normalizeTag(query);
    if (!needle)
        return [];
    const picked = new Set(selected.map(normalizeTag));
    const counts = new Map<string, {
        tag: string;
        count: number;
    }>();
    for (const work of works) {
        if (!matchesAllTags(work.tags, selected))
            continue;
        for (const tag of new Set(work.tags)) {
            const key = normalizeTag(tag);
            if (picked.has(key) || !key.includes(needle))
                continue;
            const old = counts.get(key);
            counts.set(key, { tag: old?.tag || tag, count: (old?.count || 0) + 1 });
        }
    }
    return [...counts.values()].sort((a, b) => Number(normalizeTag(b.tag).startsWith(needle)) - Number(normalizeTag(a.tag).startsWith(needle)) || b.count - a.count || a.tag.localeCompare(b.tag)).slice(0, 10);
}
