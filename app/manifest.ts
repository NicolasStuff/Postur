import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Postur - Logiciel Ostéopathe',
    short_name: 'Postur',
    description: 'Logiciel de gestion de cabinet pour ostéopathes avec Body Chart interactif et Facture-X',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4F46E5',
    orientation: 'portrait-primary',
    categories: ['medical', 'business', 'productivity'],
    icons: [
      {
        src: '/images/logo/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
