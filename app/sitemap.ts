import type { MetadataRoute } from 'next';

const siteUrl = 'https://maracita.awadi-mar34.workers.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/demo`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];
}
