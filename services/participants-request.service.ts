export const validatePariticipantsEmail = async (emailid: string, participantType: string) => {
  const data = {
    uniqueIdentifier: emailid.trim(),
    participantType: participantType,
  };
  const result = await fetch(`${process.env.DIRECTORY_API_URL}/v1/participants-request/unique-identifier`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
        'Content-Type': 'application/json'
      }
  });
  if (!result.ok) {
    return {
      isError: true,
    };
  }
  const output = await result.json();
  if (output.isUniqueIdentifierExist || output.isRequestPending) {
    return {
      isValid: false,
    };
  } 

  return {
    isValid: true,
  };
};
