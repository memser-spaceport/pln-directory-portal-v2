'use client';

import Modal from '@/components/core/modal';
import MultiSelect from '@/components/form/multi-select';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import { EVENTS } from '@/utils/constants';
import { Lead, Rule, Topic, Tag } from '@/types/intro-rules';
import { useEffect, useRef, useState } from 'react';
import LeadItem from './lead-item';
import LeadSelector from './lead-selector';

interface AddEditRuleModalProps {
  onSubmit: (data: Rule) => void;
  initialData?: Rule;
  topics: Topic[];
  tags: Tag[];
  members: any[];
}

export default function AddEditRuleModal({ 
  onSubmit, 
  initialData,
  topics,
  tags,
  members
}: AddEditRuleModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>({id: '', name: ''});
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [rule, setRule] = useState<Rule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryLead, setSearchQueryLead] = useState('');
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [showLeadSelector, setShowLeadSelector] = useState(true);
  const [errors, setErrors] = useState<any>({});
  const leadSelectorRef = useRef<HTMLDivElement>(null);


  const onClose = () => {
    if (modalRef.current) {
      modalRef.current.close();
      setSelectedTopic({id: '', name: ''});
      setSelectedTags([]);
      setLeads([]);
    }
  };

  useEffect(() => {
    setFilteredLeads(leads.filter(lead => 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [searchQuery, leads]);

  useEffect(() => {
    const handleModalEvent = (event: CustomEvent<{ mode: 'add' | 'edit'; rule?: Rule }>) => {
      setErrors({});
      setMode(event.detail.mode);
      
      if (event.detail.rule) {
        // Edit mode
        const { rule } = event.detail;
        setRule(rule);
        setSelectedTopic(rule.topic);
        setSelectedTags(rule.tags);
        setLeads(rule.leads);
      } else {
        // Add mode
        setRule(null);
        setSelectedTopic({id: '', name: ''});
        setSelectedTags([]);
        setLeads([]);
      }

      modalRef.current?.showModal();
    };

    // Type assertion for CustomEvent
    document.addEventListener(EVENTS.ADD_EDIT_RULE_MODAL, handleModalEvent as EventListener);
    
    return () => {
      document.removeEventListener(EVENTS.ADD_EDIT_RULE_MODAL, handleModalEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (leadSelectorRef.current && !leadSelectorRef.current.contains(event.target as Node)) {
        setShowLeadSelector(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTopicChange = (topic: Topic | null) => {
    setSelectedTopic(topic);
  };

  const handleRemoveLead = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const handleSelectLead = (lead: any) => {
    if (!leads.some(l => l.id === lead.id)) {
      setLeads([...leads, { ...lead }]);
    }
  };

  const validateForm = () => {
    let errors = {};
    if (!selectedTopic || selectedTopic.id === '') {
      errors = { ...errors, topic: 'Please select a topic' };
    }
    if (selectedTags && selectedTags.length === 0) {
      errors = { ...errors, tags: 'Please select at least one tag' };
    }
    return errors;
  };

  const handleSubmit = () => {
    console.log(selectedTopic);
    console.log(selectedTags);
    console.log(leads);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      console.log(errors);
      return;
    }
    
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
              onChange={(selected) => {
                handleTopicChange(selected as Topic | null);
              }}
              arrowImgUrl="/icons/arrow-down.svg"
            />
            {errors.topic && <p className="add-edit-rule__error">{errors.topic}</p>}
          </div>
          <div className="add-edit-rule__field">
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
            {errors.tags && <p className="add-edit-rule__error">{errors.tags}</p>}
          </div>

          <div className="add-edit-rule__field">
            <label>Assigned Leads</label>
            <div className="add-edit-rule__leads-header">
              <div className="add-edit-rule__search">
                <img src="/icons/search-gray.svg" alt="search" width={16} height={16} />
                <input 
                  type="text" 
                  placeholder="Search List" 
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <button 
                className="add-edit-rule__add-lead"
                onClick={() => setShowLeadSelector(!showLeadSelector)}
              >
                <span className="add-edit-rule__add-lead-mobile">+ Lead</span>
                <span className="add-edit-rule__add-lead-desktop">+ Add Lead</span>
              </button>
              
            </div>
            <div className="add-edit-rule__lead-selector-container">
            {showLeadSelector && (
              <div 
                ref={leadSelectorRef}
                className="add-edit-rule__lead-selector"
              >
                <div className='add-edit-rule__lead-selector-header'>
                    <img src="/icons/search-gray.svg" alt="search" width={16} height={16} />
                    <input 
                      type="text" 
                      placeholder="Search" 
                      onChange={(e) => setSearchQueryLead(e.target.value)}
                    />
                </div>
                <LeadSelector
                  members={members}
                  searchQuery={searchQueryLead}
                  selectedLeads={leads}
                  onSelectLead={handleSelectLead}
              />
              </div>
            )}
            </div>
            <div className="add-edit-rule__leads">
              {leads.length === 0 ? (
                <p className="add-edit-rule__no-leads">No leads assigned</p>
              ) : (
                <div className="add-edit-rule__lead-list">
                  {filteredLeads.map(lead => (
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
            width: 80vw;
            max-width: 656px;
            min-width: 280px;
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
          
          .add-edit-rule__lead-selector-container {
            position: relative;
          }

          .add-edit-rule__lead-selector-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            gap: 8px;
            border-bottom: 1px solid #CBD5E1;
          }

          .add-edit-rule__lead-selector-header input {
            border: none;
            outline: none;
            font-size: 14px;
            color: #64748B;
            width: 100%;
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
            width: 180px;
          }

          .add-edit-rule__lead-selector {
            position: absolute;
            top: 0;
            right: 0;
            width: 214px;
            height: 276px;
            box-shadow: 0px 2px 6px 0px #0F172A29;
            border-radius: 8px;
            background: white;
          }

          .add-edit-rule__search input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 14px;
            color: #64748B;
            width: 130px;
          }

          .add-edit-rule__leads-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 12px;
          }

          .add-edit-rule__add-lead-mobile {
            display: inline;
          }
        
          .add-edit-rule__add-lead-desktop {
            display: none;
          }

          @media (min-width: 768px) {
            .add-edit-rule__add-lead-desktop {
              display: inline;
            }
            
            .add-edit-rule__add-lead-mobile {
              display: none;
            }

            .add-edit-rule__search {
              width: 220px;
            }

            .add-edit-rule__search input {
              width: 220px;
            }

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
            display: flex;
            flex-direction: column;
            height: 300px;
            overflow: auto;
          }

          .add-edit-rule__lead-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
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

          .add-edit-rule__error {
            color: #EF4444;
            font-size: 12px;
            margin-top: 4px;
            font-weight: 400;
            line-height: 16px;
          }
        `}</style>
      </div>
    </Modal>
  );
} 