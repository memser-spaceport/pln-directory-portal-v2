'use client';

/**
 * "Learn more" explainer card — PLAA-94.
 *
 * The video asset is TBD in the ticket, so the player is a placeholder slot:
 * the chrome (WATCH pill, title, blurb, duration, captions, 16:9 frame with a
 * play button) is built, but there is no video URL and the frame is inert.
 *
 * The runtime and captions row are deliberately NOT rendered: "2:14" and
 * "Captions" are claims about an asset that does not exist, and the prototype's
 * figure is a fixture like every other number in it. They come back with the
 * asset, carrying its real values.
 */

export default function PlaaVideoCard() {
  return (
    <>
      <h2 className="pvc__section">Learn more</h2>
      <div className="pvc">
        <div>
          <span className="pvc__pill">
            <i className="ph-fill ph-play-circle" style={{ fontSize: '14px' }} />
            Watch
          </span>
          <h3 className="pvc__title">How the PL Network compounds</h3>
          <p className="pvc__blurb">
            A look at the power of the Protocol Labs Network &mdash; and how PLAA turn everyday contributions into a
            flywheel of positive, compounding value for everyone in it.
          </p>
        </div>

        {/* Inert until an asset exists — a button here would promise playback
            this card cannot deliver. */}
        <div className="pvc__frame" role="img" aria-label="Explainer video placeholder — asset pending">
          <span className="pvc__play">
            <i className="ph-fill ph-play" style={{ fontSize: '30px', marginLeft: '4px' }} />
          </span>
          <span className="pvc__tag">video placeholder</span>
        </div>
      </div>

      <style jsx>{`
        .pvc__section {
          font: var(--text-heading-lg);
          margin: 36px 0 0;
        }
        .pvc {
          margin-top: 16px;
          background: var(--surface-card);
          border-radius: var(--radius-2xl);
          box-shadow: var(--ring-hairline), var(--shadow-xs);
          padding: 28px;
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 28px;
          align-items: center;
        }
        .pvc__pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font: var(--text-label-sm);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-brand-text);
          padding: 4px 10px;
          background: var(--color-brand-subtle);
          border-radius: 999px;
        }
        .pvc__title {
          font: var(--text-heading-md);
          margin: 14px 0 8px;
        }
        .pvc__blurb {
          font: var(--text-body-md);
          color: var(--text-secondary);
          margin: 0;
        }
        .pvc__meta {
          display: flex;
          gap: 18px;
          margin-top: 18px;
          font: var(--text-label-md);
          color: var(--text-tertiary);
        }
        .pvc__meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pvc__frame {
          position: relative;
          aspect-ratio: 16 / 9;
          width: 100%;
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--ring-hairline);
          background: repeating-linear-gradient(
            135deg,
            var(--pl-blue-50),
            var(--pl-blue-50) 14px,
            var(--pl-blue-25) 14px,
            var(--pl-blue-25) 28px
          );
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pvc__play {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--color-brand);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
        }
        .pvc__tag {
          position: absolute;
          left: 14px;
          bottom: 12px;
          font: var(--text-label-sm);
          font-weight: 600;
          color: var(--pl-slate-600);
          background: rgba(255, 255, 255, 0.85);
          padding: 3px 9px;
          border-radius: 999px;
        }
        @media (max-width: 1024px) {
          .pvc {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
