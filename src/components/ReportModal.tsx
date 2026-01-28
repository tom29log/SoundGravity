'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface ReportModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    projectTitle: string
}

export default function ReportModal({ isOpen, onClose, projectId, projectTitle }: ReportModalProps) {
    const [reason, setReason] = useState('')
    const [details, setDetails] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const supabase = createClient()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert('로그인이 필요합니다.')
                return
            }

            const { error } = await supabase
                .from('reports')
                .insert({
                    project_id: projectId,
                    reporter_id: user.id,
                    reason,
                    details
                })

            if (error) throw error

            setSubmitted(true)
            setTimeout(() => {
                onClose()
                // Reset after closing
                setTimeout(() => {
                    setSubmitted(false)
                    setReason('')
                    setDetails('')
                }, 300)
            }, 2000)

        } catch (error) {
            console.error('Error submitting report:', error)
            alert('신고 접수 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {submitted ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">신고가 접수되었습니다</h3>
                        <p className="text-zinc-400 text-sm">관리자가 검토 후 조치할 예정입니다.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <AlertTriangle className="text-red-500" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">신고하기</h2>
                                <p className="text-xs text-zinc-400 truncate max-w-[200px]">{projectTitle}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">신고 사유</label>
                                <select
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-white outline-none"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>사유를 선택해주세요</option>
                                    <option value="copyright">저작권 침해</option>
                                    <option value="inappropriate">부적절한 콘텐츠</option>
                                    <option value="spam">스팸 또는 홍보성</option>
                                    <option value="other">기타</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">추가 내용 (선택)</label>
                                <textarea
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-white outline-none resize-none h-24"
                                    placeholder="상세 내용을 입력해주세요..."
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !reason}
                                className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        접수 중...
                                    </div>
                                ) : '신고하기'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
