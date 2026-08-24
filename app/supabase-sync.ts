import { Capacitor, registerPlugin } from "@capacitor/core";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wislppgaikbxgibrjizz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_tONK58MPqu6CkvnAWqgoww_k8D_dcu_";
export const AEREA_ACCOUNT = "aereaary@gmail.com";
export const AEREA_AUTH_CALLBACK = "aerea://auth/callback";

type AereaAuthPlugin = {
  takePendingUrl(): Promise<{ url?: string }>;
};

const AereaAuth = registerPlugin<AereaAuthPlugin>("AereaAuth");

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

const STATE_KEY = "aerea-private-state-v1";
const STATE_TIME_KEY = "aerea-private-state-updated-at";
const SKETCH_KEY = "aerea-private-sketches-v1";

export function readBrowserState(): { state?: unknown } {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function writeBrowserState(payload: unknown) {
  localStorage.setItem(STATE_KEY, JSON.stringify(payload));
}

export function readBrowserSketches<T>(): T[] {
  try {
    return JSON.parse(localStorage.getItem(SKETCH_KEY) || "[]") as T[];
  } catch {
    return [];
  }
}

export function writeBrowserSketches<T>(pages: T[]) {
  localStorage.setItem(SKETCH_KEY, JSON.stringify(pages));
}

function callbackSessionFromUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "aerea:" ||
      url.hostname !== "auth" ||
      !url.pathname.startsWith("/callback")
    ) {
      return null;
    }

    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    const query = url.searchParams;

    const authError =
      params.get("error_description") ||
      query.get("error_description") ||
      params.get("error") ||
      query.get("error");

    if (authError) {
      throw new Error(decodeURIComponent(authError.replace(/\+/g, " ")));
    }

    const accessToken =
      params.get("access_token") || query.get("access_token");
    const refreshToken =
      params.get("refresh_token") || query.get("refresh_token");

    if (!accessToken || !refreshToken) {
      throw new Error("The sign-in link did not return a Supabase session.");
    }

    return { accessToken, refreshToken };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Could not read the sign-in link.");
  }
}

export async function requestAereaCode(email: string) {
  if (email.trim().toLowerCase() !== AEREA_ACCOUNT) {
    throw new Error("This aérea is private.");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: AEREA_ACCOUNT,
    options: {
      shouldCreateUser: true,
      ...(Capacitor.isNativePlatform()
        ? { emailRedirectTo: AEREA_AUTH_CALLBACK }
        : {}),
    },
  });

  if (error) throw error;
}

export async function verifyAereaCode(tokenOrUrl: string) {
  const value = tokenOrUrl.trim();

  if (value.toLowerCase().startsWith("aerea://")) {
    const session = callbackSessionFromUrl(value);
    if (!session) throw new Error("That is not an aérea sign-in link.");

    const { data, error } = await supabase.auth.setSession({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });
    if (error) throw error;

    const email = data.user?.email?.toLowerCase() || null;
    if (email !== AEREA_ACCOUNT) {
      await supabase.auth.signOut();
      throw new Error("This aérea is private.");
    }
    return;
  }

  const { error } = await supabase.auth.verifyOtp({
    email: AEREA_ACCOUNT,
    token: value,
    type: "email",
  });
  if (error) throw error;
}

let nativeAuthBridgeInstalled = false;
let nativeAuthCheckRunning = false;

async function consumePendingNativeAuthUrl() {
  if (
    typeof window === "undefined" ||
    !Capacitor.isNativePlatform() ||
    nativeAuthCheckRunning
  ) {
    return;
  }

  nativeAuthCheckRunning = true;
  try {
    const pending = await AereaAuth.takePendingUrl();
    if (!pending.url) return;

    await verifyAereaCode(pending.url);

    window.location.reload();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not complete private sign-in.";
    window.setTimeout(() => window.alert(message), 0);
  } finally {
    nativeAuthCheckRunning = false;
  }
}

function installNativeAuthBridge() {
  if (
    typeof window === "undefined" ||
    nativeAuthBridgeInstalled ||
    !Capacitor.isNativePlatform()
  ) {
    return;
  }

  nativeAuthBridgeInstalled = true;

  const check = () => {
    void consumePendingNativeAuthUrl();
  };

  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });

  window.setTimeout(check, 0);
  window.setTimeout(check, 500);
  window.setTimeout(check, 1500);
}

if (typeof window !== "undefined") {
  installNativeAuthBridge();
}

export async function currentAereaEmail() {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email?.toLowerCase() || null;
  return email === AEREA_ACCOUNT ? email : null;
}

export async function reconcileCloudState<T>(
  localState: T | null,
): Promise<T | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.email?.toLowerCase() !== AEREA_ACCOUNT) return localState;

  const localUpdatedAt = Number(localStorage.getItem(STATE_TIME_KEY) || "0");
  const { data, error } = await supabase
    .from("aerea_sync")
    .select("state,client_updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  if (data && Number(data.client_updated_at) > localUpdatedAt) {
    localStorage.setItem(
      STATE_TIME_KEY,
      String(data.client_updated_at),
    );
    return data.state as T;
  }

  if (localState) await pushCloudState(localState);
  return localState;
}

export async function pushCloudState(state: unknown) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.email?.toLowerCase() !== AEREA_ACCOUNT) return false;

  const updatedAt = Date.now();
  const { error } = await supabase.from("aerea_sync").upsert({
    user_id: user.id,
    state,
    client_updated_at: updatedAt,
    updated_at: new Date(updatedAt).toISOString(),
  });
  if (error) throw error;
  localStorage.setItem(STATE_TIME_KEY, String(updatedAt));
  return true;
}
