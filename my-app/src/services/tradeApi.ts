import { auth } from "../firebase-config";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:8000";

export interface TradeEntryInput {
    symbol: string
    side: string
    quantity: number
    price: number
    total: number

}

export interface TradeEntry extends TradeEntryInput {
  id: string;
  createdAt?: string;
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


export async function getTradeEntries(): Promise<
  TradeEntry[]
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

  const data = await response.json();

  if(!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "Unable to load trade entries."

    );
  }

  return data as TradeEntry[];
}
