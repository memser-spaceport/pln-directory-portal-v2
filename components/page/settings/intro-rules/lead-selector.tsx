'use client';

import { useEffect, useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import LeadSelectorItem from './lead-selector-item';
import { Lead } from '@/types/intro-rules';

interface LeadSelectorProps {
  searchQuery: string;
  selectedLeads: Lead[];
  onSelectLead: (lead: Lead) => void;
  members: Lead[];
}

const ITEM_SIZE = 43;

export default function LeadSelector({ searchQuery, selectedLeads, onSelectLead, members }: LeadSelectorProps) {
  // Memoize filtered leads to prevent unnecessary re-renders
  const filteredLeads = useMemo(() => 
    members.filter(lead => 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [members, searchQuery]
  );

  // Memoize the row renderer to prevent recreation on every render
  const Row = useMemo(() => {
    const RowComponent = ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style}>
        <LeadSelectorItem
          key={filteredLeads[index].id}
          lead={filteredLeads[index]}
          isSelected={selectedLeads.some(l => l.id === filteredLeads[index].id)}
          onSelect={onSelectLead}
        />
      </div>
    );
    RowComponent.displayName = 'Row';
    return RowComponent;
  }, [filteredLeads, selectedLeads, onSelectLead]);

  return (
    <div className="lead-selector">
      <AutoSizer disableWidth>
        {({ height }) => (
          <List
            height={height || 234}
            itemCount={filteredLeads.length}
            itemSize={ITEM_SIZE}
            width="100%"
            overscanCount={5}
            className="lead-selector__list"
          >
            {Row}
          </List>
        )}
      </AutoSizer>

      <style jsx>{`
        .lead-selector {
          height: 234px;
          overflow: hidden;
          border-radius: 8px;
        }

        :global(.lead-selector__list) {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }

        :global(.lead-selector__list::-webkit-scrollbar) {
          width: 6px;
        }

        :global(.lead-selector__list::-webkit-scrollbar-track) {
          background: transparent;
        }

        :global(.lead-selector__list::-webkit-scrollbar-thumb) {
          background-color: #CBD5E1;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
} 