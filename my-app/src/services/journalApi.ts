import { auth } from "../firebase-config";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:8000";

export interface JournalEntryInput {
  title: string;
  ticker: string;
  direction: string;
  entryPrice: number;
  positionSize: number;
  timePeriod: string;
  riskToReward: number;
  thesis: string;
  catalyst: string;

  executionErrors?: string;
  maxFavourableExcursion?: number;
  maxAdverseExcursion?: number;

  confidence: number;
  emotions: string;

  pnl?: number;
}

export interface JournalEntry extends JournalEntryInput {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return user.getIdToken();
}

async function readResponse<T>(
  response: Response
): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return data as T;
}

export async function createJournalEntry(
  entry: JournalEntryInput
): Promise<JournalEntry> {
  const token = await getAuthToken();

  const response = await fetch(
    `${BACKEND_URL}/api/journal`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entry),
    }
  );

  return readResponse<JournalEntry>(response);
}

export async function getJournalEntries(): Promise<
  JournalEntry[]
> {
  const token = await getAuthToken();

  const response = await fetch(
    `${BACKEND_URL}/api/journal`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return readResponse<JournalEntry[]>(response);
}