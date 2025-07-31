// File: LeetCodeTracker.js
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";

function LeetCodeTracker({ user }) {
  const [todayMarked, setTodayMarked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [calendar, setCalendar] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const ref = doc(db, "leetcode", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setStreak(data.streak || 0);
        setCalendar(data.calendar || {});
        const today = new Date().toISOString().split("T")[0];
        if (data.calendar?.[today]) {
          setTodayMarked(true);
        }
      }
    };
    fetchData();
  }, [user]);

  const markToday = async () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split("T")[0];

    const newCalendar = { ...calendar, [today]: true };
    const newStreak = calendar[yestStr] ? streak + 1 : 1;

    setCalendar(newCalendar);
    setStreak(newStreak);
    setTodayMarked(true);

    const ref = doc(db, "leetcode", user.uid);
    await setDoc(ref, { streak: newStreak, calendar: newCalendar }, { merge: true });
  };

  const renderCalendar = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push(
        <div
          key={key}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${calendar[key] ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"}`}
        >
          {d.getDate()}
        </div>
      );
    }
    return <div className="flex gap-2 justify-center mt-4">{days}</div>;
  };
  
  if (!user) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-white">
      <p className="text-xl font-semibold">Please log in to view your LeetCode streak.</p>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 dark:from-purple-800 dark:to-indigo-900 text-center py-12 px-4">
      <h2 className="text-4xl font-extrabold text-purple-800 dark:text-white mb-4">
        🧠 LeetCode Tracker
      </h2>
      <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">
        Your current streak: <span className="font-bold">{streak}</span> day{streak !== 1 ? "s" : ""}
      </p>
      {todayMarked ? (
        <div className="text-green-600 dark:text-green-300 text-xl font-semibold">
          🎉 Woohoo! You practiced today! Keep that brain flexing!
        </div>
      ) : (
        <button
          onClick={markToday}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow font-bold text-lg"
        >
          ✅ I did LeetCode today!
        </button>
      )}
      {renderCalendar()}
      <button
        onClick={() => navigate("/")}
        className="mt-8 px-5 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
      >
        🔙 Back to AlgoBites
      </button>
    </div>
  );
}

export default LeetCodeTracker;