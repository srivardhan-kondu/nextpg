import { ImageResponse } from 'next/og';
import { siteConfig, EXAM_YEAR } from '@/config/site';
import { GUIDE_UPDATED, formatLong } from '@/lib/content/counselling';

/**
 * Share card for the counselling guide — this is the link that gets passed
 * around candidate WhatsApp and Telegram groups, so it should say what the page
 * is rather than repeat the homepage card. Same Satori constraints as the root
 * card: explicit `display` on every multi-child element, and no rupee sign.
 *
 * A plain route rather than an `opengraph-image` file: inside the (marketing)
 * route group, Next appends a build hash to that file's URL, and the page's
 * Twitter card and Article markup need a URL that never changes. Served at
 * /og/neet-pg-counselling and rendered once per build.
 */
export const dynamic = 'force-static';

const size = { width: 1200, height: 630 };

export function GET() {
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
          <div style={{ display: 'flex', fontSize: 70, color: '#15191a', letterSpacing: '-0.03em' }}>
            {`NEET PG Counselling ${EXAM_YEAR}`}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              color: '#4e5654',
              lineHeight: 1.4,
              marginTop: 22,
              maxWidth: 960,
            }}
          >
            MCC round-wise dates, fees and security deposit, free exit rules, documents and state
            counselling portals.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={pill}>4 MCC rounds</div>
          <div style={{ ...pill, marginLeft: 14 }}>{`Updated ${formatLong(GUIDE_UPDATED)}`}</div>
        </div>
      </div>
    ),
    size,
  );
}
