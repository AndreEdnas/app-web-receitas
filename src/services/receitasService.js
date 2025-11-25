
export async function getReceitas(apiUrl) {
  const res = await fetch(`${apiUrl}/receitas`, {

  });
  if (!res.ok) {
    console.error("❌ Erro HTTP:", res.status, res.statusText);
    return [];
  }
  return await res.json();
}


export async function addReceita(apiUrl, receita) {
  const res = await fetch(`${apiUrl}/receitas`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
  
    },
    body: JSON.stringify(receita),
  });
  return await res.json();
}

export async function deleteReceita(apiUrl, id) {
  const res = await fetch(`${apiUrl}/receitas/${id}`, { 
    method: "DELETE",
   
  });
  return await res.json();
}

export async function updateReceita(apiUrl, id, receita) {
  const res = await fetch(`${apiUrl}/receitas/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
    
    },
    body: JSON.stringify(receita),
  });
  return await res.json();
}
