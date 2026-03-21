import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigValid } from '../lib/firebase';

const COLLECTION_NAME = 'hackathons';

// Helper to filter out undefined values to prevent Firestore errors
const cleanData = (data) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => cleaned[key] === undefined && delete cleaned[key]);
  return cleaned;
};

// Fallback mock data when Firestore is not configured
export const hackathons = [
  {
    id: "mock1",
    title: "Smart Campus Hackathon",
    date: "2026-04-10",
    deadline: "2026-04-05",
    location: "Online",
    description: "Build something smart.",
    type: "Hackathon",
    link: "https://example.com"
  },
  {
    id: "mock2",
    title: "AI Innovation Hack",
    date: "2026-04-15",
    deadline: "2026-04-12",
    location: "New York",
    description: "AI tools for the future.",
    type: "Hackathon",
    link: "https://example.com"
  }
];

export const getHackathons = async () => {
  if (!isFirebaseConfigValid || !db) {
    console.warn("Using mock data because Firestore is not configured.");
    return hackathons;
  }
  try {
    const hackathonsRef = collection(db, COLLECTION_NAME);
    const q = query(hackathonsRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching hackathons:", error);
    // Return mock data as a fallback to prevent app crash
    return hackathons;
  }
};

export const getHackathon = async (id) => {
  if (!isFirebaseConfigValid || !db) {
    return hackathons.find(h => h.id === id) || null;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching hackathon:", error);
    return null;
  }
};

export const createHackathon = async (data) => {
  if (!isFirebaseConfigValid || !db) {
    throw new Error("Firestore not configured");
  }
  const cleanedData = cleanData(data);
  const hackathonsRef = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(hackathonsRef, { ...cleanedData, createdAt: new Date().toISOString() });
  return docRef.id;
};

export const updateHackathon = async (id, data) => {
  if (!isFirebaseConfigValid || !db) {
    throw new Error("Firestore not configured");
  }
  const cleanedData = cleanData(data);
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { ...cleanedData, updatedAt: new Date().toISOString() });
};

export const deleteHackathon = async (id) => {
  if (!isFirebaseConfigValid || !db) {
    throw new Error("Firestore not configured");
  }
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
