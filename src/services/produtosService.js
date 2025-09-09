const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

export async function getProdutos(apiUrl) {
  const res = await fetch(`${apiUrl}/api/produtos`, {
    headers: NGROK_HEADERS,
  });
  if (!res.ok) return [];
  return await res.json();
}
