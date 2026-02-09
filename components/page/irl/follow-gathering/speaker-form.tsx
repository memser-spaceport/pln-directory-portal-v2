'use client';
import React, { useState, useEffect } from 'react'
import { EVENTS } from '@/utils/constants';
import SpeakerRequestForm from './speaker-request-form';

interface ISpeakerFormProps {
    userInfo: any;
    eventLocationSummary: any;
    isLoggedIn: boolean;
}   

const SpeakerForm = (props: ISpeakerFormProps) => {
    const [isSpeakerFormOpen, setIsSpeakerFormOpen] = useState(false); 
    const isLoggedIn = props.isLoggedIn;
    const userInfo = props.userInfo;
    const eventLocationSummary = props.eventLocationSummary;

    useEffect(() => {
        document.addEventListener(EVENTS.OPEN_SPEAKER_REQUEST_POPUP, (e) => {
            setIsSpeakerFormOpen((e as any).detail.isOpen);
        });
        return () => {
            document.removeEventListener(EVENTS.OPEN_SPEAKER_REQUEST_POPUP, (e) => {
                setIsSpeakerFormOpen((e as any).detail.isOpen);
            });
        };
    }, []);

  return (
        isSpeakerFormOpen && (
            <SpeakerRequestForm userInfo={userInfo} eventLocationSummary={eventLocationSummary} isLoggedIn={isLoggedIn} onClose={() => setIsSpeakerFormOpen(false)} />
        )
    )
}

export default SpeakerForm
