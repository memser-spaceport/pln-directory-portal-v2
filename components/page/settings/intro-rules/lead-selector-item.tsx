'use client';

interface LeadSelectorItemProps {
  lead: {
    id: string;
    name: string;
    avatar: string;
  };
  isSelected?: boolean;
  onSelect: (lead: any) => void;
}

export default function LeadSelectorItem({ lead, isSelected, onSelect }: LeadSelectorItemProps) {
  return (
    <div className="lead-selector-item">
      <div className="lead-selector-item__info">
        <img 
          src={lead.avatar || '/icons/default_profile.svg'} 
          alt={lead.name} 
          className="lead-selector-item__avatar" 
          width={24}
          height={24}
        />
        <span className="lead-selector-item__name">{lead.name}</span>
      </div>
      <button 
        onClick={() => onSelect(lead)}
        className="lead-selector-item__action"
      >
        {isSelected ? (
          <img src="/icons/intro-rules/added.svg" alt="selected" width={24} height={24} />
        ) : (
          <img src="/icons/intro-rules/add-blue.svg" alt="add" width={24} height={24} />
        )}
      </button>

      <style jsx>{`
        .lead-selector-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          gap: 8px;
          border-bottom: 1px solid #E2E8F0;
        }

        .lead-selector-item:hover {
          background: #F8FAFC;
        }

        .lead-selector-item__info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lead-selector-item__avatar {
          border-radius: 50%;
          object-fit: cover;
        }

        .lead-selector-item__name {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          letter-spacing: 0px;
          color: #0F172A;
        }

        .lead-selector-item__action {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          color: #0066FF;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
        }
      `}</style>
    </div>
  );
} 