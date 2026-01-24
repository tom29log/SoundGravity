import { useStemPreloader } from '@/hooks/useStemPreloader'
import GlobalFeed from '@/components/feed/GlobalFeed'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <GlobalFeed />
    </main>
  )
}
