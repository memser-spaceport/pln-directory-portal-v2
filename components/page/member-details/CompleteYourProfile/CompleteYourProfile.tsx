'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useProfileOnboardingStatus } from '@/services/members/hooks/useProfileOnboardingStatus';
import { ProfileOnboardingStep } from '@/services/members/types';
import { SuccessCircleIcon } from '@/components/icons/SuccessCircleIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { StepCard } from './StepCard';
import s from './CompleteYourProfile.module.scss';

interface Props {
  memberId: string;
  onActionClick?: (actionType: string) => void;
}

function getCollapseKey(memberId: string) {
  return `profile-onboarding-collapsed-${memberId}`;
}

function getStepVariant(step: ProfileOnboardingStep, firstPendingIndex: number, index: number): 'done' | 'active' | 'pending' {
  if (step.state === 'done') return 'done';
  if (index === firstPendingIndex) return 'active';
  return 'pending';
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CompleteYourProfile({ memberId, onActionClick }: Props) {
  const { data, isLoading, isError } = useProfileOnboardingStatus(memberId);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(getCollapseKey(memberId)) === 'true';
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const prevActionStatesRef = useRef<Map<string, string> | null>(null);
  const [recentlyCompletedActions, setRecentlyCompletedActions] = useState<Set<string>>(new Set());
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Detect pending → done transitions and trigger scroll + animation
  useEffect(() => {
    if (!data) return;

    const currentStates = new Map<string, string>();
    for (const step of data.steps) {
      for (const action of step.actions) {
        currentStates.set(action.type, action.state);
      }
    }

    const prev = prevActionStatesRef.current;
    if (prev) {
      const newlyDone = new Set<string>();
      for (const [type, state] of currentStates) {
        if (state === 'done' && prev.get(type) === 'pending') {
          newlyDone.add(type);
        }
      }

      if (newlyDone.size > 0) {
        // Expand if collapsed so animation is visible
        setCollapsed(false);

        // Clear any pending timeout from a previous animation cycle
        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
        }

        setRecentlyCompletedActions(newlyDone);

        // Scroll to banner after a brief tick so DOM can update (expand)
        requestAnimationFrame(() => {
          rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        clearTimeoutRef.current = setTimeout(() => {
          setRecentlyCompletedActions(new Set());
        }, 5500);
      }
    }

    prevActionStatesRef.current = currentStates;
  }, [data]);

  useEffect(() => {
    localStorage.setItem(getCollapseKey(memberId), String(collapsed));
  }, [collapsed, memberId]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  if (isLoading || isError || !data) {
    return null;
  }

  const { steps } = data;
  const completedCount = steps.filter((step) => step.state === 'done').length;
  const totalCount = steps.length;
  const allDone = completedCount === totalCount;

  if (allDone) {
    return (
      <div ref={rootRef} className={s.successRoot}>
        <SuccessCircleIcon style={{ color: '#16a34a', width: 24, height: 24, flexShrink: 0 }} />
        <span className={s.successText}>Profile setup complete!</span>
        <button type="button" className={s.headerButton} onClick={toggleCollapsed} style={{ marginLeft: 'auto' }}>
          <CloseIcon />
        </button>
      </div>
    );
  }

  const firstPendingIndex = steps.findIndex((step) => step.state === 'pending');

  return (
    <div ref={rootRef} className={s.root}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.title}>Complete setting up your profile</span>
          <span className={s.progressText}>
            &middot; <span className={s.progressCount}>{completedCount} of {totalCount} steps</span> completed
          </span>
        </div>
        <button type="button" className={s.headerButton} onClick={toggleCollapsed}>
          {collapsed ? <ChevronDownIcon /> : <CloseIcon />}
        </button>
      </div>

      {!collapsed && (
        <div className={s.stepsRow}>
          {steps.map((step, index) => (
            <StepCard
              key={step.type}
              step={step}
              variant={getStepVariant(step, firstPendingIndex, index)}
              onActionClick={onActionClick}
              recentlyCompletedActions={recentlyCompletedActions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
