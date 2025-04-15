'use client';

import Modal from '@/components/core/modal';
import MultiSelect from '@/components/form/multi-select';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import { EVENTS } from '@/utils/constants';
import { Lead, Rule, Topic, Tag } from '@/types/intro-rules';
import { useEffect, useRef, useState } from 'react';
import LeadItem from './lead-item';

interface AddEditRuleModalProps {
  onSubmit: (data: Rule) => void;
  initialData?: Rule;
  topics: Topic[];
  tags: Tag[];
}

export default function AddEditRuleModal({ 
  onSubmit, 
  initialData,
  topics,
  tags 
}: AddEditRuleModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [rule, setRule] = useState<Rule | null>(null);

  const onClose = () => {
    if (modalRef.current) {
      modalRef.current.close();
      setSelectedTopic(null);
      setSelectedTags([]);
      setLeads([]);
    }
  };

  useEffect(() => {
    document.addEventListener(EVENTS.ADD_EDIT_RULE_MODAL, (event: any) => {
      setMode(event.detail.mode);
      if (event.detail.rule) {
        setRule(event.detail.rule);
        // Set initial values for edit mode
        const topic = topics.find(t => t.name === event.detail.rule.name);
        setSelectedTopic(topic || null);
        setSelectedTags(event.detail.rule.tags.map((tagName: string) => 
          tags.find(t => t.name === tagName)
        ).filter(Boolean));
        setLeads(event.detail.rule.leads);
      } else {
        setRule(null);
        setSelectedTopic(null);
        setSelectedTags([]);
        setLeads([]);
      }
      if (modalRef.current) {
        modalRef.current.showModal();
      }
    });
    return () => {
      document.removeEventListener(EVENTS.ADD_EDIT_RULE_MODAL, () => {});
    };
  }, [topics, tags]);

  const handleTopicChange = (topic: Topic | null) => {
    setSelectedTopic(topic);
  };

  const handleRemoveLead = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const handleSubmit = () => {
    if (!selectedTopic) return;
    
    onSubmit({
      id: rule?.id || String(Date.now()),
      name: selectedTopic.name,
      topic: selectedTopic.id,
      tags: selectedTags.map(tag => tag.name),
      leads: leads
    });
    onClose();
  };

  return (
    <Modal
      modalRef={modalRef}
      onClose={onClose} 
    >
      <div className="add-edit-rule">
        <div className="add-edit-rule__header">
          <h2 className="add-edit-rule__title">{mode === 'add' ? 'Add New Rule' : 'Edit Rule'}</h2>
        </div>

        <div className="add-edit-rule__form">
          <div className="add-edit-rule__field">
            <SearchableSingleSelect
              id="topic-info"
              isMandatory={true}
              placeholder="Select a topic"
              displayKey="name"
              options={topics}
              selectedOption={selectedTopic}
              uniqueKey="id"
              formKey="name"
              name={`topic`}
              label='Select Topic'
              onClear={() => handleTopicChange(null)}
              onChange={handleTopicChange}
              arrowImgUrl="/icons/arrow-down.svg"
            />
          </div>
          <div>
            <MultiSelect
              options={tags}
              selectedOptions={selectedTags}
              onAdd={(item) => {
                  setSelectedTags([...selectedTags, {id: item.id, name: item.name}]);
              }}
              onRemove={(item) => {
                  const newSelectedTags = selectedTags.filter((tag) => tag.id !== item.id);
                  setSelectedTags(newSelectedTags);
              }}
              uniqueKey="id"
              displayKey="name"
              label="Select Tags"
              placeholder="Select applicable tags"
              isMandatory={true}
              closeImgUrl="/icons/close.svg"
              arrowImgUrl="/icons/arrow-down.svg"
            />
          </div>

          <div className="add-edit-rule__field">
            <label>Assigned Leads</label>
            <div className="add-edit-rule__search-container">
            <div className="add-edit-rule__search">
              <img src="/icons/search-gray.svg" alt="search" width={16} height={16} />
              <input type="text" placeholder="Search List" />
            </div>
              <button className="add-edit-rule__add-lead">+ Add Lead</button>
            </div>
            <div className="add-edit-rule__leads">
              {leads.length === 0 ? (
                <p className="add-edit-rule__no-leads">No leads assigned</p>
              ) : (
                <div className="add-edit-rule__lead-list">
                  {leads.map(lead => (
                    <LeadItem 
                      key={lead.id}
                      lead={lead}
                      onRemove={handleRemoveLead}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="add-edit-rule__actions">
          <button onClick={onClose} className="add-edit-rule__cancel">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="add-edit-rule__submit"
            disabled={!selectedTopic}
          >
            {mode === 'add' ? 'Add Rule' : 'Save Changes'}
          </button>
        </div>

        <style jsx>{`
          .add-edit-rule {
            display: flex;
            flex-direction: column;
            gap: 24px;
            padding: 24px;
            width: 656px;
          }

          .add-edit-rule__form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .add-edit-rule__field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .add-edit-rule__field label {
            font-size: 14px;
            color: #1E293B;
            font-weight: 500;
          }

          .add-edit-rule__field select {
            padding: 8px 12px;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            font-size: 14px;
            color: #64748B;
            outline: none;
          }

          .add-edit-rule__tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 8px;
          }

          .add-edit-rule__tag {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background: #F1F5F9;
            border-radius: 4px;
            font-size: 12px;
            color: #1E293B;
          }

          .add-edit-rule__tag button {
            border: none;
            background: none;
            padding: 0;
            cursor: pointer;
            color: #64748B;
          }

          .add-edit-rule__search-container {
            display: flex;
            justify-content: space-between;
            height: 40px;
          }

          .add-edit-rule__search {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            
          }

          .add-edit-rule__search input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 14px;
            color: #64748B;
            width: 220px;
          }

          .add-edit-rule__add-lead {
            border: none;
            background: none;
            color: #0066FF;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border: 1px solid #156FF7;
            border-radius: 8px;
            padding: 8px 12px;
          }

          .add-edit-rule__leads {
            min-height: 120px;
            display: flex;
            flex-direction: column;
          }

          .add-edit-rule__lead-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            background: #F8FAFC;
            border-radius: 4px;
            min-height: 286px;
          }

          .add-edit-rule__no-leads {
            background: #F8FAFC;
            font-size: 14px;
            height: 286px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748B;
            border-radius: 4px;
          }

          .add-edit-rule__actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding-top: 8px;
            border-top: 1px solid #E2E8F0;
          }

          .add-edit-rule__cancel {
            padding: 8px 16px;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            background: white;
            color: #0F172A;
            font-size: 14px;
            cursor: pointer;
          }

          .add-edit-rule__submit {
            padding: 8px 16px;
            background: #0066FF;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          }
        `}</style>
      </div>
    </Modal>
  );
} 