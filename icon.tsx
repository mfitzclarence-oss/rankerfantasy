import { ImageResponse } from 'next/og';

// Generates /icon (favicon) at request time. Recolored to blue to match the
// up/down arrow glyph in the RANKERFANTASY wordmark used in the nav/footer
// (public/logo-wordmark.png) — no separate image asset to keep in sync.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#07090d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 3V21" stroke="#2f7cf6" strokeWidth="3" strokeLinecap="round" />
          <path d="M6.5 8.5L12 3L17.5 8.5" stroke="#2f7cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 15.5L12 21L17.5 15.5" stroke="#2f7cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
