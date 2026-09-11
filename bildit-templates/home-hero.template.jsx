// home-hero:v1.0 legacy=true
import React from 'react';

// group { Content }
const heroImage = $(heroImage:Image="");
const eyebrow = $(eyebrow:RichText={ text: "The new season" });
const headline = $(headline:RichText={ text: "Latest Collection" });
const copy = $(copy:RichText={ text: "Handcrafted eastern wear for the modern woman - timeless silhouettes, festive-ready detail, made to be worn for years to come." });
// endgroup

// group { CTA }
const showCta = $(showCta:Boolean=true);
const ctaLabel = $(ctaLabel:RichText={ text: "Shop New Arrivals" });
const ctaHref = $(ctaHref:String="/collections/new-arrivals");
// endgroup

// group { Styling }
const accentColor = $(accentColor:Color="#C9A25D");
const textColor = $(textColor:Color="#1A1A1A");
const fallbackColor = $(fallbackColor:Color="#E8DCC8");
// endgroup

const HomeHero = () => {
  const imageUrl = typeof heroImage === 'string' ? heroImage : heroImage?.url || '';
  const imageAlt = (typeof heroImage === 'object' ? heroImage?.alt : '') || headline?.text || 'Singhar by Sidra latest collection';
  const fallback = fallbackColor || '#E8DCC8';
  const fallbackBackground = `repeating-linear-gradient(160deg, ${fallback} 0px, ${fallback} 26px, #D8B8A0 26px, #D8B8A0 52px)`;

  return (
    <section
      aria-label={headline?.text || 'Latest Collection'}
      style={{
        position: 'relative',
        minHeight: 'clamp(480px, 50vw, 640px)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: fallback,
        backgroundImage: imageUrl ? 'none' : fallbackBackground,
        color: textColor,
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={imageAlt}
          decoding="async"
          loading="eager"
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
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(255,255,245,.92) 0%, rgba(255,255,245,.62) 42%, rgba(255,255,245,0) 82%)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(calc(100% - 48px), 1312px)',
          margin: '0 auto',
          padding: 'clamp(48px, 8vw, 96px) 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 'clamp(16px, 2vw, 22px)',
        }}
      >
        {eyebrow?.text ? (
          <span
            style={{
              color: textColor,
              fontFamily: 'Inter, Arial, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '1.5px',
              lineHeight: 1.3,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow.text}
          </span>
        ) : null}
        <h1
          style={{
            margin: 0,
            maxWidth: 620,
            color: textColor,
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(42px, 6vw, 68px)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
          }}
        >
          {headline?.text || 'Latest Collection'}
        </h1>
        {copy?.text ? (
          <p
            style={{
              margin: 0,
              maxWidth: 440,
              color: textColor,
              fontFamily: 'Inter, Arial, sans-serif',
              fontSize: 'clamp(14px, 1.4vw, 16px)',
              lineHeight: 1.6,
            }}
          >
            {copy.text}
          </p>
        ) : null}
        {showCta ? (
          <a
            href={ctaHref || '/collections/all'}
            style={{
              display: 'inline-flex',
              minHeight: 48,
              marginTop: 4,
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 26px',
              borderRadius: 2,
              backgroundColor: accentColor || '#C9A25D',
              color: '#FFFFF5',
              fontFamily: 'Inter, Arial, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.6px',
              lineHeight: 1.2,
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            {ctaLabel?.text || 'Shop New Arrivals'}
          </a>
        ) : null}
      </div>
    </section>
  );
};

export default HomeHero;
