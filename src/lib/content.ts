import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'writing'>;

export async function getPosts(kind?: Post['data']['kind']): Promise<Post[]> {
  const posts = await getCollection(
    'writing',
    ({ data }) => (import.meta.env.DEV || !data.draft) && (!kind || data.kind === kind),
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function plural(n: number, word: string): string {
  return `${n === 0 ? 'No' : n} ${word}${n === 1 ? '' : 's'}`;
}
