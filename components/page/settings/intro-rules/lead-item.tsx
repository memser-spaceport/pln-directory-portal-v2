'use client';

import { Lead } from '@/types/intro-rules';

interface LeadItemProps {
  lead: Lead;
  onRemove: (id: string) => void;
}

export default function LeadItem({ lead, onRemove }: LeadItemProps) {
  return (
    <div className="lead-item">
      <div className="lead-item__info">
        <img 
          src={lead.avatar || '/icons/avatar-placeholder.svg'} 
          alt={lead.name} 
          className="lead-item__avatar" 
        />
        <div className="lead-item__details">
          <span className="lead-item__name">{lead.name}</span>
          {lead.role && <span className="lead-item__role">{lead.role}</span>}
        </div>
      </div>
      <button 
        onClick={() => onRemove(lead.id)} 
        className="lead-item__remove"
      >
        <img src="/icons/close.svg" alt="remove" width={16} height={16} />
      </button>

      <style jsx>{`
        .lead-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: white;
        }

        .lead-item__info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lead-item__avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .lead-item__details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .lead-item__name {
          font-size: 14px;
          color: #1E293B;
          font-weight: 500;
        }

        .lead-item__role {
          font-size: 12px;
          color: #64748B;
        }

        .lead-item__remove {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .lead-item__remove:hover {
          background: #F1F5F9;
        }
      `}</style>
    </div>
  );
} 