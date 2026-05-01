import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import { Code2, ArrowRight, AlertCircle } from 'lucide-react'

const Login = () => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    function submitHandler(e) {
        e.preventDefault()
        setError('')

        // Custom validation instead of native required
        if (!email.trim() || !password.trim()) {
            setError('Please fill out all fields to continue.')
            return
        }

        setIsLoading(true)

        axios.post('/users/login', {
            email,
            password
        }).then((res) => {
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            navigate('/')
        }).catch((err) => {
            setError(err.response?.data?.message || 'Invalid email or password.')
        }).finally(() => {
            setIsLoading(false)
        })
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] font-sans text-slate-300 relative selection:bg-white/20">
            {/* Extremely subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/[0.02] rounded-[100%] blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-[420px] px-6 sm:px-8 relative z-10 py-12">
                {/* Logo & Header */}
                <div className="flex flex-col items-center" style={{ marginBottom: '2.5rem' }}>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10 mb-6 shadow-2xl">
                        <Code2 size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-medium text-white tracking-tight text-center">
                        Welcome back
                    </h1>
                    <p className="text-slate-400 mt-3 text-base text-center">
                        Log in to your SOEN workspace.
                    </p>
                </div>

                {/* Custom Error Message */}
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400" style={{ marginBottom: '1.5rem' }}>
                        <AlertCircle size={20} />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Form (noValidate disables default browser tooltips) */}
                <form onSubmit={submitHandler} noValidate>
                    <div>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="w-full px-5 py-4 min-h-[56px] bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-xl text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all shadow-inner"
                            placeholder="Email address"
                        />
                    </div>

                    <div style={{ marginTop: '1.25rem' }}>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="w-full px-5 py-4 min-h-[56px] bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-xl text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all shadow-inner"
                            placeholder="Password"
                        />
                        <div className="flex justify-end mt-3">
                            <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
                                Forgot password?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ marginTop: '1.5rem' }}
                        className="w-full flex items-center justify-center gap-2 px-5 py-4 min-h-[56px] bg-white text-black rounded-xl text-lg font-medium hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/10"
                    >
                        {isLoading ? 'Signing in...' : 'Continue'}
                        {!isLoading && <ArrowRight size={20} />}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-16 text-center">
                    <p className="text-slate-500 text-lg">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-white font-medium hover:underline underline-offset-4">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login