"use client"
export default function HuskyBanner() {
  // Generate random squares for the background pattern
  const backgroundSquares = Array.from({ length: 50 }).map((_, i) => ({
    key: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    isBlue: Math.random() > 0.5
  }))

  return (
    <div className="husky-banner">
      {/* Background pattern */}
      <div className="pattern-container">
        {backgroundSquares.map((square) => (
          <div
            key={square.key}
            className={`pattern-square ${square.isBlue ? 'blue-square' : 'green-square'}`}
            style={{
              top: square.top,
              left: square.left,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="content-container">
        <h2 className="banner-title">Learn more about Contributors</h2>

        <div className="button-container">
          <div className="button-shadow"></div>
          <button
            className="husky-button"
          >
            <img
              src="/images/husky/husky.svg"
              alt="Husky Icon"
              width="24"
              height="24"
              className="husky-icon"
            />
            Ask Husky
          </button>
        </div>
      </div>

      <style jsx>{`
        .husky-banner {
          width: 100%;
          background-color: #eef8ff;
          padding: 1.5rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(63, 132, 235, 0.2);
          position: relative;
          overflow: hidden;
        }

        .pattern-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .pattern-square {
          position: absolute;
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 0.125rem;
          opacity: 0.2;
        }

        .blue-square {
          background-color: #3f84eb;
        }

        .green-square {
          background-color: #3dfeb1;
        }

        .content-container {
          position: relative;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          width: 100%;
        }

        .banner-title {
          font-size: 1.25rem;
          font-weight: 500;
          color: black;
        }

        .button-container {
          position: relative;
        }

        .button-shadow {
          position: absolute;
          top: 5px;
          left: 5px;
          width: 100%;
          height: 100%;
          background-color: #156FF7;
          border-radius: 0.5rem;
        }

        :global(.husky-button) {
          position: relative;
          background-color: white;
          border-color: #156ff7;
          color: #156ff7;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
        }

        :global(.husky-button:hover) {
          background-color: white;
          color: #156ff7;
        }

        :global(.husky-icon) {
          color: #156ff7;
        }
      `}</style>
    </div>
  )
} 