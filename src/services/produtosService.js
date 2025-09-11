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

