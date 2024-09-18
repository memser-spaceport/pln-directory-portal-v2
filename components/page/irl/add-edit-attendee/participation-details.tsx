import CustomCheckbox from '@/components/form/custom-checkbox';
import TextField from '@/components/form/text-field';

const ParticipationDetails = (props: any) => {
  const selectedGatherings = props?.selectedGatherings ?? [];
  const setSelectedGatherings = props?.setSelectedGatherings;

  const onHostSelectHandler = (selectedGathering: any) => {
    setSelectedGatherings((prev: any) => {
      const index = prev.findIndex((gathering: any) => gathering.uid === selectedGathering.uid);
      const id = 'id' + Math.random().toString(36).substr(2, 9) + Date.now();
      if (index !== -1) {
        const updatedGatherings = [...prev];
        if (selectedGathering.hostSubEvents.length > 0) {
          updatedGatherings[index] = { ...selectedGathering, hostSubEvents: [] };
        } else {
          updatedGatherings[index] = {
            ...selectedGathering,
            hostSubEvents: [...selectedGathering?.hostSubEvents, { uid: id, name: '', link: '' }],
          };
        }
        return updatedGatherings;
      }
      return prev;
    });
  };

  const onAddMoreHostClickHandler = (selectedGathering: any) => {
    setSelectedGatherings((prev: any) => {
      const index = prev.findIndex((gathering: any) => gathering.uid === selectedGathering.uid);

      if (index !== -1) {
        const updatedGatherings = [...prev];
        const id = 'id' + Math.random().toString(36).substr(2, 9) + Date.now();
        updatedGatherings[index] = {
          ...selectedGathering,
          hostSubEvents: [...selectedGathering.hostSubEvents, { uid: id, name: '', link: '' }],
        };
        return updatedGatherings;
      }
      return prev;
    });
  };

  const onDeleteHostSubEventsClickHandler = (selectedGathering: any, hostSubEvent: any) => {
    setSelectedGatherings((prev: any) => {
      const index = prev.findIndex((gathering: any) => gathering.uid === selectedGathering.uid);

      if (index !== -1) {
        const updatedGatherings = [...prev];

        const gatheringToUpdate = { ...updatedGatherings[index] };

        const updatedHostSubEvents = gatheringToUpdate.hostSubEvents.filter((event: any) => event.uid !== hostSubEvent.uid);

        gatheringToUpdate.hostSubEvents = updatedHostSubEvents;

        updatedGatherings[index] = gatheringToUpdate;

        return updatedGatherings;
      }

      return prev;
    });
  };

  const onHostSubEventFieldChangeHandler = (e: any, selectedGathering: any, hostSubEvent: any, field: any) => {
    setSelectedGatherings((prev: any) => {
      const index = prev.findIndex((gathering: any) => gathering.uid === selectedGathering.uid);
      if (index !== -1) {
        const updatedGatherings = [...prev];
        const updatedHostSubEvents = selectedGathering.hostSubEvents.map((event: any) => {
          if (event.uid === hostSubEvent.uid) {
            return { ...hostSubEvent, [field]: e.target.value };
          }
          return event;
        });
        updatedGatherings[index] = { ...selectedGathering, hostSubEvents: [...updatedHostSubEvents] };
        return updatedGatherings;
      }
      return prev;
    });
  };

  const onSpeakerSelectHandler = (selectedGathering: any) => {
    setSelectedGatherings((prev: any) => {
      const index = prev.findIndex((gathering: any) => gathering.uid === selectedGathering.uid);
      const id = 'id' + Math.random().toString(36).substr(2, 9) + Date.now();
      if (index !== -1) {
        const updatedGatherings = [...prev];
        if (selectedGathering.speakerSubEvents.length > 0) {
          updatedGatherings[index] = { ...selectedGathering, speakerSubEvents: [] };
        } else {
          updatedGatherings[index] = {
            ...selectedGathering,
            speakerSubEvents: [...selectedGathering?.speakerSubEvents, { uid: id, name: '', link: '' }],
          };
        }
        return updatedGatherings;
      }
      return prev;
    });
  };

  const onDeleteSpeakerSubEventsClickHandler = (selectedGathering: any, hostSubEvent: any) => {
    setSelectedGatherings((prev: any) => {
      const index = prev.findIndex((gathering: any) => gathering.uid === selectedGathering.uid);

      if (index !== -1) {
        const updatedGatherings = [...prev];

        const gatheringToUpdate = { ...updatedGatherings[index] };

        const updatedHostSubEvents = gatheringToUpdate.speakerSubEvents.filter((event: any) => event.uid !== hostSubEvent.uid);

        gatheringToUpdate.speakerSubEvents = updatedHostSubEvents;

        updatedGatherings[index] = gatheringToUpdate;

        return updatedGatherings;
      }

      return prev;
    });
  };

  const onSpeakerSubEventFieldChangeHandler = (e: any, selectedGathering: any, hostSubEvent: any, field: any) => {
    setSelectedGatherings((prev: any) => {
      const index = prev.findIndex((gathering: any) => gathering.uid === selectedGathering.uid);
      if (index !== -1) {
        const updatedGatherings = [...prev];
        const updatedHostSubEvents = selectedGathering.speakerSubEvents.map((event: any) => {
          if (event.uid === hostSubEvent.uid) {
            return { ...hostSubEvent, [field]: e.target.value };
          }
          return event;
        });
        updatedGatherings[index] = { ...selectedGathering, speakerSubEvents: [...updatedHostSubEvents] };
        return updatedGatherings;
      }
      return prev;
    });
  };

  const onAddMoreSpeakerClickHandler = (selectedGathering: any) => {
    setSelectedGatherings((prev: any) => {
      const index = prev.findIndex((gathering: any) => gathering.uid === selectedGathering.uid);

      if (index !== -1) {
        const updatedGatherings = [...prev];
        const id = 'id' + Math.random().toString(36).substr(2, 9) + Date.now();
        updatedGatherings[index] = {
          ...selectedGathering,
          speakerSubEvents: [...selectedGathering.speakerSubEvents, { uid: id, name: '', link: '' }],
        };
        return updatedGatherings;
      }
      return prev;
    });
  };

  return (
    <>
      <div className="ptndtls">
        <div className="ptndtls__ttl">
          <h2 className="ptndtls__ttl__txt">Are you hosting or speaking at any of these events?</h2>
        </div>

        <div className="ptndtls__cnt">
          <div className="ptndtls__cnt__header">
            <div className="ptndtls__cnt__header__lft">Name</div>

            <div className="ptndtls__cnt__header__rht">
              <div className="ptndtls__cnt__header__rht__hst">Host</div>

              <div className="ptndtls__cnt__header__rht__spkr">Speaker</div>
            </div>
          </div>

          <div className="ptndtls__cnt__pptdtls">
            {selectedGatherings?.map((selectedGathering: any, index: any) => (
              <div className="ptndtls__cnt__pptdtls__pptdtlcnt" key={`${selectedGathering.uid} + ${index}`}>
                <div
                  className={`ptndtls__cnt__pptdtls__pptdtl ${index > 0 ? 'bordert' : ''} ${
                    selectedGathering.hostSubEvents.length > 0 || selectedGathering.speakerSubEvents.length > 0 ? 'borderb' : ''
                  }`}
                >
                  <div className="ptndtls__cnt__pptdtls__pptdtl__rht">
                    <img alt="logo" src={selectedGathering?.logo?.cid} className="ptndtls__cnt__pptdtls__pptdtl__rht__logo" height={20} width={20} />
                    <span className="ptndtls__cnt__pptdtls__pptdtl__rht__nme">{selectedGathering?.name}</span>
                  </div>

                  <div className="ptndtls__cnt__pptdtls__pptdtl__lft">
                    <div className="ptndtls__cnt__pptdtls__pptdtl__lft__hst">
                      <CustomCheckbox name={`isHost-${selectedGathering.uid}`} value={'true'} disabled={false} onSelect={() => onHostSelectHandler(selectedGathering)} />
                      <span className="ptndtls__cnt__pptdtls__pptdtl__lft__hst__txt">HOST</span>
                    </div>

                    <div className="ptndtls__cnt__pptdtls__pptdtl__lft__spkr">
                      <CustomCheckbox name={`isSpeaker-${selectedGathering.uid}`} value={'true'} disabled={false} onSelect={() => onSpeakerSelectHandler(selectedGathering)} />
                      <span className="ptndtls__cnt__pptdtls__pptdtl__lft__spkr__txt">SPEAKER</span>
                    </div>
                  </div>
                </div>

                {selectedGathering.hostSubEvents.length > 0 && (
                  <div className="ptndtls__cnt__pptdtls__pptdtl__evntscnt">
                    <span className="ptndtls__cnt__pptdtls__pptdtl__evnts__subevnt__ttl">Enter event name in which you are host</span>

                    <div className="ptndtls__cnt__pptdtls__pptdtl__evnts">
                      {selectedGathering.hostSubEvents.map((hostSubEvent: any, index: any) => (
                        <div key={`${hostSubEvent.uid}`} className={`ptndtls__cnt__pptdtls__pptdtl__evnts__evnt`}>
                          <div className="ptndtls__cnt__pptdtls__pptdtl__evnts__evnt__nmecnt">
                            {index > 0 && (
                              <button
                                type="button"
                                className="ptndtls__cnt__pptdtls__pptdtl__evnts__evnt__nmecnt__dltbtn"
                                onClick={() => onDeleteHostSubEventsClickHandler(selectedGathering, hostSubEvent)}
                              >
                                <img src="/icons/delete.svg" height={16} width={16} />
                              </button>
                            )}
                            <TextField
                              onChange={(e) => onHostSubEventFieldChangeHandler(e, selectedGathering, hostSubEvent, 'name')}
                              isDelete={true}
                              type={'text'}
                              placeholder="Enver Event Name"
                              name={`hostSubEvent-${selectedGathering.uid}-${hostSubEvent.uid}-name`}
                              value={hostSubEvent.name}
                              id={''}
                              isMandatory
                              isError={hostSubEvent.name.trim() === '' ? true : false}
                            />
                          </div>

                          <div className="ptndtls__cnt__pptdtls__pptdtl__evnts__evnt__urlcnt">
                            <TextField
                              onChange={(e) => onHostSubEventFieldChangeHandler(e, selectedGathering, hostSubEvent, 'link')}
                              type={'text'}
                              placeholder="Enver URL"
                              name={`hostSubEvent-${selectedGathering.uid}-${hostSubEvent.uid}-link`}
                              value={hostSubEvent.link}
                              id={''}
                              isMandatory
                              isError={hostSubEvent.link.trim() === '' ? true : false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="ptndtls__cnt__pptdtls__pptdtl__evntscnt__addmrecnt" onClick={() => onAddMoreHostClickHandler(selectedGathering)}>
                      <img src="/icons/add.svg" height={16} width={16} />
                      <span className="ptndtls__cnt__pptdtls__pptdtl__evntscnt__addmrecnt__txt">Add more</span>
                    </button>
                  </div>
                )}

                {selectedGathering.speakerSubEvents.length > 0 && (
                  <div className="ptndtls__cnt__pptdtls__pptdtl__evntscnt">
                    <span className="ptndtls__cnt__pptdtls__pptdtl__evnts__subevnt__ttl">Enter event name in which you are speaking</span>

                    <div className="ptndtls__cnt__pptdtls__pptdtl__evnts">
                      {selectedGathering.speakerSubEvents.map((speakerSubEvent: any, index: any) => (
                        <div key={`${speakerSubEvent.uid}`} className={`ptndtls__cnt__pptdtls__pptdtl__evnts__evnt`}>
                          <div className="ptndtls__cnt__pptdtls__pptdtl__evnts__evnt__nmecnt">
                            {index > 0 && (
                              <button
                                type="button"
                                className="ptndtls__cnt__pptdtls__pptdtl__evnts__evnt__nmecnt__dltbtn"
                                onClick={() => onDeleteSpeakerSubEventsClickHandler(selectedGathering, speakerSubEvent)}
                              >
                                <img src="/icons/delete.svg" height={16} width={16} />
                              </button>
                            )}
                            <TextField
                              onChange={(e) => onSpeakerSubEventFieldChangeHandler(e, selectedGathering, speakerSubEvent, 'name')}
                              isDelete={true}
                              type={'text'}
                              placeholder="Enver Event Name"
                              name={`speakerSubEvent-${selectedGathering.uid}-${speakerSubEvent?.uid}-name`}
                              value={speakerSubEvent.name}
                              id={''}
                              isMandatory
                              isError={speakerSubEvent.name.trim() === '' ? true : false}
                            />
                          </div>

                          <div className="ptndtls__cnt__pptdtls__pptdtl__evnts__evnt__urlcnt">
                            <TextField
                              onChange={(e) => onSpeakerSubEventFieldChangeHandler(e, selectedGathering, speakerSubEvent, 'link')}
                              type={'text'}
                              placeholder="Enver URL"
                              name={`speakerSubEvent-${selectedGathering.uid}-${speakerSubEvent.uid}-link`}
                              value={speakerSubEvent.link}
                              id={''}
                              isMandatory
                              isError={speakerSubEvent.link.trim() === '' ? true : false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="ptndtls__cnt__pptdtls__pptdtl__evntscnt__addmrecnt" onClick={() => onAddMoreSpeakerClickHandler(selectedGathering)}>
                      <img src="/icons/add.svg" height={16} width={16} />
                      <span className="ptndtls__cnt__pptdtls__pptdtl__evntscnt__addmrecnt__txt">Add more</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .borderb {
          border-bottom: 1px solid #cbd5e1;
        }

        .bordert {
          border-top: 1px solid #cbd5e1;
        }
        .ptndtls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ptndtls__ttl__txt {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
        }

        .ptndtls__cnt {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
        }

        .ptndtls__cnt__header {
          display: flex;
          height: 26px;
          justify-content: space-between;
          border-bottom: 1px solid #cbd5e1;
          align-items: center;
        }

        .ptndtls__cnt__header__lft {
          padding: 0 12px;
          font-size: 10px;
          font-weight: 500;
          line-height: 20px;
        }

        .ptndtls__cnt__header__rht {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 500;
          line-height: 20px;
        }

        .ptndtls__cnt__header__rht__hst {
          width: 52px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #cbd5e1;
          border-left: 1px solid #cbd5e1;
        }

        .ptndtls__cnt__header__rht__spkr {
          width: 52px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ptndtls__cnt__pptdtls__pptdtl {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ptndtls__cnt__pptdtls__pptdtl__rht {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          gap: 4px;
          width: 60%;
        }

        .ptndtls__cnt__pptdtls__pptdtl__rht__nme {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ptndtls__cnt__pptdtls__pptdtl__lft {
          display: flex;
        }

        .ptndtls__cnt__pptdtls__pptdtl__lft__hst {
          padding: 8px 16px;
          width: 52px;
          border-right: 1px solid #cbd5e1;
          border-left: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .ptndtls__cnt__pptdtls__pptdtl__lft__spkr {
          padding: 8px 16px;
          width: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .ptndtls__cnt__pptdtls__pptdtl__lft__hst__txt {
          display: none;
        }

        .ptndtls__cnt__pptdtls__pptdtl__lft__spkr__txt {
          display: none;
        }

        .ptndtls__cnt__pptdtls__pptdtl__evnts {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 8px;
        }

        .ptndtls__cnt__pptdtls__pptdtl__evntscnt {
          padding: 12px 16px;
        }

        .ptndtls__cnt__pptdtls__pptdtl__evnts__evnt {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ptndtls__cnt__pptdtls__pptdtl__evnts__subevnt__ttl {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
        }

        .ptndtls__cnt__pptdtls__pptdtl__evntscnt__addmrecnt {
          margin-top: 8px;
          margin-bottom: 14px;
          background-color: inherit;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ptndtls__cnt__pptdtls__pptdtl__evntscnt__addmrecnt__txt {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #156ff7;
        }

        .ptndtls__cnt__pptdtls__pptdtl__evnts__evnt__nmecnt {
          position: relative;
        }

        .ptndtls__cnt__pptdtls__pptdtl__evnts__evnt__nmecnt__dltbtn {
          position: absolute;
          right: 12px;
          bottom: 0;
          top: 0;
          background-color: inherit;
        }

        .ptndtls__cnt__pptdtls__pptdtl__rht__logo {
          object-fit: cover;
        }

        @media (min-width: 1024px) {
          .ptndtls__cnt__header {
            display: none;
          }

          .ptndtls__cnt__pptdtls__pptdtl__lft__hst {
            width: unset;
          }
          .ptndtls__cnt__pptdtls__pptdtl__lft__spkr {
            width: unset;
          }

          .ptndtls__cnt__pptdtls__pptdtl__rht__nme {
            max-width: 300px;
          }

          .ptndtls__cnt__pptdtls__pptdtl__lft__hst__txt {
            font-size: 10px;
            font-weight: 400;
            line-height: 20px;
            display: unset;
          }

          .ptndtls__cnt__pptdtls__pptdtl__lft__spkr__txt {
            font-size: 10px;
            font-weight: 400;
            line-height: 20px;
            display: unset;
          }
        }
      `}</style>
    </>
  );
};

export default ParticipationDetails;
