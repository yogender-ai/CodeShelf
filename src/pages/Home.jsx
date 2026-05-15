import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/client.js'
import BrowseTopics from '../components/home/BrowseTopics.jsx'
import HeroBanner from '../components/home/HeroBanner.jsx'
import RightSidebar from '../components/home/RightSidebar.jsx'
import TopNotes from '../components/home/TopNotes.jsx'
import { NoteGrid } from './Explore.jsx'

export default function Home() {
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    dashboardApi.get().then(setDashboard).catch(() => setDashboard(null))
  }, [])

  return (
    <div className="home-page">
      <div className="home-main">
        <HeroBanner />
        <BrowseTopics topics={dashboard?.topics} />
        {dashboard?.needsReview?.length > 0 && (
           <div style={{ marginBottom: '32px' }}>
              <div className="section-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2>Needs Review 🧠</h2>
                  <span style={{ fontSize: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--orange)', padding: '2px 8px', borderRadius: '12px' }}>Spaced Repetition</span>
                </div>
              </div>
              <NoteGrid notes={dashboard.needsReview} />
           </div>
        )}
        <TopNotes notes={dashboard?.topNotes} />
      </div>
      <RightSidebar dashboard={dashboard} />
    </div>
  )
}
