import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; 
import { getWebContainer } from '../config/webcontainer'
import ChatPanel from '../components/ChatPanel'
import FileTree from '../components/FileTree'
import EditorPanel from '../components/EditorPanel'
import PreviewPanel from '../components/PreviewPanel'
import TerminalPanel from '../components/TerminalPanel'
import { Code2, FolderGit2, Users, MessageSquare, Globe, ChevronRight, X, Play, Settings, Terminal as TerminalIcon, Search, LayoutPanelLeft, PanelBottom, UserPlus } from 'lucide-react'

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}

const Project = () => {
    const { projectId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    
    const [activeTab, setActiveTab] = useState('explorer') 
    const [isSideBarOpen, setIsSideBarOpen] = useState(true)
    const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    
    const [project, setProject] = useState(location.state?.project || null)
    const { user } = useContext(UserContext)
    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [runProcess, setRunProcess] = useState(null)
    const [terminalOutput, setTerminalOutput] = useState('')
    const [message, setMessage] = useState('')
    const [streamingMessage, setStreamingMessage] = useState('')
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const messageBoxRef = useRef(null)

    const handleUserClick = (id) => {
        setSelectedUserId(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }

    const addCollaborators = () => {
        axios.put("/projects/add-user", {
            projectId: project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            setIsModalOpen(false)
            axios.get(`/projects/get-project/${projectId}`).then(res => setProject(res.data.project))
        }).catch(err => console.log(err))
    }

    const send = () => {
        if (!message.trim()) return;
        sendMessage('project-message', { message, sender: user })
        setMessages(prev => [...prev, { sender: user, message }])
        setMessage("")
    }

    function WriteAiMessage(message) {
        try {
            const messageObject = JSON.parse(message)
            return (
                <div className='flex flex-col gap-2'>
                    <div className='overflow-auto text-[var(--ide-text-secondary)]'>
                        <Markdown
                            children={messageObject.text}
                            options={{ overrides: { code: SyntaxHighlightedCode } }}
                        />
                    </div>
                    {messageObject.fileTree && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-medium w-fit shadow-sm shadow-green-500/5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            {Object.keys(messageObject.fileTree).length} files updated · filetree synced
                        </div>
                    )}
                </div>
            )
        } catch {
            return <p className="leading-relaxed">{message}</p>
        }
    }

    useEffect(() => {
        window.hljs = hljs;
        initializeSocket(projectId)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
            })
        }

        receiveMessage('ai-response-chunk', data => {
            setStreamingMessage(prev => prev + data.chunk)
        })

        receiveMessage('project-message', data => {
            if (data.sender?._id == 'ai') {
                setStreamingMessage('')
                const message = JSON.parse(data.message)
                webContainer?.mount(message.fileTree)
                if (message.fileTree) {
                    setFileTree(message.fileTree || {})
                }
            }
            setMessages(prev => [...prev, data])
        })

        receiveMessage('project-update', data => {
            setFileTree(data.fileTree || {})
            webContainer?.mount(data.fileTree || {})
        })

        axios.get(`/projects/get-project/${projectId}`).then(res => {
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => console.log(err))
    }, [projectId])

    function saveFileTree(ft) {
        sendMessage('project-update', {
            projectId: project._id,
            fileTree: ft
        })
    }

    const runProject = async () => {
        setTerminalOutput('\x1b[33mStarting project...\x1b[0m\r\n')
        await webContainer.mount(fileTree)
        
        setTerminalOutput(prev => prev + '\x1b[36mRunning npm install...\x1b[0m\r\n')
        const installProcess = await webContainer.spawn("npm", ["install"])
        installProcess.output.pipeTo(new WritableStream({
            write(chunk) { setTerminalOutput(prev => prev + chunk) }
        }))

        await installProcess.exit;

        if (runProcess) {
            runProcess.kill()
        }

        setTerminalOutput(prev => prev + '\x1b[36mRunning npm start...\x1b[0m\r\n')
        let tempRunProcess = await webContainer.spawn("npm", ["start"]);
        tempRunProcess.output.pipeTo(new WritableStream({
            write(chunk) { setTerminalOutput(prev => prev + chunk) }
        }))

        setRunProcess(tempRunProcess)

        webContainer.on('server-ready', (port, url) => {
            setTerminalOutput(prev => prev + `\x1b[32mServer ready at ${url}\x1b[0m\r\n`)
            setIframeUrl(url)
        })
    }

    if (!project) {
        return (
            <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <div className="text-slate-500 font-medium tracking-widest uppercase text-xs">Initializing Workspace</div>
            </div>
        )
    }

    return (
        <main className='h-screen w-screen flex flex-col bg-[var(--ide-bg)] text-[var(--ide-text-secondary)] overflow-hidden font-sans selection:bg-[var(--ide-accent)]/20'>
            {/* Top Titlebar */}
            <header className="h-[38px] border-b border-[var(--ide-border)] bg-[var(--ide-bg)] flex items-center justify-between px-4 z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer text-[var(--ide-text-active)]" onClick={() => navigate('/')}>
                        <Code2 size={16} className="text-[var(--ide-accent)]" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">SOEN</span>
                    </div>
                    <div className="w-px h-4 bg-[var(--ide-border)]"></div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--ide-text-muted)]">
                        <span className="hover:text-[var(--ide-text-active)] cursor-pointer">{project.name}</span>
                        {currentFile && (
                            <>
                                <ChevronRight size={14} />
                                <span className="text-[var(--ide-text-active)]">{currentFile}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Collaborator Avatars */}
                    <div className="flex items-center -space-x-2 mr-2">
                        {project.users && project.users.slice(0, 3).map((u, i) => (
                            <div key={u._id || i} title={u.email} className="relative w-6 h-6 rounded-full bg-[var(--ide-surface)] border border-[var(--ide-border)] flex items-center justify-center text-[9px] font-bold text-[var(--ide-text-active)] z-10 hover:z-20 hover:-translate-y-0.5 transition-transform cursor-pointer">
                                {u.email ? u.email[0].toUpperCase() : '?'}
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[var(--ide-surface)]"></div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-[4px] border border-[var(--ide-border)] text-[var(--ide-text-secondary)] text-[11px] font-medium hover:bg-[var(--ide-surface)] hover:text-[var(--ide-text-active)] transition-all"
                    >
                        <UserPlus size={12} />
                        Invite
                    </button>
                    <button 
                        onClick={runProject}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-green-600/10 text-green-500 border border-green-500/20 text-[11px] font-medium hover:bg-green-600/20 hover:text-green-400 transition-all"
                    >
                        <Play size={12} className="fill-current" />
                        Run
                    </button>
                </div>
            </header>

            {/* Main Flex Area */}
            <div className="flex-grow flex min-h-0 bg-[var(--ide-bg)]">
                {/* Activity Bar */}
                <aside className="w-[40px] shrink-0 border-r border-[var(--ide-border)] bg-[var(--ide-surface)] flex flex-col items-center py-4 gap-4 z-40">
                    <button 
                        onClick={() => { setActiveTab('explorer'); setIsSideBarOpen(true); }}
                        className={`p-2 rounded-md transition-all ${activeTab === 'explorer' ? 'bg-[var(--ide-accent)]/10 text-[var(--ide-accent)]' : 'text-[var(--ide-text-muted)] hover:text-[var(--ide-text-active)]'}`}
                    >
                        <FolderGit2 size={20} strokeWidth={activeTab === 'explorer' ? 2 : 1.5} />
                    </button>
                    <button 
                        onClick={() => { setActiveTab('chat'); setIsSideBarOpen(true); }}
                        className={`p-2 rounded-md transition-all ${activeTab === 'chat' ? 'bg-[var(--ide-accent)]/10 text-[var(--ide-accent)]' : 'text-[var(--ide-text-muted)] hover:text-[var(--ide-text-active)]'}`}
                    >
                        <MessageSquare size={20} strokeWidth={activeTab === 'chat' ? 2 : 1.5} />
                    </button>
                    <button 
                        onClick={() => { setActiveTab('users'); setIsSideBarOpen(true); }}
                        className={`p-2 rounded-md transition-all ${activeTab === 'users' ? 'bg-[var(--ide-accent)]/10 text-[var(--ide-accent)]' : 'text-[var(--ide-text-muted)] hover:text-[var(--ide-text-active)]'}`}
                    >
                        <Users size={20} strokeWidth={activeTab === 'users' ? 2 : 1.5} />
                    </button>
                    <div className="mt-auto flex flex-col gap-4 mb-2">
                        <button className="p-2 text-[var(--ide-text-muted)] hover:text-[var(--ide-text-active)] transition-colors">
                            <Search size={20} strokeWidth={1.5} />
                        </button>
                        <button className="p-2 text-[var(--ide-text-muted)] hover:text-[var(--ide-text-active)] transition-colors">
                            <Settings size={20} strokeWidth={1.5} />
                        </button>
                    </div>
                </aside>

                {/* Left Sidebar (Explorer/Chat/Users) */}
                {isSideBarOpen && (
                    <aside className={`shrink-0 border-r border-[var(--ide-border)] bg-[var(--ide-surface)] flex flex-col overflow-hidden ${activeTab === 'explorer' ? 'w-[180px]' : 'w-[240px]'}`}>
                        <header className="h-[32px] flex items-center justify-between px-3 border-b border-[var(--ide-border)] shrink-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ide-text-muted)]">
                                {activeTab === 'explorer' ? 'Explorer' : activeTab === 'chat' ? 'AI Assistant' : 'Collaborators'}
                            </span>
                            <button onClick={() => setIsSideBarOpen(false)} className="text-[var(--ide-text-muted)] hover:text-[var(--ide-text-active)] transition-colors">
                                <X size={14} />
                            </button>
                        </header>
                        
                        <div className="flex-grow overflow-auto">
                            {activeTab === 'explorer' && (
                                <FileTree 
                                    fileTree={fileTree}
                                    setCurrentFile={setCurrentFile}
                                    setOpenFiles={setOpenFiles}
                                    openFiles={openFiles}
                                    currentFile={currentFile}
                                />
                            )}
                            {activeTab === 'chat' && (
                                <ChatPanel 
                                    messages={messages}
                                    message={message}
                                    setMessage={setMessage}
                                    send={send}
                                    project={project}
                                    user={user}
                                    writeAiMessage={WriteAiMessage}
                                    messageBoxRef={messageBoxRef}
                                    streamingMessage={streamingMessage}
                                />
                            )}
                            {activeTab === 'users' && (
                                <div className="p-3 flex flex-col gap-1">
                                    {project.users && project.users.map(u => (
                                        <div key={u._id} className="group cursor-pointer hover:bg-[var(--ide-border)] p-2 rounded-[6px] flex gap-2 items-center transition-all">
                                            <div className='w-6 h-6 rounded-[4px] flex items-center justify-center text-[var(--ide-text-active)] bg-[var(--ide-bg)] border border-[var(--ide-border)] font-bold text-[10px] group-hover:bg-[var(--ide-accent)] transition-all'>
                                                {u.email ? u.email[0].toUpperCase() : '?'}
                                            </div>
                                            <h1 className='font-medium text-[var(--ide-text-secondary)] group-hover:text-[var(--ide-text-active)] text-xs truncate'>{u.email}</h1>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                {/* Center Column: Editor + Terminal */}
                <div className="flex-grow flex flex-col min-w-0 relative z-10 bg-[var(--ide-bg)]">
                    <div className="flex-grow flex flex-col min-h-0 relative">
                        <EditorPanel 
                            openFiles={openFiles}
                            currentFile={currentFile}
                            setCurrentFile={setCurrentFile}
                            fileTree={fileTree}
                            setFileTree={setFileTree}
                            saveFileTree={saveFileTree}
                            runProject={runProject}
                            webContainer={webContainer}
                        />
                    </div>

                    {isBottomPanelOpen && (
                        <div className="h-[120px] shrink-0 border-t border-[var(--ide-border)] bg-[var(--ide-terminal)] flex flex-col relative z-20">
                            <header className="h-[32px] border-b border-[var(--ide-border)] flex items-center px-3 gap-4 shrink-0">
                                <button className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ide-text-active)] border-b-2 border-[var(--ide-accent)] h-full px-1">
                                    <TerminalIcon size={12} />
                                    Terminal
                                </button>
                                <button className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ide-text-muted)] h-full px-1 hover:text-[var(--ide-text-secondary)]">
                                    Output
                                </button>
                                <button className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ide-text-muted)] h-full px-1 hover:text-[var(--ide-text-secondary)]">
                                    Problems
                                </button>
                                <button onClick={() => setIsBottomPanelOpen(false)} className="ml-auto text-[var(--ide-text-muted)] hover:text-[var(--ide-text-active)]">
                                    <X size={14} />
                                </button>
                            </header>
                            <div className="flex-grow overflow-hidden relative">
                                <TerminalPanel terminalOutput={terminalOutput} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel (AI Chat / Preview) */}
                <div className="w-[220px] shrink-0 border-l border-[var(--ide-border)] bg-[var(--ide-surface)] flex flex-col relative z-10">
                    <header className="h-[32px] border-b border-[var(--ide-border)] flex items-center px-3 gap-2 shrink-0 justify-between">
                        <div className="flex items-center gap-2">
                            <Globe size={12} className="text-[var(--ide-text-muted)]" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ide-text-secondary)]">Preview</span>
                        </div>
                    </header>
                    <PreviewPanel 
                        iframeUrl={iframeUrl}
                        setIframeUrl={setIframeUrl}
                        webContainer={webContainer}
                    />
                </div>
            </div>

            {/* Status Bar */}
            <footer className="h-[20px] shrink-0 bg-[var(--ide-status)] flex items-center justify-between px-3 text-[10px] font-medium text-white/80 z-50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                        <span>Ready</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
                        <FolderGit2 size={10} />
                        <span>main*</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
                        <Users size={10} />
                        <span>{project.users ? project.users.length : 0} collaborators</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span>UTF-8</span>
                    <span>JavaScript</span>
                    <span>Ln 11 Col 1</span>
                    <div className="flex items-center gap-1.5 ml-1">
                        <LayoutPanelLeft size={10} className="hover:text-white cursor-pointer" onClick={() => setIsSideBarOpen(!isSideBarOpen)} />
                        <PanelBottom size={10} className="hover:text-white cursor-pointer" onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)} />
                    </div>
                </div>
            </footer>

            {/* Invite Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
                    <div className="bg-[var(--ide-surface)] border border-[var(--ide-border)] p-6 rounded-[8px] w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-200">
                        <header className='flex justify-between items-center mb-6 relative z-10'>
                            <h2 className='text-sm font-semibold text-[var(--ide-text-active)] tracking-tight'>Invite Collaborators</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-1.5 text-[var(--ide-text-muted)] hover:text-[var(--ide-text-active)] transition-colors hover:bg-[var(--ide-border)] rounded-[4px]'>
                                <X size={16} />
                            </button>
                        </header>
                        <div className="flex flex-col gap-1.5 mb-6 max-h-60 overflow-auto pr-1 relative z-10">
                            {users.map(u => (
                                <div 
                                    key={u._id} 
                                    className={`group cursor-pointer p-2.5 rounded-[6px] flex gap-3 items-center transition-all border ${selectedUserId.has(u._id) ? 'bg-[var(--ide-accent)]/10 border-[var(--ide-accent)]' : 'bg-[var(--ide-bg)] border-[var(--ide-border)] hover:border-[var(--ide-text-muted)]'}`} 
                                    onClick={() => handleUserClick(u._id)}
                                >
                                    <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center font-bold text-xs transition-colors ${selectedUserId.has(u._id) ? 'bg-[var(--ide-accent)] text-white' : 'bg-[var(--ide-surface)] border border-[var(--ide-border)] text-[var(--ide-text-secondary)] group-hover:text-[var(--ide-text-active)]'}`}>
                                        {u.email ? u.email[0].toUpperCase() : '?'}
                                    </div>
                                    <h1 className={`font-medium text-xs truncate ${selectedUserId.has(u._id) ? 'text-[var(--ide-accent)]' : 'text-[var(--ide-text-secondary)] group-hover:text-[var(--ide-text-active)]'}`}>{u.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            disabled={selectedUserId.size === 0}
                            className='w-full py-2 bg-[var(--ide-accent)] text-white rounded-[4px] text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 relative z-10'>
                            Send Invitations
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project