'use client';

import { useState } from 'react';
import { mockTemplateItems, mockTemplatePage } from './mocks';
import s from './TemplatePrototype.module.scss';

export default function TemplatePrototype() {
  const [items, setItems] = useState(mockTemplateItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = items.find((item) => item.id === selectedId);

  const handleToggleStatus = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: item.status === 'active' ? 'pending' : 'active' } : item,
      ),
    );
  };

  return (
    <div className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>{mockTemplatePage.title}</h1>
        <p className={s.description}>{mockTemplatePage.description}</p>
      </header>

      <div className={s.layout}>
        <section className={s.list}>
          <h2 className={s.sectionTitle}>Mock list</h2>
          <ul className={s.cards}>
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${s.card} ${selectedId === item.id ? s.cardSelected : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className={s.cardName}>{item.name}</span>
                  <span className={s.badge}>{item.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={s.detail}>
          <h2 className={s.sectionTitle}>Mock detail</h2>
          {selected ? (
            <div className={s.panel}>
              <p className={s.detailLabel}>Selected item</p>
              <p className={s.detailValue}>{selected.name}</p>
              <button type="button" className={s.action} onClick={() => handleToggleStatus(selected.id)}>
                Toggle status
              </button>
            </div>
          ) : (
            <p className={s.empty}>Select an item to preview local state updates.</p>
          )}
        </section>
      </div>
    </div>
  );
}
