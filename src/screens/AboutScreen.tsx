import React from 'react';
import { FeatherDivider } from '../components/FeatherDivider';

export const AboutScreen: React.FC = () => {
  return (
    <div className="fade-in" style={{ padding: '48px 24px 120px' }}>
      <article style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ marginBottom: '16px' }}>
            <img src="/brand/logo-mark.png" alt="Kin logo mark" style={{ height: '36px', width: 'auto' }} />
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.2rem)', lineHeight: 1.15, marginBottom: '16px', color: 'var(--color-primary)' }}>
            The Anatomy of Kinship
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            How a working sketchbook of twenty hybrid creatures inspired a digital instrument for recognizing kindred craft.
          </p>
        </div>

        <FeatherDivider />

        {/* Section 1: The Philosophy */}
        <div style={{ margin: '36px 0', fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--color-text-primary)' }}>
          <p style={{ marginBottom: '20px' }}>
            Every artist who draws knows the private solitude of the blank sheet. Whether scratching with a disposable ballpoint across blue-ruled school paper or laying deliberate iron-gall cross-hatching upon vellum, you are searching for forms that feel inevitable.
          </p>
          <p style={{ marginBottom: '24px' }}>
            <strong style={{ color: 'var(--color-primary)' }}>Kin</strong> was not designed in a corporate incubator. It was distilled directly from twenty sketchbook folios—studies of stilt-legged herons with canes, masked smokers in plum waistcoats, and mechanical sentinels poised upon concentric rings. The app asks a singular question: <em>When you make a mark, who else in the vast history of art has made that same confession?</em>
          </p>
        </div>

        {/* Major Feature Illustration: ART-04 Victorian Lemur */}
        <figure 
          style={{
            margin: '48px 0',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div 
            className="artwork-mat"
            style={{
              backgroundColor: '#FAF5EC',
              maxHeight: '620px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <img
              src="/brand/illustrations/art-04-card.jpg"
              alt="ART-04: Lemur-headed figure in Victorian gown holding a teacup"
              className="artwork-img-blend"
              style={{ maxHeight: '560px', maxWidth: '100%', width: 'auto' }}
            />
          </div>
          <figcaption 
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: '6px 12px',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              ART-04 · Duchess with Teacup & Attendant
            </span>
            <span>Monochrome fine-pen cross-hatch</span>
          </figcaption>
        </figure>

        {/* Section 2: The Four Working Modes */}
        <div style={{ margin: '40px 0' }}>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '16px', color: 'var(--color-primary)' }}>
            Four Modes of the Hand
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            The source collection is not one single style, but four distinct registers from a single hand:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '24px 0' }}>
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--color-secondary)' }}>
                1. Exploratory Sketchbook Mode
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                Ballpoint and felt marker on ruled paper (ART-01, 11–19). Immediate, unfiltered, with visible margin notes and multiple creature studies sharing a single sheet.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--color-primary)' }}>
                2. Deliberate Fine Ink Illustration
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                Exquisite discipline of cross-hatching and ink wash (ART-04, 20). No pencil under-drawing erased; every millimeter of drapery and feather texture earned through patient stroke density.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--color-accent)' }}>
                3. Saturated Digital Pigment
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                High-contrast jewel tones (ART-03, 05, 06). Undulating cadmium flame borders, floating spiked ocular orbs, and cobalt auras that defy clinical pastel palettes.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--color-accent-teal)' }}>
                4. Inverted Chalk Nocturnes
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                Calcium-white contours luminous against deep aubergine and maroon fields (ART-07, 08). This mode powers our full-bleed processing interface.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Illustration 2: ART-19 Beaked Smoker with Afro */}
        <figure 
          style={{
            margin: '48px 0',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div 
            className="artwork-mat"
            style={{
              backgroundColor: '#FAF5EC',
              maxHeight: '540px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <img
              src="/brand/illustrations/art-19-card.png"
              alt="ART-19: Beaked figure with afro and swirling smoke lines"
              className="artwork-img-blend"
              style={{ maxHeight: '480px', maxWidth: '100%', width: 'auto' }}
            />
          </div>
          <figcaption 
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: '6px 12px',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              ART-19 · The Beaked Smoker with Filigree Vapor
            </span>
            <span>Sepia ink & purple marker</span>
          </figcaption>
        </figure>

        {/* Section 3: The Double Contour Habit */}
        <div style={{ margin: '40px 0', fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--color-text-primary)' }}>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '16px', color: 'var(--color-primary)' }}>
            The Double-Outline Gesture
          </h2>
          <p style={{ marginBottom: '20px' }}>
            Throughout the sketchbook, the artist frequently traces a silhouette a second time, slightly displaced in a complementary hue—orange backed by green, or magenta shadow beneath plum contour. It mimics the optical vibration of early lithographic printing misregistration.
          </p>
          <p>
            In this interface, we honored that idiosyncrasy as a core interaction law: every button, active card, and hover state echoes with a 3px offset magenta contour. Rather than smoothing the rough edges of human making into sterilised software chrome, the software bows to the sketchbook.
          </p>
        </div>

        {/* Feature Illustration 3: ART-20 Feather Bird */}
        <figure 
          style={{
            margin: '48px 0',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div 
            className="artwork-mat"
            style={{
              backgroundColor: '#FAF5EC',
              maxHeight: '640px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <img
              src="/brand/illustrations/art-20-card.png"
              alt="ART-20: Bird of dense layered feathers in monochrome ink wash"
              className="artwork-img-blend"
              style={{ maxHeight: '580px', maxWidth: '100%', width: 'auto' }}
            />
          </div>
          <figcaption 
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: '6px 12px',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              ART-20 · Curlew of Infinite Plumage
            </span>
            <span>Monochrome Indian ink wash</span>
          </figcaption>
        </figure>

        <FeatherDivider />

        <div style={{ textAlign: 'center', marginTop: '36px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
          Kin Prototype v1.0 · Grounded in the 20-piece artist archive · Built with reverence for the hand.
        </div>
      </article>
    </div>
  );
};
