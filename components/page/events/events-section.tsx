"use client"

import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
// import type { EventLocation } from "@/types/events.types"
// import EventCard from "./event-card"

interface EventsSectionProps {
  // eventLocations: EventLocation[]
}

/**
 * Main component for displaying the events section with carousel
 * Uses Embla Carousel for desktop and simple overflow scrolling for mobile
 */
export default function EventsSection({ eventLocations }: any) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)

  // Update scroll buttons state
  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
    }

    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    onSelect()

    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi])

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  return (
    <div className="events-section">
      <div className="header">
        <h1>Current & Upcoming</h1>

        <div className="navigation-buttons">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={`nav-button ${!canScrollPrev ? "disabled" : ""}`}
            aria-label="Previous"
          >
            <img src="/icons/arrow-left-blue.svg" alt="Previous" width={24} height={24} />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={`nav-button ${!canScrollNext ? "disabled" : ""}`}
            aria-label="Next"
          >
            <img src="/icons/arrow-right-blue.svg" alt="Next" width={24} height={24} />
          </button>
        </div>
      </div>

      {/* Mobile view - simple horizontal scrolling */}
      <div className="mobile-container">
        <div className="mobile-scroll-container">
          {eventLocations.map((location: any) => (
            // <EventCard key={location.id} eventData={location} />
            <div key={location.id}>{location.name}</div>
          ))}
        </div>
      </div>

      {/* Desktop view - Embla carousel */}
      <div className="desktop-container">
        <div className="carousel-viewport" ref={emblaRef}>
          <div className="carousel-container-inner">
            {eventLocations.map((location: any) => (
              // <EventCard key={location.id} eventData={location} />
              <div key={location.id}>{location.name}</div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .events-section {
          padding: 1rem 0;
          width: 100%;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 0 1rem;
        }

        .header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #000000;
          margin: 0;
        }

        .navigation-buttons {
          display: none;
        }

        .nav-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-button:hover:not(.disabled) {
          background-color: #f1f5f9;
        }

        .nav-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile view (360px to 1023px) */
        .mobile-container {
          display: block;
          width: 100%;
        }

        .mobile-scroll-container {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-left: 1rem;
          padding-bottom: 1rem;
          gap: 1rem;
          width: 100%;
        }

        .mobile-scroll-container > :global(*) {
          scroll-snap-align: start;
        }

        /* Desktop view (hidden on mobile) */
        .desktop-container {
          display: none;
        }

        /* Mobile styles */
        @media (min-width: 360px) and (max-width: 1023px) {
          .events-section {
            padding: 1rem 0;
          }
          
          .header {
            padding: 0 1rem;
          }
          
          .navigation-buttons {
            display: none;
          }
        }

        /* Desktop styles */
        @media (min-width: 1024px) {
          .events-section {
            padding: 2rem 0;
          }

          .header {
            padding: 0 2rem;
          }
          
          .navigation-buttons {
            display: flex;
            gap: 0.5rem;
          }
          
          .mobile-container {
            display: none;
          }
          
          .desktop-container {
            display: block;
            overflow: hidden;
            width: 100%;
          }
          
          .carousel-viewport {
            overflow: hidden;
            width: 100%;
          }
          
          .carousel-container-inner {
            display: flex;
            backface-visibility: hidden;
            touch-action: pan-y;
            margin-left: -2rem;
            padding-left: 2rem;
          }
        }
      `}</style>
    </div>
  )
}

