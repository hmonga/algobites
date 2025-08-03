import React, { useEffect, useState } from 'react';

const fetchLeetCodeStats = async (username) => {
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query userProfile($username: String!) {
            matchedUser(username: $username) {
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `,
        variables: { username },
      }),
    });

    const data = await res.json();

    if (!data.data?.matchedUser) {
      return 'NOT_FOUND';
    }

    return data.data.matchedUser.submitStats.acSubmissionNum;
  } catch (err) {
    console.error('LeetCode fetch error:', err);
    return 'ERROR';
  }
};

const LeetCodeStats = ({ username }) => {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'notfound' | 'error'

  useEffect(() => {
    if (!username) return;

    const load = async () => {
      setStatus('loading');
      const result = await fetchLeetCodeStats(username);

      if (result === 'NOT_FOUND') {
        setStatus('notfound');
      } else if (result === 'ERROR') {
        setStatus('error');
      } else {
        setStats(result);
        setStatus('ok');
      }
    };

    load();
  }, [username]);

  if (!username) return null;

  if (status === 'loading') return <p className="text-sm text-gray-500">Loading LeetCode stats...</p>;
  if (status === 'notfound') return <p className="text-sm text-red-500">❌ Username "{username}" not found on LeetCode.</p>;
  if (status === 'error') return <p className="text-sm text-red-500">⚠️ Could not fetch stats. Try again later.</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mt-8">
      <h2 className="text-xl font-semibold mb-3">LeetCode Progress</h2>
      <ul className="space-y-1 text-sm">
        {stats.map((s) => (
          <li key={s.difficulty}>
            {s.difficulty}: <strong>{s.count}</strong> problems solved
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeetCodeStats;
