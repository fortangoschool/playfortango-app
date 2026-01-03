import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  runTransaction,
} from "firebase/firestore";
import {
  Music,
  Heart,
  Footprints,
  Sparkles,
  Compass,
  Trophy,
  UserPlus,
  Star,
  QrCode,
  Crown,
} from "lucide-react";

// --- Firebase Configuration & Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyCHXuQM9pch8UaxHSo6Tf7cLkFq0nFMjuw",
  authDomain: "playfortango2.firebaseapp.com",
  projectId: "playfortango2",
  storageBucket: "playfortango2.firebasestorage.app",
  messagingSenderId: "336860212166",
  appId: "1:336860212166:web:0f21ddd399efff624c60c7",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Change this string if you want to reset the database (e.g. 'eventi-fortango-v2')
const appId = "eventi-fortango";

// --- Constants (Translated to English) ---
const CATEGORIES = [
  {
    id: "musicality",
    label: "Musicality",
    icon: Music,
    color: "text-amber-400",
  },
  {
    id: "connection",
    label: "Connection",
    icon: Heart,
    color: "text-red-500",
  },
  {
    id: "technique",
    label: "Technique",
    icon: Footprints,
    color: "text-stone-400",
  },
  {
    id: "elegance",
    label: "Elegance",
    icon: Sparkles,
    color: "text-yellow-300",
  },
  {
    id: "navigation",
    label: "Floorcraft",
    icon: Compass,
    color: "text-sky-400",
  },
];

const ROLES = [
  { id: "leader", label: "Leader", prefix: "L" },
  { id: "follower", label: "Follower", prefix: "F" },
  { id: "both", label: "Double Role", prefix: "D" },
];

// --- Components ---

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-black text-amber-500">
    <div className="animate-spin h-10 w-10 border-4 border-current border-t-transparent rounded-full"></div>
  </div>
);

const StarRating = ({ value, onChange, colorClass }) => {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`p-1 transition-transform active:scale-90 focus:outline-none`}
        >
          <Star
            size={32}
            className={`${
              star <= value ? `fill-current ${colorClass}` : "text-neutral-700"
            } transition-colors`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
};

const Onboarding = ({ onComplete, userId }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("leader");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      // Transaction to ensure sequential IDs (L001, L002...)
      await runTransaction(db, async (transaction) => {
        // 1. Reference to the counter document
        const counterRef = doc(db, "artifacts", appId, "public", "counters");
        const counterDoc = await transaction.get(counterRef);

        // 2. Determine current count
        let currentCount = 0;
        if (counterDoc.exists()) {
          const data = counterDoc.data();
          currentCount = data[`${role}Count`] || 0;
        }

        const newCount = currentCount + 1;

        // 3. Generate Code
        const selectedRoleObj = ROLES.find((r) => r.id === role);
        const prefix = selectedRoleObj ? selectedRoleObj.prefix : "X";
        const formattedNumber = String(newCount).padStart(3, "0");
        const code = `${prefix}${formattedNumber}`;

        // 4. Update the counter
        transaction.set(
          counterRef,
          { [`${role}Count`]: newCount },
          { merge: true }
        );

        // 5. Create Profile
        const userRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "participants",
          userId
        );
        transaction.set(userRef, {
          name: name.trim(),
          role,
          code,
          userId,
          createdAt: serverTimestamp(),
        });
      });

      onComplete();
    } catch (error) {
      console.error("Error creating profile:", error);
      setIsSubmitting(false);
      alert("Connection error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-amber-50">
      <div className="w-full max-w-md bg-neutral-900 p-8 rounded-2xl shadow-2xl shadow-amber-900/10 border border-neutral-800">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Crown size={48} className="text-amber-500" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-600 mb-2">
            PlayForTango
          </h1>
          <p className="text-neutral-500 text-sm">Join the event</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-amber-500/80 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-neutral-700"
              placeholder="e.g. Mario Rossi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-500/80 mb-3">
              Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                    role === r.id
                      ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-black font-bold shadow-lg shadow-amber-900/20"
                      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-black font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? "Joining..." : "Join the Floor"}
          </button>
        </form>
      </div>
    </div>
  );
};

