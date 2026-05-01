export const currentUser = {
  name: 'Aniket Singh',
  role: 'Contributor',
  email: 'aniket@example.com',
  contributions: 23,
  views: '1.5k',
  likes: 342,
}

export const topics = [
  { id: 1, name: 'Data Structures', notes: 1245, icon: 'Box', color: '#8b5cf6' },
  { id: 2, name: 'Algorithms', notes: 986, icon: 'Code', color: '#3b82f6' },
  { id: 3, name: 'SQL', notes: 732, icon: 'Database', color: '#10b981' },
  { id: 4, name: 'Dynamic Programming', notes: 423, icon: 'TrendingUp', color: '#f59e0b' },
  { id: 5, name: 'System Design', notes: 312, icon: 'Settings', color: '#ec4899' },
  { id: 6, name: 'Computer Networks', notes: 278, icon: 'Globe', color: '#06b6d4' },
]

export const topNotes = [
  {
    id: 1,
    title: 'Dynamic Programming - Complete Guide',
    description: 'A comprehensive guide to dynamic programming with examples and problem sets from beginner to advanced level.',
    tags: ['DP', 'Algorithms', 'C++'],
    author: 'Aditya Verma',
    timeAgo: '2 days ago',
    views: '1.2k',
    likes: 132,
    featured: true,
    repo: 'github.com/adityaverma/dp',
    stars: 89,
    forks: 21,
    repoUpdated: '2 days ago',
    color: '#8b5cf6',
    icon: 'Code',
  },
  {
    id: 2,
    title: 'SQL Joins Explained with Examples',
    description: 'Detailed explanation of inner, left, right, full, and self joins with practical interview examples.',
    tags: ['SQL', 'Database'],
    author: 'Neha Gupta',
    timeAgo: '3 days ago',
    views: '950',
    likes: 112,
    repo: 'github.com/nehagupta/sql-notes',
    stars: 76,
    forks: 18,
    repoUpdated: '3 days ago',
    color: '#10b981',
    icon: 'Database',
  },
  {
    id: 3,
    title: 'Top 100 Array Questions',
    description: 'A curated list of high-signal array questions asked in coding interviews, grouped by pattern.',
    tags: ['Arrays', 'DSA', 'Interview'],
    author: 'Rohit Yadav',
    timeAgo: '5 days ago',
    views: '1.1k',
    likes: 98,
    repo: 'github.com/rohityadav/arrays',
    stars: 64,
    forks: 13,
    repoUpdated: '5 days ago',
    color: '#f59e0b',
    icon: 'FileText',
  },
]

export const contributionStats = {
  notesPublished: 8,
  views: 620,
  likes: 120,
  reposAdded: 3,
}

export const recentActivity = [
  { id: 1, type: 'like', text: 'Your note on Binary Search was liked by 12 people', time: '2h ago' },
  { id: 2, type: 'comment', text: 'Amit Sharma commented on your SQL notes', time: '5h ago' },
  { id: 3, type: 'published', text: 'Your contribution Graph Explained is now live', time: '1d ago' },
  { id: 4, type: 'repo', text: 'You added a repository: two-sum-solutions', time: '2d ago' },
]

export const topContributors = [
  { id: 1, name: 'Aditya Verma', points: '2.8k', rank: 1 },
  { id: 2, name: 'Neha Gupta', points: '2.1k', rank: 2 },
  { id: 3, name: 'Rohit Yadav', points: '1.9k', rank: 3 },
  { id: 4, name: 'Priya Sharma', points: '1.4k', rank: 4 },
  { id: 5, name: 'Amit Kumar', points: '1.2k', rank: 5 },
]

export const repos = [
  { name: 'dsa-notes', desc: 'Comprehensive DSA notes and solutions', stars: 89, forks: 23, lang: 'C++', langColor: '#f34b7d', updated: '2 days ago' },
  { name: 'sql-mastery', desc: 'SQL queries, joins, and advanced topics', stars: 76, forks: 18, lang: 'SQL', langColor: '#e38c00', updated: '5 days ago' },
  { name: 'two-sum-solutions', desc: 'Multiple approaches to the Two Sum problem', stars: 32, forks: 9, lang: 'Python', langColor: '#3572a5', updated: '1 week ago' },
  { name: 'system-design-notes', desc: 'System design interview preparation', stars: 124, forks: 41, lang: 'Markdown', langColor: '#083fa1', updated: '3 days ago' },
]

export const accessRequests = [
  { id: 1, name: 'Rahul Sharma', email: 'rahul@example.com', github: 'github.com/rahulsharma', portfolio: 'rahul.dev', reason: 'I have been creating DSA content for three years and want to share structured notes with the community.', topics: ['DSA', 'System Design'], submittedAt: '2 hours ago' },
  { id: 2, name: 'Pooja Singh', email: 'pooja@example.com', github: 'github.com/poojasingh', portfolio: '', reason: 'SQL expert with production database experience. I want to help learners understand joins, indexes, and query planning.', topics: ['SQL', 'Database'], submittedAt: '5 hours ago' },
  { id: 3, name: 'Karan Mehta', email: 'karan@example.com', github: 'github.com/karanmehta', portfolio: 'karan.io', reason: 'Backend engineer who wants to contribute system design breakdowns and interview prep guides.', topics: ['System Design', 'Web Dev'], submittedAt: '1 day ago' },
]
