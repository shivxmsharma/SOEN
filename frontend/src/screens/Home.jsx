import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'
import { Code2, FolderGit2, Users, Plus, LogOut, Sparkles, X, ArrowRight } from 'lucide-react'

const Home = () => {

    const { user } = useContext(UserContext)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [projectName, setProjectName] = useState('')
    const [project, setProject] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        if (!projectName.trim()) return;

        setIsLoading(true)
        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                setIsModalOpen(false)
                setProjectName('')
                // Refresh project list
                setProject(prev => [...prev, res.data.project])
            })
            .catch((error) => {
                console.log(error)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }

    useEffect(() => {
        axios.get('/projects/all').then((res) => {
            setProject(res.data.projects)
        }).catch(err => {
            console.log(err)
        })
    }, [])

    return (
        <main className='min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-white/20 relative overflow-hidden'>
            {/* Extremely subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-white/[0.02] rounded-[100%] blur-[100px] pointer-events-none"></div>

            {/* Top Navigation - Stretched to extremes */}
            <header className="w-full border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                            <Code2 className="text-white" size={24} />
                        </div>
                        <span className="font-semibold text-2xl tracking-tighter text-white">SOEN</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-medium text-slate-400 hidden sm:block">{user?.email}</span>
                        </div>
                        <button 
                            onClick={() => {
                                localStorage.removeItem('token')
                                navigate('/login')
                            }}
                            className="text-slate-500 hover:text-white transition-colors p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5"
                            title="Logout"
                        >
                            <LogOut size={22} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-8 py-12 relative z-10">
                {/* Centered Hero Section */}
                <div className="text-center mb-24">
                    <h1 className="text-5xl md:text-7xl font-medium text-white tracking-tight mb-6">
                        Build <span className="text-slate-500 italic">together.</span>
                    </h1>
                    <p className="text-slate-400 text-xl max-w-lg mx-auto">
                        Manage and collaborate on your projects.
                    </p>
                </div>

                {/* Section Header - Extremes: Recent Workspaces (Left) / New Workspace (Right) */}
                <div className="flex items-center justify-between mb-12 pb-8 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <FolderGit2 size={24} className="text-white/60" />
                        </div>
                        <h2 className="text-2xl font-medium text-white tracking-tight">Recent Workspaces</h2>
                    </div>
                    
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-semibold transition-all hover:bg-slate-200 active:scale-95 shadow-2xl shadow-white/10 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        <span>New Workspace</span>
                    </button>
                </div>

                {/* Projects Grid */}
                <div>
                    {project.length === 0 ? (
                        <div className="text-center py-40 border border-white/5 rounded-[3rem] bg-white/[0.01]">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
                                <Sparkles size={32} className="text-slate-800" />
                            </div>
                            <h3 className="text-2xl font-medium text-slate-400">Your workspace is empty</h3>
                            <p className="text-slate-600 mt-3 mb-10 max-w-sm mx-auto">Create a new project to start building the future together.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-8 py-4 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-white transition-all font-medium"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {project.map((proj) => (
                                <div 
                                    key={proj._id}
                                    onClick={() => navigate(`/project/${proj._id}`, { state: { project: proj } })}
                                    className="group relative flex flex-col items-center text-center p-10 bg-white/[0.03] border border-white/10 rounded-[2.5rem] hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer overflow-hidden shadow-inner"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                        <Code2 size={32} className="text-white/60 group-hover:text-white transition-colors" />
                                    </div>
                                    
                                    <h3 className="text-xl font-medium text-white mb-2 w-full px-2 overflow-hidden text-ellipsis">
                                        {proj.name}
                                    </h3>
                                    
                                    <div className="flex items-center gap-2 mb-8">
                                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                            <Users size={14} className="text-slate-500" />
                                            <span className="text-xs font-medium text-slate-400">{proj.users?.length || 1} members</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto flex items-center gap-2 text-white/40 text-sm font-medium group-hover:text-white/60 transition-colors bg-white/5 px-5 py-2 rounded-xl border border-white/5">
                                        <span>Open Workspace</span>
                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-[#050505] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
                         {/* Modal Top Glow */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-white/[0.03] rounded-[100%] blur-2xl pointer-events-none"></div>

                        <div className="flex items-center justify-between p-8 border-b border-white/5 relative z-10">
                            <h2 className="text-xl font-medium text-white">New Workspace</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={createProject} className="p-10 relative z-10">
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-slate-400 mb-3">Workspace Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    autoFocus
                                    placeholder="e.g. Production Cluster"
                                    type="text" 
                                    className="w-full px-5 py-4 min-h-[56px] bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-white/30 transition-all shadow-inner text-base" 
                                    required 
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !projectName.trim()}
                                    className="w-full py-4 bg-white text-black rounded-xl text-base font-medium hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5"
                                >
                                    {isLoading ? 'Creating...' : 'Create Workspace'}
                                </button>
                                <button 
                                    type="button" 
                                    className="w-full py-3 text-sm font-medium text-slate-500 hover:text-white transition-colors" 
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Home