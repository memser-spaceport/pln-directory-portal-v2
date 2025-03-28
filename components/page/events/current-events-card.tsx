"use client"

import { getFormattedDateString } from "@/utils/irl.utils"

export default function CurrentEventCard(props: any) {
 
  const name = props.eventData.name;
  const description = props.eventData.description;
  const bannerUrl = props.eventData.bannerUrl;
  const attendees = props.eventData.attendees;
  const location = props.eventData.location;
  const startDate = props.eventData.startDate;
  const endDate = props.eventData.endDate;
  
  return (
    <div className="current-event-card">
      <div className="event-header-image">
        <img
          src={`${bannerUrl}`}
          alt={`${name} event`}
          className="event-image"
        />
      </div>

      <div className="event-body-container">
        <div className="event-body">
          <h2 className="event-title">{name}</h2>
          <p className="event-description">{description.length > 100 ? `${description.substring(0, 90)}...` : description}</p>
        </div>
        
        <div className="event-footer">
          <div className="date-info">
            <span className="calendar-icon">
              <img src="/icons/calendar-outline.svg" alt="calendar" />
            </span>
            <span>{getFormattedDateString(startDate, endDate)}</span>
          </div>
          {attendees > 0 && (
            <div className="attending-info">
              <span className="thumbs-icon">👍</span>
              <span>{attendees} Attending</span>
            </div>
          )}
        </div>      
      </div>
      <style jsx>{`
        .current-event-card {
          width: 289px;
          height: 290px;
          border-radius: 12px;
          box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
          background-color: white;
          display: flex;
          flex-direction: column;
        }

        .current-event-card:hover {
          box-shadow: 0px 0px 0px 2px #156ff740;
        }
        .event-header-image {
          position: relative;
          width: 100%;
          height: 120px;
          flex-shrink: 0;
          overflow: hidden;
          padding: 12px;
          border-radius: 8px;
        }

        .event-body-container {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }

        .event-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.3);
          color: white;
        }

        .event-body {
          padding: 16px;
          text-align: center;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .event-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #1e293b;
        }

        .event-description {
          font-size: 11px;
          line-height: 1.5;
          margin: 0;
          color: #334155;
        }

        .event-footer {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
          width: 100%;
        }

        .date-info, .attending-info {
          font-size: 11.5px;
          font-weight: 500;
          line-height: 12px;
          text-align: left;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 2px;
          cursor: default;
        }

        .date-info {
          border: 1px solid #CBD5E1;
          padding: 4px;
          border-radius: 8px;
          gap: 5px;
        }

        .calendar-icon, .thumbs-icon {
          display: flex;
          align-items: center;
        }

        .location-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .discover-text {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 4px 0;
          font-weight: 400;
        }

        .location-name {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #0f172a;
        }

        .flag {
          font-size: 20px;
        }

        .upcoming-events-count {
          margin-bottom: 16px;
          width: 100%;
          text-align: center;
        }

        .count-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .line {
          height: 1px;
          background-color: #e2e8f0;
          flex-grow: 1;
          max-width: 60px;
        }

        .count {
          font-size: 14px;
          color: #156ff7;
          font-weight: 500;
          white-space: nowrap;
        }

        .event-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
          justify-content: center;
          padding: 0 8px;
          width: 100%;
          max-height: 60px;
          overflow: hidden;
        }

        .event-tag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 94px;
          height: 26px;
          padding: 4px 6px;
          background-color: #f8fafc;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .more-events {
          background-color: #f1f5f9;
          cursor: pointer;
        }

        .more-events:hover {
          background-color: #e2e8f0;
        }

        :global(.tooltip-events) {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.25rem;
        }

        :global(.tooltip-event) {
          white-space: nowrap;
          text-align: left;
        }
      `}</style>
    </div>
  )
}