const VotingScreen = ({
  currentUserProfile,
  participants,
  votes, // Added votes prop to check for duplicates
  onVoteSuccess,
  onCancel,
}) => {
  const [targetCode, setTargetCode] = useState("");
  const [scores, setScores] = useState({
    musicality: 0,
    connection: 0,
    technique: 0,
    elegance: 0,
    navigation: 0,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const foundPartner = useMemo(() => {
    if (targetCode.length < 4) return null;
    return Object.values(participants).find(
      (p) => p.code === targetCode.toUpperCase()
    );
  }, [targetCode, participants]);

  const handleSubmit = async () => {
    setError("");

    // Validation 1: Partner exists
    if (!foundPartner) {
      setError("Code not found.");
      return;
    }

    // Validation 2: Self voting
    if (foundPartner.userId === currentUserProfile.userId) {
      setError("You cannot vote for yourself!");
      return;
    }

    // Validation 3: All categories scored
    if (Object.values(scores).some((s) => s === 0)) {
      setError("Please rate all categories.");
      return;
    }

    // Validation 4: ALREADY VOTED CHECK
    const alreadyVoted = votes.some(
      (v) =>
        v.voterId === currentUserProfile.userId &&
        v.targetId === foundPartner.userId
    );

    if (alreadyVoted) {
      setError("You have already voted for this partner.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "votes"),
        {
          voterId: currentUserProfile.userId,
          targetId: foundPartner.userId,
          targetCode: foundPartner.code,
          scores,
          timestamp: serverTimestamp(),
        }
      );
      onVoteSuccess();
    } catch (err) {
      console.error(err);
      setError("Error saving vote.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 shadow-2xl shadow-black">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-amber-50 flex items-center gap-2">
            <UserPlus className="text-amber-500" /> Vote Partner
          </h2>
          <button
            onClick={onCancel}
            className="text-neutral-500 hover:text-white"
          >
            Close
          </button>
        </div>

        {/* Code Input */}
        <div className="mb-8">
          <label className="block text-amber-500/60 text-xs uppercase tracking-widest mb-2 text-center">
            Partner Code
          </label>
          <input
            type="text"
            maxLength={4}
            value={targetCode}
            onChange={(e) => {
              setTargetCode(e.target.value.toUpperCase());
              setError("");
            }}
            className="w-full bg-black text-center text-4xl font-mono tracking-widest text-white border-2 border-neutral-800 rounded-xl py-4 focus:border-amber-500 outline-none uppercase placeholder-neutral-800 transition-colors"
            placeholder="L001"
          />
          {foundPartner && (
            <div className="mt-2 text-center text-amber-400 font-medium animate-pulse border border-amber-900/30 bg-amber-900/10 rounded-lg p-2">
              <span className="text-xs text-amber-500/70 block uppercase">
                Partner found
              </span>
              {foundPartner.name} (
              {ROLES.find((r) => r.id === foundPartner.role)?.label})
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="bg-black/40 border border-neutral-800 p-3 rounded-xl flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-2 text-neutral-300 font-medium text-sm">
                <cat.icon size={16} className={cat.color} />
                {cat.label}
              </div>
              <StarRating
                value={scores[cat.id]}
                onChange={(val) =>
                  setScores((prev) => ({ ...prev, [cat.id]: val }))
                }
                colorClass={cat.color}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg text-center text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-8 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Submit Vote"}
        </button>
      </div>
    </div>
  );
};

const Dashboard = ({ user, participants, votes }) => {
  const [view, setView] = useState("home");
  const [successMsg, setSuccessMsg] = useState("");

  const myProfile = participants[user.uid];

  const handleVoteSuccess = () => {
    setView("home");
    setSuccessMsg("Vote registered! Thank you.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // --- Calculations for Rankings ---
  const rankings = useMemo(() => {
    const stats = {};
    Object.keys(participants).forEach((uid) => {
      stats[uid] = {
        uid,
        name: participants[uid].name,
        role: participants[uid].role,
        totalVotes: 0,
        uniqueVoters: new Set(),
        scores: {
          musicality: { total: 0, count: 0 },
          connection: { total: 0, count: 0 },
          technique: { total: 0, count: 0 },
          elegance: { total: 0, count: 0 },
          navigation: { total: 0, count: 0 },
        },
      };
    });

    votes.forEach((vote) => {
      const targetId = vote.targetId;
      if (stats[targetId]) {
        stats[targetId].uniqueVoters.add(vote.voterId);
        stats[targetId].totalVotes += 1;

        Object.keys(vote.scores).forEach((cat) => {
          if (stats[targetId].scores[cat]) {
            stats[targetId].scores[cat].total += vote.scores[cat];
            stats[targetId].scores[cat].count += 1;
          }
        });
      }
    });

    const computeList = (category) => {
      return Object.values(stats)
        .map((p) => ({
          ...p,
          avg:
            p.scores[category].count > 0
              ? (p.scores[category].total / p.scores[category].count).toFixed(1)
              : 0,
          count: p.scores[category].count,
        }))
        .filter((p) => p.count > 0)
        // MODIFICA QUI: Ordinamento per Media (desc) POI per Conteggio (desc)
        .sort((a, b) => {
           // 1. Confronta la media
           const diff = b.avg - a.avg;
           if (diff !== 0) return diff;
           
           // 2. Se media uguale, vince chi ha più voti
           return b.count - a.count;
        });
    };

    const popularityList = Object.values(stats)
      .map((p) => ({
        ...p,
        uniqueCount: p.uniqueVoters.size,
      }))
      .filter((p) => p.uniqueCount > 0)
      .sort((a, b) => b.uniqueCount - a.uniqueCount);

    return {
      musicality: computeList("musicality"),
      connection: computeList("connection"),
      technique: computeList("technique"),
      elegance: computeList("elegance"),
      navigation: computeList("navigation"),
      popularity: popularityList,
    };
  }, [participants, votes]);

  // Sub-component for Rankings
  const RankingList = () => {
    const [activeTab, setActiveTab] = useState("popularity");
    const currentList =
      activeTab === "popularity" ? rankings.popularity : rankings[activeTab];

    return (
      <div className="pb-24 animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-serif text-amber-500 mb-6 flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Rankings
        </h2>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setActiveTab("popularity")}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
              activeTab === "popularity"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-900/20"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            Social
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
                activeTab === cat.id
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-900/20"
                  : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {currentList.length === 0 ? (
            <div className="text-center text-neutral-600 py-12 bg-neutral-900/30 rounded-xl border border-neutral-800 border-dashed">
              No data yet
            </div>
          ) : (
            currentList.map((p, idx) => (
              <div
                key={p.uid}
                className="bg-neutral-900 p-4 rounded-xl flex items-center justify-between border border-neutral-800 relative overflow-hidden group"
              >
                {/* Gold Glow for #1 */}
                {idx === 0 && (
                  <div className="absolute top-0 left-0 w-1 bg-yellow-500 h-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
                )}

                {/* Rank Number */}
                <div className="absolute -left-1 top-0 bottom-0 w-12 flex items-center justify-center text-5xl font-black text-neutral-800/50 z-0 italic">
                  {idx + 1}
                </div>

                <div className="flex items-center gap-4 z-10 pl-6">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${
                      idx === 0
                        ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-black"
                        : idx === 1
                        ? "bg-gradient-to-br from-slate-300 to-slate-400 text-black"
                        : idx === 2
                        ? "bg-gradient-to-br from-amber-700 to-amber-800 text-amber-100"
                        : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {idx < 3 ? <Trophy size={16} /> : p.name.charAt(0)}
                  </div>
                  <div>
                    <div
                      className={`font-bold ${
                        idx === 0 ? "text-amber-100" : "text-neutral-200"
                      }`}
                    >
                      {p.name}
                    </div>
                    <div className="text-xs text-neutral-500 uppercase font-medium tracking-wide">
                      {ROLES.find((r) => r.id === p.role)?.label}
                    </div>
                  </div>
                </div>

                <div className="text-right z-10">
                  {activeTab === "popularity" ? (
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-bold text-white">
                        {p.uniqueCount}
                      </span>
                      <span className="text-xs text-neutral-500">Partners</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-amber-400">
                        <span className="text-xl font-bold">{p.avg}</span>
                        <Star size={14} fill="currentColor" />
                      </div>
                      <span className="text-xs text-neutral-500">
                        {p.count} votes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (!myProfile) return <Loading />;

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans pb-20 relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 p-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Crown className="text-amber-500" size={24} />
          <span className="font-serif text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-600">
            PlayForTango
          </span>
        </div>
        <div className="text-xs text-neutral-500">
          <span className="text-amber-500/80 font-medium uppercase tracking-wide">
            {myProfile.name}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 max-w-2xl mx-auto">
        {successMsg && (
          <div className="mb-6 bg-amber-900/20 border border-amber-500/30 text-amber-300 p-4 rounded-xl text-center shadow-lg animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2">
            <Sparkles size={16} /> {successMsg}
          </div>
        )}

        {view === "home" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* My Code Card */}
            <div className="bg-gradient-to-b from-neutral-800 to-black p-8 rounded-3xl shadow-2xl shadow-black text-center relative overflow-hidden border border-amber-500/20 group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 group-hover:opacity-10 transition-opacity">
                <QrCode size={120} />
              </div>
              <h3 className="text-amber-500/60 uppercase text-xs font-bold tracking-[0.2em] mb-4">
                Your Code
              </h3>
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-400 font-mono tracking-widest my-4 drop-shadow-sm">
                {myProfile.code}
              </div>
              <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                Share this code after the dance.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setView("vote")}
                className="bg-neutral-900 hover:bg-neutral-800 border-neutral-800 border p-6 rounded-2xl flex flex-col items-center gap-3 transition-all active:scale-95 shadow-lg group hover:border-amber-500/30"
              >
                <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform border border-neutral-800 group-hover:border-amber-500/50">
                  <UserPlus size={28} />
                </div>
                <span className="font-bold text-neutral-200 group-hover:text-amber-100">
                  Vote Partner
                </span>
              </button>

              <button
                onClick={() => setView("rankings")}
                className="bg-neutral-900 hover:bg-neutral-800 border-neutral-800 border p-6 rounded-2xl flex flex-col items-center gap-3 transition-all active:scale-95 shadow-lg group hover:border-amber-500/30"
              >
                <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform border border-neutral-800 group-hover:border-yellow-500/50">
                  <Trophy size={28} />
                </div>
                <span className="font-bold text-neutral-200 group-hover:text-amber-100">
                  Rankings
                </span>
              </button>
            </div>

            {/* Stats Bar */}
            <div className="mt-8 border-t border-neutral-900 pt-6">
              <div className="bg-neutral-900/50 rounded-xl p-4 flex justify-between items-center border border-neutral-800/50">
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-white">
                    {participants[user.uid]?.userId
                      ? Object.values(participants).length
                      : 0}
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                    Dancers
                  </div>
                </div>
                <div className="w-px h-8 bg-neutral-800"></div>
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-amber-400">
                    {votes.length}
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                    Votes
                  </div>
                </div>
                <div className="w-px h-8 bg-neutral-800"></div>
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-emerald-500 animate-pulse">
                    •
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                    Live
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "vote" && (
          <VotingScreen
            currentUserProfile={myProfile}
            participants={participants}
            votes={votes} // Passed votes to check logic
            onVoteSuccess={handleVoteSuccess}
            onCancel={() => setView("home")}
          />
        )}

        {view === "rankings" && (
          <div>
            <button
              onClick={() => setView("home")}
              className="mb-4 text-neutral-500 hover:text-amber-400 flex items-center gap-1 text-sm pl-2 transition-colors"
            >
              ← Home
            </button>
            <RankingList />
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState({});
  const [votes, setVotes] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);

  // 1. Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Login failed", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Sync
  useEffect(() => {
    if (!user) return;

    const unsubParticipants = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "participants"),
      (snapshot) => {
        const pMap = {};
        snapshot.forEach((doc) => {
          pMap[doc.id] = doc.data();
        });
        setParticipants(pMap);
        setHasProfile(!!pMap[user.uid]);
        setLoading(false);
      },
      (err) => console.error("Err participants", err)
    );

    const unsubVotes = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "votes"),
      (snapshot) => {
        const vList = [];
        snapshot.forEach((doc) => {
          vList.push({ id: doc.id, ...doc.data() });
        });
        setVotes(vList);
      },
      (err) => console.error("Err votes", err)
    );

    return () => {
      unsubParticipants();
      unsubVotes();
    };
  }, [user]);

  if (loading) return <Loading />;

  if (user && !hasProfile) {
    return (
      <Onboarding userId={user.uid} onComplete={() => setHasProfile(true)} />
    );
  }

  if (user && hasProfile) {
    return <Dashboard user={user} participants={participants} votes={votes} />;
  }

  return <Loading />;
}