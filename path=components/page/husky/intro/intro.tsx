                <div className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}> 

      <style jsx>{`
        .message.user {
          background-color: #f5f5f5;
          align-self: flex-end;
        }

        .message.assistant {
          background-color: #f0f7ff;
          align-self: flex-start;
        }
      `}</style> 