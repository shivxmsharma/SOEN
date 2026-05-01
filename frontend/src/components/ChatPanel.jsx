import React, { useState, useEffect } from 'react'

const ChatPanel = ({ messages, message, setMessage, send, project, user, writeAiMessage, messageBoxRef, streamingMessage }) => {

    function scrollToBottom() {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, streamingMessage])

    return (
        <section className="flex flex-col h-full bg-transparent">
            <div className="conversation-area flex-grow flex flex-col min-h-0 relative">
                <div
                    ref={messageBoxRef}
                    className="message-box p-4 flex-grow flex flex-col gap-4 overflow-auto scrollbar-hide"
                >
                    {messages.map((msg, index) => {
                        const isUser = msg.sender?._id && user?._id && (msg.sender._id === user._id.toString() || msg.sender._id === user._id);
                        return (
                            <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-1.5 mb-1 px-1`}>
                                    <span className='text-[10px] font-bold uppercase tracking-widest text-[var(--ide-text-muted)]'>
                                        {msg.sender?._id === 'ai' ? 'AI Assistant' : isUser ? 'You' : msg.sender?.email?.split('@')[0]}
                                    </span>
                                </div>
                                <div className={`p-3 px-4 rounded-[8px] text-xs leading-relaxed transition-all ${
                                    msg.sender?._id === 'ai' 
                                        ? 'bg-[#0f172a] text-[var(--ide-text-active)] border border-[var(--ide-accent)]/30 max-w-[95%] shadow-sm' 
                                        : isUser 
                                            ? 'bg-[var(--ide-surface)] text-[var(--ide-text-active)] border border-[var(--ide-border)] max-w-[85%]' 
                                            : 'bg-transparent text-[var(--ide-text-secondary)] border border-[var(--ide-border)] max-w-[85%]'
                                }`}>
                                    {msg.sender?._id === 'ai' && (
                                        <div className="text-[10px] font-bold text-[var(--ide-accent)] mb-1 uppercase tracking-wider">@ai</div>
                                    )}
                                    {msg.sender?._id === 'ai' ?
                                        writeAiMessage(msg.message)
                                        : <p>{msg.message}</p>}
                                </div>
                            </div>
                        )
                    })}

                    {streamingMessage && (
                        <div className='flex flex-col items-start'>
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className='text-[10px] font-bold uppercase tracking-widest text-[var(--ide-text-muted)]'>AI Assistant</span>
                                <div className="w-1.5 h-1.5 bg-[var(--ide-accent)] rounded-full animate-pulse"></div>
                            </div>
                            <div className='p-3 px-4 rounded-[8px] text-xs bg-[#0f172a] text-[var(--ide-text-active)] border border-[var(--ide-accent)]/30 max-w-[95%] shadow-sm'>
                                <div className="text-[10px] font-bold text-[var(--ide-accent)] mb-1 uppercase tracking-wider">@ai</div>
                                {writeAiMessage(streamingMessage)}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-[var(--ide-surface)] border-t border-[var(--ide-border)] shrink-0">
                    <div className="relative group">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className='w-full bg-[var(--ide-bg)] text-[var(--ide-text-active)] p-3 px-4 pr-12 rounded-[8px] border border-[var(--ide-border)] outline-none text-xs focus:border-[var(--ide-accent)]/50 focus:ring-1 focus:ring-[var(--ide-accent)]/50 transition-all placeholder:text-[var(--ide-text-muted)] shadow-inner' 
                            type="text" 
                            placeholder='@ai or chat...' 
                            onKeyDown={(e) => e.key === 'Enter' && send()}
                        />
                        <button
                            onClick={send}
                            disabled={!message.trim()}
                            className='absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--ide-text-muted)] hover:text-[var(--ide-accent)] disabled:opacity-50 disabled:hover:text-[var(--ide-text-muted)] transition-colors rounded-[4px] hover:bg-[var(--ide-accent)]/10'
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ChatPanel

