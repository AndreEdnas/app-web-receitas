// produtosService.js
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

export async function getProdutos(apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/produtos`, {
      headers: NGROK_HEADERS,
    });
    if (!response.ok) throw new Error("Erro ao carregar produtos");
    return await response.json();
  } catch (err) {
    console.error("getProdutos error:", err);
    return [];
  }
}

export async function updateProduto(apiUrl, id, data) {
  try {
    const response = await fetch(`${apiUrl}/produtos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar produto");
    return await response.json();
  } catch (err) {
    console.error("updateProduto error:", err);
    return null;
  }
  console.log("➡️ updateProduto chamada:", `${apiUrl}/produtos/${id}`, data);

}

export async function getVendasByDate(apiUrl, data) {
  try {
    const response = await fetch(`${apiUrl}/vendas/${data}`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    if (!response.ok) throw new Error("Erro ao carregar vendas");
    return await response.json();
  } catch (err) {
    console.error("getVendasByDate error:", err);
    return [];
  }
}



export async function saveAbate(apiUrl, abate) {
  try {
    const response = await fetch(`${apiUrl}/abates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(abate),
    });
    return await response.json();
  } catch (err) {
    console.error("saveAbate error:", err);
    return null;
  }
}

export async function getAbates(apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/abates`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    if (!response.ok) throw new Error("Erro ao carregar abates");
    return await response.json();
  } catch (err) {
    console.error("getAbates error:", err);
    return [];
  }
}



