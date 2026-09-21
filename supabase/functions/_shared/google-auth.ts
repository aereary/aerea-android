export async function googleEmailFromToken(
  token: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          authorization: "Bearer " + token,
          accept: "application/json",
        },
      },
    );
    if (!response.ok) return null;

    const payload = await response.json() as {
      email?: unknown;
      email_verified?: unknown;
    };
    if (payload?.email_verified !== true) return null;
    if (typeof payload.email !== "string" || !payload.email.trim()) return null;
    return payload.email.trim().toLowerCase();
  } catch {
    return null;
  }
}
