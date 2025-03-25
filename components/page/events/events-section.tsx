"use client"

import { useEffect, useRef, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import LocationCard from "../home/featured/location-card"
import { getAnalyticsLocationCardInfo, getAnalyticsUserInfo, getParsedValue } from "@/utils/common.utils"
import { useRouter } from "next/navigation"
import Cookies from 'js-cookie';
import CurrentEventCard from "./current-events-card"
import { getAggregatedEventsData } from "@/services/events.service"
import { useEventsAnalytics } from "@/analytics/events.analytics";
import { PAGE_ROUTES } from "@/utils/constants";
import { isPastDate } from "@/utils/irl.utils"
// import { useScrollToSection } from "@/hooks/useScrollToSection"
import { formatFeaturedData } from "@/utils/home.utils"

interface EventsSectionProps {
  eventLocations: any;
  userInfo?: any
  isLoggedIn?: boolean
  getFeaturedDataa?: any
  onEventClicked?: (item: any) => void
  onIrlLocationClicked?: (item: any) => void
}

/**
 * Main component for displaying the events section with carousel
 * Uses Embla Carousel for desktop and simple overflow scrolling for mobile
 */
export default function EventsSection({ 
  eventLocations,
  userInfo,
  isLoggedIn,
}: EventsSectionProps) {

  // const eventsSectionRef = useRef<HTMLDivElement>(null)
  // const { scrollMarginTop } = useScrollToSection(eventsSectionRef, "upcoming-events", 80)
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [featuredData, setfeaturedData] = useState(eventLocations ?? []);

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
  
  const router = useRouter();
  const analytics = useEventsAnalytics();

  const getFeaturedDataa = async () => {
    const authToken = getParsedValue(Cookies.get('authToken'));
    const featData = await getAggregatedEventsData(authToken, isLoggedIn);
    setfeaturedData(formatFeaturedData(featData.data));
    router.refresh();
  };

  const getEventLocation = (event: any) => {
    try {
      const isPast = isPastDate(event.endDate);
      const country = event?.location?.split(',')[0].trim();
      return `${PAGE_ROUTES.IRL}/?location=${country}&type=${isPast ? 'past' : 'upcoming'}&${isPast ? `event=${event?.slugUrl}` : ''}`;
    } catch (error) {
      return '';
    }
  };

  const onIrlLocationClicked = (location: any) => {
    analytics.onIrlLocationClicked(getAnalyticsUserInfo(userInfo), getAnalyticsLocationCardInfo(location));
  };

  const onEventClicked = (event: any) => {
    analytics.onEventCardClicked(getAnalyticsUserInfo(userInfo), event);
  };

  /**
   * Renders the appropriate card component based on the item category
   */
  const renderCardByCategory = (item: any) => {
    const category = item?.category; // Default to location if not specified
    
    switch (category) {
      case 'event':
        return (
          <a 
            target="_blank" 
            href={getEventLocation(item)} 
            onClick={() => onEventClicked(item)}
          >
            <CurrentEventCard eventData={item} />
          </a>
        );

      case 'location':
      default:
        return (
          <a
            target="_blank"
            href={`${PAGE_ROUTES.IRL}?location=${item?.location?.split(',')[0].trim()}`}
            onClick={(e: any) => {
              onIrlLocationClicked(item);
              if (e.defaultPrevented) return;
            }}
          >
            <LocationCard {...item} userInfo={userInfo} getFeaturedDataa={getFeaturedDataa} />
          </a>
        );
    }
  };

  return (
    <div 
      className={`events-section`}
      id="events"
      // ref={eventsSectionRef} 
      // style={{ scrollMarginTop }}
    >
      <div className="header">
        <h1>Current & Upcoming</h1>

        <div className="navigation-buttons">
          <button
            onClick={() => {scrollPrev(); analytics.onCarouselLeftClicked(getAnalyticsUserInfo(userInfo), {});}}
            disabled={!canScrollPrev}
            className={`nav-button ${!canScrollPrev ? "disabled" : ""}`}
            aria-label="Previous"
          >
            <img src="/icons/arrow-left-blue.svg" alt="Previous" width={20} height={20} />
          </button>
          <button
            onClick={() => {scrollNext(); analytics.onCarouselRightClicked(getAnalyticsUserInfo(userInfo), {});}}
            disabled={!canScrollNext}
            className={`nav-button ${!canScrollNext ? "disabled" : ""}`}
            aria-label="Next"
          >
            <img src="/icons/arrow-right-blue.svg" alt="Next" width={20} height={20} />
          </button>
        </div>
      </div>

      {featuredData.length === 0 && 
        <div className="no-events-container">
          <div className="no-events-text">
            <p>No events found</p>
          </div>
        </div>
      }
      <div className="mobile-container">
        <div className="mobile-scroll-container">
          {featuredData.map((location: any) => (
            <div key={location?.uid || location?.id} className="card-wrapper">
              {renderCardByCategory(location)}
            </div>
          ))}
        </div>
      </div>

      <div className="desktop-container">
        <div className="carousel-viewport" ref={emblaRef}>
          <div className="carousel-container-inner">
            {featuredData.map((location: any) => (
              <div className="card-wrapper" key={location?.uid}>
                {renderCardByCategory(location)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .events-section {
          padding: 1rem 0;
          width: 100%;
        }

         .no-events-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        .no-events-text {
          text-align: center;
        }

        .no-events-text p {
          color: #6B7280; /* Tailwind's text-gray-500 */
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          width: 32px;
          height: 32px;
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

        .card-wrapper {
          flex-shrink: 0;
          width: calc(100% - 2rem);
          margin-right: 1rem;
        }

        :global(.card-link) {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .mobile-container {
          display: block;
          width: 100%;
          padding-left: 20px;
        }

        .mobile-scroll-container {
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-left: 32px;
          padding-bottom: 32px;
          padding-top: 20px;
          gap: 32px;
          width: 100%;
        }

        .mobile-scroll-container > .card-wrapper {
          scroll-snap-align: start;
        }

        .desktop-container {
          display: none;
        }

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

          .card-wrapper {
            width: 300px;
          }
        }

        @media (min-width: 1024px) {
          .events-section {
            padding: 32px 0 0 0;
          }

          .header {
            padding: 0 20px;
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
            margin: 0px 20px;
          }
          
          .carousel-viewport {
            overflow: hidden;
            width: 100%;
          }
          
          .carousel-container-inner {
            display: flex;
            backface-visibility: hidden;
            touch-action: pan-y;
            padding: 10px 10px 30px 0px;
          }

          .card-wrapper {
            flex: 0 0 auto;
            width: 289px;
            height: 290px;
          }
        }
      `}</style>
    </div>
  )
}

