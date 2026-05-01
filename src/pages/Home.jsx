import BrowseTopics from '../components/home/BrowseTopics.jsx'
import HeroBanner from '../components/home/HeroBanner.jsx'
import RightSidebar from '../components/home/RightSidebar.jsx'
import TopNotes from '../components/home/TopNotes.jsx'

export default function Home() {
  return (
    <div className="home-page">
      <div className="home-main">
        <HeroBanner />
        <BrowseTopics />
        <TopNotes />
      </div>
      <RightSidebar />
    </div>
  )
}
