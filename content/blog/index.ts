export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'dog-park-etiquette',
    title: 'Dog Park Etiquette: Do\'s and Don\'ts for Every Visit',
    description:
      'Essential rules for visiting the dog park. Learn how to keep your dog safe, read body language, and be a good park neighbor.',
    date: '2026-02-10',
    author: 'k9d8 Team',
  },
  {
    slug: 'find-dog-playdates',
    title: 'How to Find Dog Playdates in Your Neighborhood',
    description:
      'Tips for finding compatible playmates for your dog. From dog parks to apps, build your pup\'s social circle.',
    date: '2026-02-03',
    author: 'k9d8 Team',
  },
];
