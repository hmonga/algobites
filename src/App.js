// Enhanced AlgoBites App.js (integrated all features in one file)
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

          // Get durations from videos endpoint
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
        alert("⚠️ You're offline — loading from localStorage.");
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

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

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

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 dark:text-white transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-5xl font-bold text-blue-700 dark:text-blue-400 tracking-tight">
              AlgoBites 🚀
            </h1>
            <button
              onClick={() => navigate("/leetcode")}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded shadow ml-4"
            >
              🧠 LeetCode Tracker
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-1 border rounded shadow-sm text-sm dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>

          {user ? (
            <div className="text-center mb-6">
              <p className="text-lg mb-2">Welcome, {user.displayName}</p>
              <p className="text-md">
                🔥 Daily Streak: {streak} day{streak > 1 ? "s" : ""}
              </p>
              <div className="mt-1">
                {streak >= 3 && streak < 7 && (
                  <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                    3-Day 🔓
                  </span>
                )}
                {streak >= 7 && (
                  <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs ml-2">
                    7-Day Beast Mode 💪
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="mt-2 px-5 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={login}
                className="px-5 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
              >
                Login with Google
              </button>
            </div>
          )}

          {user && (
            <div className="mt-10 space-y-8">
              <div className="mb-6">
                <div className="font-medium mb-2">
                  Progress: {watched.length} / {videos.length} watched (
                  {progress}%)
                </div>
                <div className="w-full h-4 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-sm mt-2 text-gray-700 dark:text-gray-300">
                  ⏳ Estimated time to finish: ~{timeLeft} minutes
                </div>
              </div>

              {nextUnwatched && (
                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 p-4 rounded-lg shadow">
                  <strong>Next up:</strong> {nextUnwatched.title}
                </div>
              )}

              <input
                type="text"
                placeholder="Search videos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <div
                    id={video.id}
                    key={video.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-xl hover:scale-[1.02] transition-transform duration-200"
                  >
                    <iframe
                      src={video.url}
                      className="w-full h-60 mb-3 rounded"
                      allowFullScreen
                      title={`Video: ${video.title}`}
                    ></iframe>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm dark:text-white">
                        {video.title}
                      </span>
                      <button
                        title={
                          favorites.includes(video.id)
                            ? "Unfavorite"
                            : "Mark as Favorite"
                        }
                        onClick={() => toggleFavorite(video.id)}
                      >
                        {favorites.includes(video.id) ? "⭐" : "☆"}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Duration: {parseISODuration(video.duration)}
                    </div>

                    <button
                      title="Toggle watched status"
                      onClick={() => toggleWatch(video.id)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                        watched.includes(video.id)
                          ? "bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-700 dark:text-white"
                          : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
                      }`}
                    >
                      {watched.includes(video.id)
                        ? "Watched ✅"
                        : "Mark as Watched"}
                    </button>
                    <button
                      title="Save to practice later"
                      onClick={() => toggleQueue(video.id)}
                      className="mt-1 ml-2 text-xs bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-800 dark:text-white px-2 py-1 rounded"
                    >
                      {queue.includes(video.id)
                        ? "Queued ⏳"
                        : "Practice Later"}
                    </button>
                    <button
                      title="Ask AI a question"
                      onClick={() => setActiveChat(video.id)}
                      className="mt-1 ml-2 text-xs bg-blue-200 hover:bg-blue-300 dark:bg-blue-800 dark:text-white px-2 py-1 rounded"
                    >
                      💬 Ask AI
                    </button>
                    <textarea
                      rows={2}
                      placeholder="Take notes..."
                      className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 dark:text-white dark:bg-gray-800 rounded"
                      value={notes[video.id] || ""}
                      onChange={(e) => updateNote(video.id, e.target.value)}
                    ></textarea>
                  </div>
                ))}
              </div>
              {activeChat && (
                <ChatWithAI
                  video={videos.find((v) => v.id === activeChat)}
                  onClose={() => setActiveChat(null)}
                />
              )}
            </div>
          )}
        </div>
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
