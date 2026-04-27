import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer'
import ChatPanel from '../components/ChatPanel'
import FileTree from '../components/FileTree'
import EditorPanel from '../components/EditorPanel'
import PreviewPanel from '../components/PreviewPanel'

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
    const location = useLocation()
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state.project)
    const [message, setMessage] = useState('')
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
        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("container started")
            })
        }

        receiveMessage('project-message', data => {
            if (data.sender._id == 'ai') {
                const message = JSON.parse(data.message)
                webContainer?.mount(message.fileTree)
                if (message.fileTree) {
                    setFileTree(message.fileTree || {})
                }
            }
            setMessages(prev => [...prev, data])
        })

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => console.log(err))
    }, [])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => console.log(res.data)).catch(err => console.log(err))
    }

    const runProject = async () => {
        await webContainer.mount(fileTree)
        const installProcess = await webContainer.spawn("npm", ["install"])
        installProcess.output.pipeTo(new WritableStream({
            write(chunk) { console.log(chunk) }
        }))

        if (runProcess) {
            runProcess.kill()
        }

        let tempRunProcess = await webContainer.spawn("npm", ["start"]);
        tempRunProcess.output.pipeTo(new WritableStream({
            write(chunk) { console.log(chunk) }
        }))

        setRunProcess(tempRunProcess)

        webContainer.on('server-ready', (port, url) => {
            setIframeUrl(url)
        })
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
            />

            <section className="right bg-red-50 flex-grow h-full flex">
                <FileTree 
                    fileTree={fileTree}
                    setCurrentFile={setCurrentFile}
                    setOpenFiles={setOpenFiles}
                    openFiles={openFiles}
                />

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
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(u => (
                                <div key={u._id} className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).indexOf(u._id) != -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(u._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{u.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project