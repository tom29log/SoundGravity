'use plain'
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const [username, setUsername] = useState('')

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        if (isLogin) {
            // Login Logic
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) {
                setError(error.message)
            } else {
                router.push('/admin')
            }
        } else {
            // Sign Up Logic
            const { error, data } = await supabase.auth.signUp({
                email,
                password,
                // options: { emailRedirectTo: `${location.origin}/auth/callback` } // Optional: Email confirmation
            })
            if (error) {
                setError(error.message)
            } else {
                // Insert Profile
                if (data.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert({
                            id: data.user.id,
                            username: username,
                            avatar_url: null, // Default empty
                        })

                    if (profileError) {
                        console.error('Profile creation failed:', profileError)
                        // Non-blocking, can retry later or ignore
                    }
                }

                if (data.user && !data.session) {
                    setMessage("Check your email for the confirmation link.")
                } else {
                    router.push('/admin') // If auto-confirm is on
                }
            }
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
            {/* Background Decor (Optional) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-50 pointer-events-none" />

            <style jsx global>{`
        @keyframes galaxy-move {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .galaxy-text {
            background-image: url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop');
            background-size: 200% auto;
            color: transparent;
            -webkit-background-clip: text;
            background-clip: text;
            animation: galaxy-move 20s ease infinite;
        }
      `}</style>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 w-full max-w-[85%] md:max-w-sm flex flex-col items-center text-center"
            >
                <h1 className="text-[13vw] md:text-9xl font-bold tracking-tighter mb-8 md:mb-12 drop-shadow-2xl leading-tight py-4 galaxy-text">
                    SoundGravity
                </h1>

                {/* Auth Container */}
                <div className="w-full space-y-6">
                    {/* Toggle Switch */}
                    <div className="flex p-1 bg-zinc-900/80 backdrop-blur-sm rounded-full border border-zinc-800 w-fit mx-auto shadow-inner">
                        <button
                            onClick={() => { setIsLogin(true); setError(null); }}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isLogin ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(null); }}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isLogin ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-3 md:space-y-4 w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? 'login' : 'signup'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-3 md:space-y-4"
                            >
                                {!isLogin && (
                                    <input
                                        type="text"
                                        required
                                        placeholder="Username (English/Numbers)"
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 md:py-3 text-sm md:text-base text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                )}
                                <input
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 md:py-3 text-sm md:text-base text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <input
                                    type="password"
                                    required
                                    placeholder="Password"
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 md:py-3 text-sm md:text-base text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </motion.div>
                        </AnimatePresence>

                        {error && <p className="text-red-500 text-xs md:text-sm">{error}</p>}
                        {message && <p className="text-green-500 text-xs md:text-sm">{message}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 md:py-3.5 bg-white text-black font-bold text-sm md:text-base rounded-xl hover:bg-zinc-200 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Enter' : 'Create Account')}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
