import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Maracita — Smart Appointment Operations',
    short_name: 'Maracita',
    description: 'One clear workspace for service-business operations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c1930',
    theme_color: '#77dfce',
  };
}
