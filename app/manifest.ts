import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Maracita — Smart Appointment Operations',
    short_name: 'Maracita',
    description: 'One clear workspace for service-business operations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b0f',
    theme_color: '#c9f66b',
  };
}
