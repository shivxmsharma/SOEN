import React, { useState, useEffect } from 'react'

const ChatPanel = ({ messages, message, setMessage, send, isSidePanelOpen, setIsSidePanelOpen, project, user, writeAiMessage, messageBoxRef, setIsModalOpen, streamingMessage }) => {

    function scrollToBottom() {
        messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, streamingMessage])

    return (
        <section className="left relative flex flex-col h-screen w-96 max-w-full bg-slate-950 border-r border-slate-800 shadow-2xl z-20">
            <header className='flex justify-between items-center p-3 px-4 w-full bg-slate-900/50 backdrop-blur-md border-b border-slate-800 absolute z-10 top-0'>
                <button className='flex gap-2 items-center text-slate-400 hover:text-white transition-colors group' onClick={() => setIsModalOpen(true)}>
                    <i className="ri-user-add-line text-lg group-hover:scale-110 transition-transform"></i>
                    <p className='text-xs font-semibold uppercase tracking-wider'>Invite</p>
                </button>
                <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 text-slate-400 hover:text-white transition-colors'>
                    <i className="ri-group-line text-xl"></i>
                </button>
            </header>
            
            <div className="conversation-area pt-16 pb-14 flex-grow flex flex-col h-full relative overflow-hidden">
                <div
                    ref={messageBoxRef}
                    className="message-box p-4 flex-grow flex flex-col gap-3 overflow-auto max-h-full scrollbar-hide">
                    {messages.map((msg, index) => {
                        const isUser = msg.sender?._id && user?._id && (msg.sender._id === user._id.toString() || msg.sender._id === user._id);
                        return (
                            <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                <small className='opacity-65 text-[10px] mb-1 px-1 text-slate-400'>{msg.sender?.email || 'Anonymous'}</small>
                                <div className={`p-2 px-3 rounded-2xl text-sm shadow-sm ${msg.sender?._id === 'ai' ? 'bg-slate-800 text-slate-100 max-w-[85%] border border-slate-700' : isUser ? 'bg-blue-600 text-white max-w-[75%]' : 'bg-slate-700 text-slate-200 max-w-[75%]'}`}>
                                    {msg.sender?._id === 'ai' ?
                                        writeAiMessage(msg.message)
                                        : <p className='leading-relaxed'>{msg.message}</p>}
                                </div>
                            </div>
                        )
                    })}

                    {streamingMessage && (
                        <div className='flex flex-col items-start'>
                            <small className='opacity-65 text-[10px] mb-1 px-1 text-slate-400'>AI Assistant</small>
                            <div className='p-2 px-3 rounded-2xl text-sm shadow-sm bg-slate-800 text-slate-100 max-w-[85%] border border-slate-700'>
                                {writeAiMessage(streamingMessage)}
                            </div>
                        </div>
                    )}
                </div>

                <div className="inputField w-full flex p-3 bg-slate-800 border-t border-slate-700 absolute bottom-0 gap-2">
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className='bg-slate-900 text-slate-100 p-2 px-4 rounded-full border border-slate-700 outline-none flex-grow text-sm focus:border-blue-500 transition-colors' 
                        type="text" 
                        placeholder='Type a message... (@ai for help)' 
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                    />
                    <button
                        onClick={send}
                        className='p-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all flex items-center justify-center'>
                        <i className="ri-send-plane-2-fill text-lg"></i>
                    </button>
                </div>
            </div>

            <div className={`sidePanel w-full h-full flex flex-col bg-slate-800 absolute z-20 transition-all duration-300 ease-in-out ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
                <header className='flex justify-between items-center px-4 p-3 bg-slate-900 border-b border-slate-700'>
                    <h1 className='font-semibold text-slate-100'>Collaborators</h1>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-1 text-slate-400 hover:text-white'>
                        <i className="ri-close-line text-2xl"></i>
                    </button>
                </header>
                <div className="users flex flex-col gap-1 p-2 overflow-auto">
                    {project.users && project.users.map(u => (
                        <div key={u._id} className="user cursor-pointer hover:bg-slate-700/50 p-2 rounded-lg flex gap-3 items-center transition-colors">
                            <div className='w-8 h-8 rounded-full flex items-center justify-center text-white bg-blue-600 font-bold text-xs'>
                                {u.email ? u.email[0].toUpperCase() : '?'}
                            </div>
                            <h1 className='font-medium text-slate-200 text-sm'>{u.email}</h1>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ChatPanel

