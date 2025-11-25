import React, { useEffect, useState } from "react";
import { getAbates } from "../services/produtosService";

export default function AbatesPage() {
  const apiUrl = localStorage.getItem("apiUrl");
  const [abates, setAbates] = useState({});
  const [semanaSelecionada, setSemanaSelecionada] = useState("");

  // helper: converte "DD-MM-YYYY" -> "YYYY-MM-DD"
  const toISO = (s) => {
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); // já ISO
    const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
  };

  // devolve chave da semana ISO (ex: "2025-W37")
  const getWeekKey = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  };

  // devolve intervalo (segunda → domingo) de uma semana
  const getWeekRange = (weekKey) => {
    if (!weekKey) return "";
    const [yearStr, weekStr] = weekKey.split("-W");
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);

    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = new Date(simple);
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }

    const monday = new Date(ISOweekStart);
    const sunday = new Date(ISOweekStart);
    sunday.setDate(monday.getDate() + 6);

    const fmt = (x) => x.toISOString().slice(0, 10);
    return `${fmt(monday)} → ${fmt(sunday)}`;
  };

  useEffect(() => {
    if (!apiUrl) return;
    (async () => {
      const raw = await getAbates(apiUrl);

      // normalizar para { "YYYY-MM-DD": [abates...] }
      let normalizado = {};
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        Object.entries(raw).forEach(([k, v]) => {
          normalizado[toISO(k)] = v;
        });
      } else if (Array.isArray(raw)) {
        normalizado = raw.reduce((acc, item) => {
          const dia = toISO(item.data);
          acc[dia] = acc[dia] || [];
          acc[dia].push(item);
          return acc;
        }, {});
      }

      setAbates(normalizado);

      const dias = Object.keys(normalizado).sort().reverse();
      if (dias.length > 0) {
        setSemanaSelecionada(getWeekKey(dias[0]));
      }
    })();
  }, [apiUrl]);

  if (!apiUrl) return <p>🔄 A carregar ligação à API...</p>;

  // junta produtos iguais de um dia
  const agruparProdutosDia = (registrosDia) => {
    const produtosMap = {};
    registrosDia.forEach((abate) => {
      if (!Array.isArray(abate.registros)) return;
      abate.registros.forEach((r) => {
        if (r.tipo === "receita" && Array.isArray(r.produtos)) {
          r.produtos.forEach((p) => {
            if (!produtosMap[p.produto]) {
              produtosMap[p.produto] = { antes: p.antes, abate: 0, depois: p.depois };
            }
            produtosMap[p.produto].abate += p.abate;
            produtosMap[p.produto].depois = p.depois;
          });
        } else {
          if (!produtosMap[r.produto]) {
            produtosMap[r.produto] = { antes: r.antes, abate: 0, depois: r.depois };
          }
          produtosMap[r.produto].abate += r.abate;
          produtosMap[r.produto].depois = r.depois;
        }
      });
    });
    return Object.entries(produtosMap).map(([nome, dados]) => ({
      produto: nome,
      ...dados,
    }));
  };

  // registos da semana selecionada por dia
  const diasSemana =
    semanaSelecionada
      ? Object.entries(abates)
          .filter(([dia]) => getWeekKey(dia) === semanaSelecionada)
          .sort(([a], [b]) => new Date(a) - new Date(b))
      : [];

  return (
    <div className="container mt-4">
      <h2 className="text-primary">📚 Histórico de Abates (por semana)</h2>

      {Object.keys(abates).length === 0 ? (
        <p className="text-muted">Nenhum abate registado ainda.</p>
      ) : (
        <>
          {/* seletor calendário */}
          <div className="mb-3 d-flex flex-column align-items-center">
            <label className="form-label fw-bold mb-2">📅 Escolhe uma data:</label>
            <input
              type="date"
              className="form-control text-center"
              style={{ maxWidth: "200px" }}
              onChange={(e) => {
                if (e.target.value) {
                  setSemanaSelecionada(getWeekKey(e.target.value));
                }
              }}
            />
          </div>

          {/* tabelas da semana */}
          {semanaSelecionada ? (
            <>
              <h4 className="text-secondary mb-3">
                📅 Semana {semanaSelecionada} ({getWeekRange(semanaSelecionada)})
              </h4>

              {diasSemana.length > 0 ? (
                diasSemana.map(([dia, registos]) => {
                  const produtos = agruparProdutosDia(registos);
                  return (
                    <div key={dia} className="mb-4">
                      <h5 className="fw-bold text-primary">📅 {dia}</h5>
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Produto</th>
                            <th>Antes</th>
                            <th>Abate</th>
                            <th>Depois</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produtos.length > 0 ? (
                            produtos.map((p, i) => (
                              <tr key={i}>
                                <td>{p.produto}</td>
                                <td>{p.antes}</td>
                                <td className="text-danger fw-bold">-{p.abate}</td>
                                <td>{p.depois}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center text-muted">
                                Nenhum abate registado neste dia.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted">Nenhum abate registado nesta semana.</p>
              )}
            </>
          ) : (
            <p className="text-muted">Seleciona uma data no calendário.</p>
          )}
        </>
      )}
    </div>
  );
}
