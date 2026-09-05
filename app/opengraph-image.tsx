import { ImageResponse } from 'next/og';
import { siteConfig, pricing, EXAM_YEAR } from '@/config/site';

/**
 * The social preview card, generated at build time rather than shipped as a
 * binary. `siteConfig.ogImage` previously pointed at `/og.png`, which did not
 * exist — so every share of this site rendered as a bare grey box, and the
 * `summary_large_image` Twitter card had no image to enlarge.
 *
 * Two constraints come from Satori, the renderer behind ImageResponse:
 *   • every element with more than one child needs an explicit `display`, and
 *   • glyphs outside the bundled Latin subset (the rupee sign among them) are
 *     fetched from Google Fonts at build time and fail the build when that
 *     request does. Hence "Rs" rather than `pricing.amountLabel` here.
 */
export const alt = `${siteConfig.brand} — NEET PG ${EXAM_YEAR} rank and college predictor`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const rupeesFromPaise = (paise: number) => `Rs ${Math.round(paise / 100)}`;

export default function OpenGraphImage() {
  const pill = {
    display: 'flex',
    background: '#e8f1ef',
    padding: '10px 20px',
    borderRadius: 999,
    color: '#0b544e',
    fontSize: 22,
  } as const;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#faf9f6',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 46,
              height: 46,
              marginRight: 16,
              borderRadius: 10,
              background: '#0b544e',
              color: '#ffffff',
              fontSize: 21,
              fontWeight: 700,
            }}
          >
            PG
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#15191a' }}>{siteConfig.brand}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 66, color: '#15191a', letterSpacing: '-0.03em' }}>
            Know your NEET PG
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 66,
              color: '#15191a',
              letterSpacing: '-0.03em',
              marginTop: 6,
            }}
          >
            possibilities in 60 seconds
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 27,
              color: '#4e5654',
              lineHeight: 1.4,
              marginTop: 26,
              maxWidth: 900,
            }}
          >
            {`Rank estimate, college shortlist, AIQ and state quota for NEET PG ${EXAM_YEAR} — from the score you already have in your head.`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={pill}>Free rank estimate</div>
          <div style={{ ...pill, marginLeft: 14 }}>
            {`Full report from ${rupeesFromPaise(pricing.amountInPaise)}`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
