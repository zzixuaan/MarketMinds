import { auth } from "../firebase-config";

import { BASE_URL } from "../api";

export type TradeStatus = "Open" | "Closed";

export interface JournalEntryInput {
  title: string;
  ticker: string;
  direction: "Buy" | "Sell"
  tradeStatus: TradeStatus;
  entryPrice: number;
  quantity: number;
  positionSize: number;
  timePeriod: string;
  riskToReward: number;
  stopLoss: number;
  takeProfit: number;
  thesis: string;
  catalyst: string;

  executionErrors?: string;
  //maxFavourableExcursion?: number;
  //maxAdverseExcursion?: number;

  confidence: number;
  emotions: string;

  exitPrice: number | null;
  pnl?: number | null;
  lessonsLearnt: string;
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


function getErrorMessage(data: any): string {
    if (!data) {
      return "Request failed.";
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((error: any) => {
          const field = Array.isArray(error.loc)
            ? error.loc.join(".")
            : "field";

          return `${field}: ${error.msg}`;
        })
        .join("\n");
    }

    return "Request failed.";
}


export async function getJournalEntries(): Promise<
  JournalEntry[]
> {
  const token = await getAuthToken();

  const response = await fetch(
    `${BASE_URL}/api/journal`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if(!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "Unable to load journal entries."

    );
  }

  return data as JournalEntry[];
}

export async function getJournalEntry(entryId: string) {
  const token = await getAuthToken();

  const response = await fetch(
    `${BASE_URL}/api/journal/${entryId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if(!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
}



export async function CreateJournalEntry(
  entry: JournalEntryInput
): Promise<JournalEntry> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data as JournalEntry;
}


export async function deleteJournalEntry(
  entryId: string
): Promise<void> {
  if (!entryId) {
    throw new Error("Journal entry ID is required.");
  }

  const token= await getAuthToken();

  const response = await fetch(
    `${BASE_URL}/api/journal/${entryId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 204) {
    return;
  }

  let errorMessage = "Unable to delete journal entry.";

  try {
    const data = await response.json();

    errorMessage = 
      data.detail ||
      data.message ||
      errorMessage;

  } catch {

  } throw new Error(errorMessage);
}


export async function updateJournalEntry(
  entryId: string,
  updates: Partial<JournalEntryInput>
): Promise<JournalEntry> {
  if (!entryId) {
    throw new Error("Journal entry ID is required.");
  }

  const token = await getAuthToken();

  const response = await fetch(
    `${BASE_URL}/api/journal/${entryId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    let data: any = null;

    try {
      const data = await response.json();
      
    } catch {

    }
    throw new Error(getErrorMessage(data));
  }

  return response.json();
  
}