// home-promo:v1.0 legacy=true
import React from 'react';

// group { Content }
const promoImage = $(promoImage:Image="");
const title = $(title:RichText={ text: "Timeless Elegance, Handcrafted for You" });
const subtitle = $(subtitle:RichText={ text: "A considered edit for the moments that matter." });
// endgroup

// group { CTA }
const showCta = $(showCta:Boolean=true);
const ctaLabel = $(ctaLabel:RichText={ text: "Explore the Edit" });
const ctaHref = $(ctaHref:String="/collections/all");
// endgroup

// group { Styling }
const accentColor = $(accentColor:Color="#C9A25D");
const fallbackColor = $(fallbackColor:Color="#D8B8A0");
// endgroup

const HomePromo = () => {
  const imageUrl = typeof promoImage === 'string' ? promoImage : promoImage?.url || '';
  const imageAlt = (typeof promoImage === 'object' ? promoImage?.alt : '') || title?.text || 'Singhar by Sidra festive collection';
  const fallback = fallbackColor || '#D8B8A0';
  const fallbackBackground = `repeating-linear-gradient(150deg, ${fallback} 0px, ${fallback} 24px, #8A6A50 24px, #8A6A50 48px)`;

  return (
    <a
      href={ctaHref || '/collections/all'}
      aria-label={title?.text || 'Explore the edit'}
      style={{
        position: 'relative',
        display: 'flex',
        minHeight: 'clamp(260px, 30vw, 420px)',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: fallback,
        backgroundImage: imageUrl ? 'none' : fallbackBackground,
        color: '#FFFFF5',
        textDecoration: 'none',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={imageAlt}
          decoding="async"
          loading="lazy"
          sizes="100vw"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      ) : null}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26,26,26,.32)',
        }}
      />
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          maxWidth: 720,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <strong
          style={{
            color: '#FFFFF5',
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(28px, 4vw, 38px)',
            fontWeight: 400,
            lineHeight: 1.2,
          }}
        >
          {title?.text || 'Timeless Elegance, Handcrafted for You'}
        </strong>
        {subtitle?.text ? (
          <span
            style={{
              maxWidth: 480,
              color: 'rgba(255,255,245,.88)',
              fontFamily: 'Inter, Arial, sans-serif',
              fontSize: 'clamp(13px, 1.5vw, 15px)',
              lineHeight: 1.5,
            }}
          >
            {subtitle.text}
          </span>
        ) : null}
        {showCta ? (
          <span
            style={{
              display: 'inline-flex',
              minHeight: 34,
              alignItems: 'center',
              borderBottom: `1px solid ${accentColor || '#C9A25D'}`,
              color: '#FFFFF5',
              fontFamily: 'Inter, Arial, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.7px',
              lineHeight: 1.2,
              textTransform: 'uppercase',
            }}
          >
            {ctaLabel?.text || 'Explore the Edit'}
          </span>
        ) : null}
      </span>
    </a>
  );
};

export default HomePromo;
