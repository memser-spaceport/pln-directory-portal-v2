'use client';

import { usePostHog } from 'posthog-js/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DemoDayLanding() {
  const posthog = usePostHog();
  const router = useRouter();
  const [featureFlagVariant, setFeatureFlagVariant] = useState<string | boolean | undefined>(undefined);

  // Get PostHog feature flag value
  useEffect(() => {
    if (!posthog) return;

    // Wait for feature flags to be loaded before reading them
    posthog.onFeatureFlags(() => {
      const featureFlag = posthog.getFeatureFlag('test-experiment-landing-page');
      setFeatureFlagVariant(featureFlag);
    });
  }, [posthog]);

  const handleClick = () => {
    router.push('/demoday');
  };

  // Determine background color based on feature flag
  const getBackgroundColor = () => {
    console.log('ForTest featureFlagVariant:', featureFlagVariant);
    if (featureFlagVariant === 'landing_v1') {
      return '#ef4444'; // Red
    } else if (featureFlagVariant === 'landing_v2') {
      return '#3b82f6'; // Blue
    }
    return '#9ca3af'; // Gray (default/loading)
  };

  return (
    <div className="demo-day-landing">
      <div
        className="demo-day-landing__card"
        onClick={handleClick}
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <div className="demo-day-landing__content">
          <h3 className="demo-day-landing__title">Demo Day</h3>
          <p className="demo-day-landing__description">
            Discover innovative projects and teams showcasing their work
          </p>
          <div className="demo-day-landing__arrow">→</div>
        </div>
      </div>

      <style jsx>{`
        .demo-day-landing {
          margin-bottom: 24px;
        }

        .demo-day-landing__card {
          border-radius: 8px;
          padding: 24px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .demo-day-landing__card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .demo-day-landing__content {
          position: relative;
          z-index: 1;
        }

        .demo-day-landing__title {
          color: white;
          font-size: 20px;
          font-weight: 600;
          line-height: 28px;
          margin: 0 0 8px 0;
        }

        .demo-day-landing__description {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          margin: 0;
        }

        .demo-day-landing__arrow {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: white;
          font-size: 24px;
          font-weight: 600;
        }

        @media (max-width: 1023px) {
          .demo-day-landing {
            margin-bottom: 16px;
          }

          .demo-day-landing__card {
            padding: 20px 16px;
          }

          .demo-day-landing__title {
            font-size: 18px;
            line-height: 24px;
          }

          .demo-day-landing__description {
            font-size: 13px;
            line-height: 20px;
          }
        }
      `}</style>
    </div>
  );
}
