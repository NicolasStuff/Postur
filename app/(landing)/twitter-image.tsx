import { ImageResponse } from 'next/og'

export const alt = 'Postur - Logiciel Ostéopathe avec Body Chart et préparation Factur-X'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'white',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#4F46E5',
            }}
          >
            P
          </div>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-2px',
            }}
          >
            POSTUR
          </span>
        </div>

        {/* Main Text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1.2,
              margin: 0,
              marginBottom: '20px',
              maxWidth: '900px',
            }}
          >
            Logiciel de Gestion de Cabinet pour Ostéopathes
          </h1>
          <p
            style={{
              fontSize: '28px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              maxWidth: '800px',
            }}
          >
            Body Chart interactif • Préparation Factur-X • Réservation en ligne
          </p>
        </div>

        {/* CTA Badge */}
        <div
          style={{
            marginTop: '40px',
            background: 'white',
            padding: '16px 32px',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#4F46E5',
            }}
          >
            Essai gratuit 14 jours
          </span>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          postur.fr
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
