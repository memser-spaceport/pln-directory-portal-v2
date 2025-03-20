"use client"

import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import IrlCard from "../home/featured/irl-card"
import LocationCard from "../home/featured/location-card"
import { ADMIN_ROLE, PAGE_ROUTES } from "@/utils/constants"
import { getParsedValue } from "@/utils/common.utils"
import { getFeaturedData } from "@/services/featured.service"
import { formatFeaturedData } from "@/utils/home.utils"
import { useRouter } from "next/navigation"
import Cookies from 'js-cookie';
import { mockEvents } from "@/utils/constants/events-constants"
import CurrentEventCard from "./current-events-card"
interface EventsSectionProps {
  eventLocations: any;
  userInfo?: any
  isLoggedIn?: boolean
  getFeaturedDataa?: any
  onEventClicked?: (item: any) => void
  onIrlLocationClicked?: (item: any) => void
}

/**
 * Helper function to determine event location URL
 */
// const getEventLocation = (item: any) => {
//   // Implementation based on your routing logic
//   return `${PAGE_ROUTES.IRL}/${item.id}`
// }

/**
 * Main component for displaying the events section with carousel
 * Uses Embla Carousel for desktop and simple overflow scrolling for mobile
 */
export default function EventsSection({ 
  eventLocations,
  userInfo,
  isLoggedIn,
}: EventsSectionProps) {
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
  // const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  
  const getFeaturedDataa = async () => {
    const authToken = getParsedValue(Cookies.get('authToken'));
    // const featData = await getFeaturedData(authToken, isLoggedIn, isAdmin);
    const featData = mockEvents;
    setfeaturedData(formatFeaturedData(featData));
    router.refresh();
  };

  /**
   * Renders the appropriate card component based on the item category
   */
  const renderCardByCategory = (item: any) => {
    const category = item?.category; // Default to location if not specified
    
    console.log(category, 'category');
    // console.log(item, 'item');
    switch (category) {
      case 'event':
        return (
          <a 
            target="_blank" 
            // href={getEventLocation(item)} 
            // onClick={() => onEventClicked(item)}
          >
            <CurrentEventCard eventData={item} />
          </a>
        );

      case 'location':
      default:
        return (
          <a
            target="_blank"
            // href={`${PAGE_ROUTES.IRL}?location=${item?.location?.split(',')[0].trim()}`}
            // onClick={(e: any) => {
            //   onIrlLocationClicked(item);
            //   if (e.defaultPrevented) return;
            // }}
          >
            <LocationCard {...item} userInfo={userInfo} getFeaturedDataa={getFeaturedDataa} />
          </a>
        );
    }
  };


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

      <div className="mobile-container">
        <div className="mobile-scroll-container">
          {eventLocations.map((location: any) => (
            <div key={location.uid} className="card-wrapper">
              {renderCardByCategory(location)}
            </div>
          ))}
        </div>
      </div>

      <div className="desktop-container">
        <div className="carousel-viewport" ref={emblaRef}>
          <div className="carousel-container-inner">
            {eventLocations.map((location: any) => (
              <div key={location.uid} className="card-wrapper">
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
            padding: 10px 10px 10px 15px;
          }

          .card-wrapper {
            flex: 0 0 auto;
            width: 289px;
            height: 290px;
            margin-right: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

