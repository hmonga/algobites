import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";
import { fetchLeetCodeData, fetchLeetCodeDataFallback } from "./utils/leetcodeProxy";

const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        userAvatar
        ranking
        reputation
        starRating
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      badges {
        id
        displayName
        icon
        category
      }
      upcomingBadges {
        name
        icon
      }
      activeBadge {
        id
        displayName
        icon
        category
      }
    }
  }
`;

const RECENT_SUBMISSIONS_QUERY = `
  query getRecentSubmissions($username: String!, $limit: Int!) {
    recentSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
      runtime
      memory
      code
      compareResult
      memoryDisplay
      runtimeDisplay
    }
  }
`;

const CALENDAR_SUBMISSIONS_QUERY = `
  query getUserCalendar($username: String!, $year: Int!) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        activeYears
        streak
        totalActiveDays
        dccBadges {
          timestamp
          badge {
            name
            icon
          }
        }
        submissionCalendar
      }
    }
  }
`;

function LeetCodeTracker({ user }) {
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [submissionCalendar, setSubmissionCalendar] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUsernameForm, setShowUsernameForm] = useState(true);
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const navigate = useNavigate();

  const loadUserLeetCodeData = useCallback(async () => {
    if (!user) return;
    
    const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
      if (data.leetcodeUsername && data.leetcodeUsername.trim()) {
        setLeetcodeUsername(data.leetcodeUsername);
        setShowUsernameForm(false);
        fetchLeetCodeDataFromAPI(data.leetcodeUsername);
      } else {
        setShowUsernameForm(true);
      }
    } else {
      setShowUsernameForm(true);
    }
  }, [user]);

  useEffect(() => {
    loadUserLeetCodeData();
  }, [loadUserLeetCodeData]);

  const fetchLeetCodeDataFromAPI = async (username) => {
    if (!username || !username.trim()) {
      setError("Please provide a valid LeetCode username");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Fetching data for username:", username);
      
      // Try the main GraphQL API first with proxy
      try {
        const profileData = await fetchLeetCodeData(USER_PROFILE_QUERY, { username: username.trim() });
        
        console.log("LeetCode API Response:", profileData);
        
        if (profileData.errors) {
          console.error("LeetCode API Errors:", profileData.errors);
          const errorMessage = profileData.errors[0]?.message || "Unknown error";
          throw new Error(`LeetCode API Error: ${errorMessage}. Please check the username and ensure your LeetCode profile is public.`);
        }

        if (!profileData.data?.matchedUser) {
          throw new Error(`User "${username}" not found. Please check the username spelling and ensure the profile exists.`);
        }

        setUserProfile(profileData.data.matchedUser);

        // Try to fetch recent submissions
        try {
          const submissionsData = await fetchLeetCodeData(RECENT_SUBMISSIONS_QUERY, { username: username.trim(), limit: 20 });
          setRecentSubmissions(submissionsData.data?.recentSubmissionList || []);
        } catch (submissionError) {
          console.warn("Could not fetch recent submissions:", submissionError);
          setRecentSubmissions([]);
        }

        // Try to fetch submission calendar
        try {
          const currentYear = new Date().getFullYear();
          const calendarData = await fetchLeetCodeData(CALENDAR_SUBMISSIONS_QUERY, { username: username.trim(), year: currentYear });
          if (calendarData.data?.matchedUser?.userCalendar) {
            setSubmissionCalendar(calendarData.data.matchedUser.userCalendar);
          }
        } catch (calendarError) {
          console.warn("Could not fetch submission calendar:", calendarError);
          setSubmissionCalendar({});
        }

      } catch (graphqlError) {
        console.log("GraphQL API failed, trying fallback...");
        
        // If GraphQL API fails, try the fallback API
        const fallbackData = await fetchLeetCodeDataFallback(username.trim());
        setUserProfile(fallbackData.data.matchedUser);
        setRecentSubmissions([]); // Fallback API doesn't provide recent submissions
        setSubmissionCalendar({}); // Fallback API doesn't provide calendar
      }

    } catch (err) {
      setError(err.message);
      console.error("Error fetching LeetCode data:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveLeetCodeUsername = async () => {
    if (!leetcodeUsername.trim()) {
      setError("Please enter a valid LeetCode username");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const ref = doc(db, "users", user.uid);
      await setDoc(ref, { leetcodeUsername: leetcodeUsername.trim() }, { merge: true });
      setShowUsernameForm(false);
      setIsChangingUsername(false);
      await fetchLeetCodeDataFromAPI(leetcodeUsername.trim());
    } catch (err) {
      setError("Failed to save username. Please try again.");
      setLoading(false);
    }
  };

  const changeUsername = () => {
    setIsChangingUsername(true);
    setShowUsernameForm(true);
    setError("");
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300";
      case "medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "hard": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted": return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300";
      case "wrong answer": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
      case "time limit exceeded": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const renderSubmissionCalendar = () => {
    if (!submissionCalendar.submissionCalendar) return null;

    const calendar = JSON.parse(submissionCalendar.submissionCalendar);
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = Math.floor(d.getTime() / 1000);
      const submissions = calendar[key] || 0;
      
      let bgColor = "bg-gray-200 dark:bg-gray-700";
      if (submissions > 0) {
        if (submissions >= 5) bgColor = "bg-green-500";
        else if (submissions >= 3) bgColor = "bg-green-400";
        else bgColor = "bg-green-300";
      }

      days.push(
        <div key={key} className="text-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${bgColor} text-white`}>
          {d.getDate()}
          </div>
          {submissions > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {submissions}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Last 7 Days Activity</h3>
        <div className="flex gap-2 justify-center">{days}</div>
      </div>
    );
  };
  
  if (!user) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-white">
        <p className="text-xl font-semibold">Please log in to view your LeetCode progress.</p>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            LeetCode Progress Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time data from your LeetCode profile
          </p>
          {userProfile && (
            <div className="mt-4 space-x-2">
              <button
                onClick={() => fetchLeetCodeDataFromAPI(leetcodeUsername)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>
              <button
                onClick={changeUsername}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Change Username
              </button>
            </div>
          )}
        </div>

        {/* Username Form */}
        {showUsernameForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {isChangingUsername ? "Change LeetCode Username" : "Connect Your LeetCode Account"}
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                placeholder="Enter your LeetCode username"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={saveLeetCodeUsername}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? "Connecting..." : (isChangingUsername ? "Update" : "Connect")}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Make sure your LeetCode profile is public to fetch data
            </p>
            {isChangingUsername && (
        <button
                onClick={() => {
                  setIsChangingUsername(false);
                  setShowUsernameForm(false);
                }}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
        </button>
      )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Fetching your LeetCode data...</p>
          </div>
        )}

        {/* User Profile */}
        {userProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {userProfile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {userProfile.profile.realName || userProfile.username}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">@{userProfile.username}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ranking</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    #{userProfile.profile.ranking?.toLocaleString() || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Reputation</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {userProfile.profile.reputation?.toLocaleString() || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Problem Statistics</h3>
              <div className="space-y-3">
                {userProfile.submitStats.acSubmissionNum.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(stat.difficulty)}`}>
                      {stat.difficulty}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stat.count} / {userProfile.submitStats.totalSubmissionNum[index].count}
                    </span>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>
                      {userProfile.submitStats.acSubmissionNum.reduce((sum, stat) => sum + stat.count, 0)} / 
                      {userProfile.submitStats.totalSubmissionNum.reduce((sum, stat) => sum + stat.count, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity</h3>
              {submissionCalendar.streak && (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {submissionCalendar.streak}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                </div>
              )}
              {renderSubmissionCalendar()}
            </div>
          </div>
        )}

        {/* Recent Submissions */}
        {recentSubmissions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Submissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-600 dark:text-gray-400">Problem</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-400">Language</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-400">Runtime</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-400">Memory</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.slice(0, 10).map((submission, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2">
                        <a 
                          href={`https://leetcode.com/problems/${submission.titleSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {submission.title}
                        </a>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.statusDisplay)}`}>
                          {submission.statusDisplay}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{submission.lang}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{submission.runtimeDisplay}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{submission.memoryDisplay}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">
                        {formatTimestamp(submission.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-8">
      <button
        onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        🔙 Back to AlgoBites
      </button>
        </div>
      </div>
    </div>
  );
}

export default LeetCodeTracker;