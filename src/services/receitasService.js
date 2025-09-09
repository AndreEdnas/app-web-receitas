const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

export async function getReceitas(apiUrl) {
  const res = await fetch(`${apiUrl}/api/receitas`, {
    headers: NGROK_HEADERS,
  });
  if (!res.ok) {
    console.error("❌ Erro HTTP:", res.status, res.statusText);
    return [];
  }
  return await res.json();
}


export async function addReceita(apiUrl, receita) {
  const res = await fetch(`${apiUrl}/api/receitas`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...NGROK_HEADERS,
    },
    body: JSON.stringify(receita),
  });
  return await res.json();
}

export async function deleteReceita(apiUrl, id) {
  const res = await fetch(`${apiUrl}/api/receitas/${id}`, { 
    method: "DELETE",
    headers: NGROK_HEADERS,
  });
  return await res.json();
}

export async function updateReceita(apiUrl, id, receita) {
  const res = await fetch(`${apiUrl}/api/receitas/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      ...NGROK_HEADERS,
    },
    body: JSON.stringify(receita),
  });
  return await res.json();
}
