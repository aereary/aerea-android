export function authenticatedUserId(request: Request): string | null {
  const email = request.headers
    .get("oai-authenticated-user-email")
    ?.trim()
    .toLowerCase();

  return email || null;
}

export function unauthorized() {
  return Response.json(
    { error: "Please open aérea while signed in to save your information." },
    { status: 401 },
  );
}
