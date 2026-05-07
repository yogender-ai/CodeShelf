import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/client.js'
import BrowseTopics from '../components/home/BrowseTopics.jsx'
import HeroBanner from '../components/home/HeroBanner.jsx'
import RightSidebar from '../components/home/RightSidebar.jsx'
import TopNotes from '../components/home/TopNotes.jsx'

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
        <TopNotes notes={dashboard?.topNotes} />
      </div>
      <RightSidebar dashboard={dashboard} />
    </div>
  )
}
