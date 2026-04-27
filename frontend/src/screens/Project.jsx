import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer'
import ChatPanel from '../components/ChatPanel'
import FileTree from '../components/FileTree'
import EditorPanel from '../components/EditorPanel'
import PreviewPanel from '../components/PreviewPanel'
import TerminalPanel from '../components/TerminalPanel'

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
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state?.project || null)
    const [message, setMessage] = useState('')
    const [streamingMessage, setStreamingMessage] = useState('')
    const { user } = useContext(UserContext)
    const messageBoxRef = useRef(null)

    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [runProcess, setRunProcess] = useState(null)
    const [terminalOutput, setTerminalOutput] = useState('')

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
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            setIsModalOpen(false)
        }).catch(err => console.log(err))
    }

    const send = () => {
        sendMessage('project-message', { message, sender: user })
        setMessages(prev => [...prev, { sender: user, message }])
        setMessage("")
    }

    function WriteAiMessage(message) {
        try {
            const messageObject = JSON.parse(message)
            return (
                <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
                    <Markdown
                        children={messageObject.text}
                        options={{ overrides: { code: SyntaxHighlightedCode } }}
                    />
                </div>
            )
        } catch {
            return <p>{message}</p>
        }
    }

    useEffect(() => {
        initializeSocket(projectId)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("container started")
            })
        }

        receiveMessage('ai-response-chunk', data => {
            setStreamingMessage(prev => prev + data.chunk)
        })

        receiveMessage('project-message', data => {
            if (data.sender?._id == 'ai') {
                setStreamingMessage('') // Clear streaming message
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
            <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl animate-pulse">Loading Project...</div>
            </div>
        )
    }

    return (
        <main className='h-screen w-screen flex'>
            <ChatPanel 
                messages={messages}
                message={message}
                setMessage={setMessage}
                send={send}
                isSidePanelOpen={isSidePanelOpen}
                setIsSidePanelOpen={setIsSidePanelOpen}
                project={project}
                user={user}
                writeAiMessage={WriteAiMessage}
                messageBoxRef={messageBoxRef}
                setIsModalOpen={setIsModalOpen}
                streamingMessage={streamingMessage}
            />

            <div className="vertical-separator w-px h-full bg-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10"></div>

            <section className="right bg-slate-900 flex-grow h-full flex min-w-0 overflow-hidden">
                <FileTree 
                    fileTree={fileTree}
                    setCurrentFile={setCurrentFile}
                    setOpenFiles={setOpenFiles}
                    openFiles={openFiles}
                    currentFile={currentFile}
                />

                <div className="main-editor-area flex flex-col flex-grow h-full min-w-0">
                    <div className="upper flex-grow flex min-h-0 border-b border-slate-700">
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
                        <PreviewPanel 
                            iframeUrl={iframeUrl}
                            setIframeUrl={setIframeUrl}
                            webContainer={webContainer}
                        />
                    </div>
                    <div className="lower h-56 min-h-40">
                        <TerminalPanel terminalOutput={terminalOutput} />
                    </div>
                </div>
            </section>


            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-96 max-w-full relative shadow-2xl">
                        <header className='flex justify-between items-center mb-6'>
                            <h2 className='text-xl font-bold text-slate-100'>Add Collaborators</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2 text-slate-400 hover:text-white transition-colors'>
                                <i className="ri-close-line text-2xl"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-8 max-h-80 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {users.map(u => (
                                <div 
                                    key={u._id} 
                                    className={`user cursor-pointer hover:bg-slate-800 p-3 rounded-xl flex gap-3 items-center transition-all ${Array.from(selectedUserId).indexOf(u._id) != -1 ? 'bg-slate-800 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`} 
                                    onClick={() => handleUserClick(u._id)}
                                >
                                    <div className='w-10 h-10 rounded-full flex items-center justify-center text-white bg-blue-600 font-bold'>
                                        {u.email ? u.email[0].toUpperCase() : '?'}
                                    </div>
                                    <h1 className='font-medium text-slate-200 truncate'>{u.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]'>
                            Invite Selected
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project
