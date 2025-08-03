// LeetCode API Proxy Utility
// This handles CORS issues by using a proxy service

const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const LEETCODE_API = "https://leetcode.com/graphql";

// Alternative proxy options if the main one doesn't work
const PROXY_OPTIONS = [
  "https://cors-anywhere.herokuapp.com/",
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?",
  "https://thingproxy.freeboard.io/fetch/"
];

export const fetchLeetCodeData = async (query, variables, proxyIndex = 0) => {
  const proxy = PROXY_OPTIONS[proxyIndex];
  
  try {
    const response = await fetch(proxy + LEETCODE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://leetcode.com",
        "Referer": "https://leetcode.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Proxy ${proxyIndex + 1} failed:`, error);
    
    // Try next proxy if available
    if (proxyIndex < PROXY_OPTIONS.length - 1) {
      console.log(`Trying proxy ${proxyIndex + 2}...`);
      return fetchLeetCodeData(query, variables, proxyIndex + 1);
    }
    
    throw new Error("All proxy servers failed. Please try again later.");
  }
};

// Fallback: Use a public LeetCode API endpoint
export const fetchLeetCodeDataFallback = async (username) => {
  try {
    // Try using a public API that scrapes LeetCode
    const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to match our expected format
    return {
      data: {
        matchedUser: {
          username: username,
          profile: {
            realName: data.name || username,
            ranking: data.ranking || null,
            reputation: data.reputation || null
          },
          submitStats: {
            acSubmissionNum: [
              { difficulty: "Easy", count: data.easySolved || 0 },
              { difficulty: "Medium", count: data.mediumSolved || 0 },
              { difficulty: "Hard", count: data.hardSolved || 0 }
            ],
            totalSubmissionNum: [
              { difficulty: "Easy", count: data.totalEasy || 0 },
              { difficulty: "Medium", count: data.totalMedium || 0 },
              { difficulty: "Hard", count: data.totalHard || 0 }
            ]
          }
        }
      }
    };
  } catch (error) {
    console.error("Fallback API failed:", error);
    throw new Error("Unable to fetch LeetCode data. Please check your username and try again.");
  }
}; 