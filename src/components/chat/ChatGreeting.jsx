export const ChatGreeting = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <img
        src="/blankspace-banner.png"
        alt="BlankSpace"
        style={{
          height: '48px',
          width: 'auto',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export default ChatGreeting;
