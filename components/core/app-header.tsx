'use client';

function AppHeader() {
  const onMemberRegister = () => {
    console.log('on click')
    document.dispatchEvent(new CustomEvent('open-member-register-dialog', {detail: ''}));
  };
  return (
    <>
      <button onClick={onMemberRegister}>Member Register</button>
    </>
  );
}

export default AppHeader;
