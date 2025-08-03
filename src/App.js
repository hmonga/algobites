import "./App.css";
import { useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ChatWithAI from "./ChatWithAI";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import LeetCodeTracker from "./LeetCodeTracker";

const YOUTUBE_API_KEY = "AIzaSyAHD2mGMD8czupOU79UvLk9flVy9Nm1iyY";
const PLAYLIST_ID = "PLot-Xpze53lfJlNm5S0fq3AmoyugNGqPk";

function parseISODuration(iso) {
  const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const minutes = parseInt(match?.[1] || 0);
  const seconds = parseInt(match?.[2] || 0);
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading...</div>
      </div>
    </div>
  );
}

function Header({ user, darkMode, setDarkMode, logout, login, navigate }) {
  const location = useLocation();
  
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="AlgoBites Logo" 
                className="w-10 h-10 rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center hidden">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AlgoBites
              </h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate("/")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              }`}
            >
              Learning Hub
            </button>
            <button
              onClick={() => navigate("/leetcode")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === "/leetcode"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  : "text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400"
              }`}
            >
              LeetCode Tracker
            </button>

          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm ${user.photoURL ? 'hidden' : 'flex'}`}
                    style={{ display: user.photoURL ? 'none' : 'flex' }}
                  >
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.displayName || 'User'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
                         ) : (
               <button
                 onClick={login}
                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
               >
                 Sign In
               </button>
             )}
          </div>
        </div>
      </div>
    </header>
  );
}

function StatsCard({ title, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ progress, watched, total, timeLeft }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Progress</h3>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {watched} / {total} completed
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{progress}% Complete</span>
          <span>~{timeLeft} min remaining</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {progress === 100 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎉</span>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Congratulations!</p>
              <p className="text-sm text-green-600 dark:text-green-300">You've completed all videos!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, watched, favorites, queue, notes, onToggleWatch, onToggleFavorite, onToggleQueue, onUpdateNote, onAskAI }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="relative">
        <iframe
          src={video.url}
          className="w-full h-48"
          allowFullScreen
          title={video.title}
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={() => onToggleFavorite(video.id)}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              favorites.includes(video.id)
                ? "bg-yellow-400/90 text-yellow-900"
                : "bg-black/50 text-white hover:bg-black/70"
            }`}
            title={favorites.includes(video.id) ? "Remove from favorites" : "Add to favorites"}
          >
            {favorites.includes(video.id) ? "⭐" : "☆"}
          </button>
          <button
            onClick={() => onToggleQueue(video.id)}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              queue.includes(video.id)
                ? "bg-blue-400/90 text-blue-900"
                : "bg-black/50 text-white hover:bg-black/70"
            }`}
            title={queue.includes(video.id) ? "Remove from queue" : "Add to queue"}
          >
            {queue.includes(video.id) ? "⏳" : "📋"}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight flex-1 mr-2">
            {video.title}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {parseISODuration(video.duration)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => onToggleWatch(video.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              watched.includes(video.id)
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {watched.includes(video.id) ? "Watched" : "Mark Watched"}
          </button>
          
          <button
            onClick={() => onAskAI(video.id)}
            className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
          >
            Ask AI
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
          >
            Notes {isExpanded ? "▼" : "▶"}
          </button>
          
          {isExpanded && (
            <textarea
              rows={3}
              placeholder="Take notes on this video..."
              className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              value={notes[video.id] || ""}
              onChange={(e) => onUpdateNote(video.id, e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AppContent({ user }) {
  const [videos, setVideos] = useState([]);
  const [watched, setWatched] = useState([]);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [notes, setNotes] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [queue, setQueue] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchVideos = async () => {
      let allVideos = [];
      let nextPageToken = "";
      const maxResults = 50;

      try {
        do {
          const res = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_API_KEY}&pageToken=${nextPageToken}`
          );
          const data = await res.json();
          const videoIds = data.items
            .map((item) => item.snippet.resourceId.videoId)
            .join(",");

          const detailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
          );
          const detailsData = await detailsRes.json();

          const formatted = data.items.map((item, idx) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            url: `https://www.youtube.com/embed/${item.snippet.resourceId.videoId}`,
            duration:
              detailsData.items[idx]?.contentDetails?.duration || "PT0M0S",
          }));

          allVideos = [...allVideos, ...formatted];
          nextPageToken = data.nextPageToken || "";
        } while (nextPageToken);

        setVideos(allVideos);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchVideos();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      const ref = doc(db, "users", user.uid);
      try {
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        setWatched(data.watched || []);
        setNotes(data.notes || {});
        setFavorites(data.favorites || []);
        setQueue(data.queue || []);

        let streakVal = data.streak || 1;
        if (data.lastLogin === yesterday) {
          streakVal += 1;
        } else if (data.lastLogin !== today) {
          streakVal = 1;
        }

        setStreak(streakVal);
        await setDoc(
          ref,
          { ...data, streak: streakVal, lastLogin: today },
          { merge: true }
        );
      } catch (error) {
        console.error("Firestore fetch failed:", error.message);
        alert("You're offline — loading from localStorage.");
        setWatched(JSON.parse(localStorage.getItem("watched") || "[]"));
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("watched", JSON.stringify(watched));
    }
  }, [watched, user]);

  const nextUnwatched = videos.find((v) => !watched.includes(v.id));

  useEffect(() => {
    if (nextUnwatched) {
      document
        .getElementById(nextUnwatched.id)
        ?.scrollIntoView({ behavior: "smooth" });
    }

    if (watched.length === videos.length && videos.length > 0) {
      import("canvas-confetti").then((confetti) =>
        confetti.default({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
      );
    }
  }, [nextUnwatched, watched.length, videos.length]);

  const toggleWatch = async (videoId) => {
    const updated = watched.includes(videoId)
      ? watched.filter((id) => id !== videoId)
      : [...watched, videoId];

    setWatched(updated);
    if (user) {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      await setDoc(ref, { ...data, watched: updated }, { merge: true });
    }
  };

  const toggleFavorite = async (videoId) => {
    const updated = favorites.includes(videoId)
      ? favorites.filter((id) => id !== videoId)
      : [...favorites, videoId];
    setFavorites(updated);
    if (user) {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      await setDoc(ref, { ...data, favorites: updated }, { merge: true });
    }
  };

  const toggleQueue = async (videoId) => {
    const updated = queue.includes(videoId)
      ? queue.filter((id) => id !== videoId)
      : [...queue, videoId];
    setQueue(updated);
    if (user) {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      await setDoc(ref, { ...data, queue: updated }, { merge: true });
    }
  };

  const updateNote = async (videoId, text) => {
    const updated = { ...notes, [videoId]: text };
    setNotes(updated);
    if (user) {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      await setDoc(ref, { ...data, notes: updated }, { merge: true });
    }
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(search.toLowerCase())
  );

  const progress = Math.round((watched.length / videos.length) * 100);
  const timeLeft = (videos.length - watched.length) * 6;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header 
          user={user} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          logout={logout}
          login={login}
          navigate={navigate}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!user ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <img 
                    src="/logo.png" 
                    alt="AlgoBites Logo" 
                    className="w-16 h-16 rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <span className="text-white text-3xl hidden">A</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome to AlgoBites
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Master algorithms with curated video content, track your progress, and get AI-powered assistance.
                </p>
                <button
                  onClick={login}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  Sign in with Google
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user.displayName}!</h1>
                    <p className="text-blue-100">Ready to continue your algorithm learning journey?</p>
                  </div>
                  <div className="hidden md:flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{streak}</div>
                      <div className="text-sm text-blue-100">Day Streak</div>
                    </div>
                    {streak >= 3 && (
                      <div className="bg-yellow-400/20 rounded-lg px-3 py-2">
                        <span className="text-yellow-200 font-medium">
                          {streak >= 7 ? "Beast Mode" : "On Fire"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Videos Watched"
                  value={`${watched.length}/${videos.length}`}
                  icon="📺"
                  color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatsCard
                  title="Favorites"
                  value={favorites.length}
                  icon="★"
                  color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                />
                <StatsCard
                  title="In Queue"
                  value={queue.length}
                  icon="📋"
                  color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                />
              </div>

              <ProgressBar 
                progress={progress} 
                watched={watched.length} 
                total={videos.length} 
                timeLeft={timeLeft} 
              />

              {nextUnwatched && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Next Up</h3>
                      <p className="text-gray-600 dark:text-gray-300">{nextUnwatched.title}</p>
                    </div>
                  </div>
                </div>
              )}



              <div className="relative">
                <input
                  type="text"
                  placeholder="Search videos by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">⌕</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    watched={watched}
                    favorites={favorites}
                    queue={queue}
                    notes={notes}
                    onToggleWatch={toggleWatch}
                    onToggleFavorite={toggleFavorite}
                    onToggleQueue={toggleQueue}
                    onUpdateNote={updateNote}
                    onAskAI={(videoId) => setActiveChat(videoId)}
                  />
                ))}
              </div>

              {filteredVideos.length === 0 && search && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⌕</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No videos found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search terms
                  </p>
                </div>
              )}

              {activeChat && (
                <ChatWithAI
                  video={videos.find((v) => v.id === activeChat)}
                  onClose={() => setActiveChat(null)}
                />
              )}


            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent user={user} />} />
        <Route path="/leetcode" element={<LeetCodeTracker user={user} />} />
      </Routes>
    </Router>
  );
}
