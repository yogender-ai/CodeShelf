import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import NoteDetail from './pages/NoteDetail.jsx'
import Upload from './pages/Upload.jsx'
import MyContributions from './pages/MyContributions.jsx'
import Profile from './pages/Profile.jsx'
import TopicPage from './pages/TopicPage.jsx'
import Community from './pages/Community.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import LeetCode from './pages/LeetCode.jsx'
import Revision from './pages/Revision.jsx'
import EditNote from './pages/EditNote.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="note/:id" element={<NoteDetail />} />
        <Route path="upload" element={<Upload />} />
        <Route path="edit/:id" element={<EditNote />} />
        <Route path="my-contributions" element={<MyContributions />} />
        <Route path="profile" element={<Profile />} />
        <Route path="community" element={<Community />} />
        <Route path="leetcode" element={<LeetCode />} />
        <Route path="dsa" element={<TopicPage topic="DSA Notes" color="#8b5cf6" />} />
        <Route path="sql" element={<TopicPage topic="SQL Notes" color="#10b981" />} />
        <Route path="ml" element={<TopicPage topic="ML Notes" color="#3b82f6" />} />
        <Route path="nlp" element={<TopicPage topic="NLP Notes" color="#ec4899" />} />
        <Route path="concepts" element={<TopicPage topic="Concepts" color="#f59e0b" />} />
        <Route path="questions" element={<TopicPage topic="Questions" color="#ec4899" />} />
        <Route path="repos" element={<TopicPage topic="Repositories" color="#3b82f6" />} />
        <Route path="revise/:topic" element={<Revision />} />
      </Route>
    </Routes>
  )
}
