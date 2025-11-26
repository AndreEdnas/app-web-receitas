import React, { useEffect, useState } from "react";
import { getAbates } from "../services/produtosService";

export default function HistoricoPage() {
  const apiUrl = localStorage.getItem("apiUrl");
  const [abates, setAbates] = useState({});
  const [semanaSelecionada, setSemanaSelecionada] = useState("");

  // converter formatos de datas
  const toISO = (s) => {
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
  };

  const getWeekKey = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  };

  const getWeekRange = (weekKey) => {
    if (!weekKey) return "";
    const [y, w] = weekKey.split("-W");
    const year = parseInt(y);
    const week = parseInt(w);

    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = new Date(simple);
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

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

  const agruparProdutosDia = (registros) => {
    const map = {};
    registros.forEach((abate) => {
      abate.registros?.forEach((r) => {
        if (r.tipo === "receita") {
          r.produtos.forEach((p) => {
            if (!map[p.produto]) map[p.produto] = { antes: p.antes, abate: 0, depois: p.depois };
            map[p.produto].abate += p.abate;
            map[p.produto].depois = p.depois;
          });
        } else {
          if (!map[r.produto]) map[r.produto] = { antes: r.antes, abate: 0, depois: r.depois };
          map[r.produto].abate += r.abate;
          map[r.produto].depois = r.depois;
        }
      });
    });
    return Object.entries(map).map(([produto, data]) => ({ produto, ...data }));
  };

  const diasSemana =
    semanaSelecionada
      ? Object.entries(abates)
          .filter(([dia]) => getWeekKey(dia) === semanaSelecionada)
          .sort(([a], [b]) => new Date(a) - new Date(b))
      : [];

  return (
    <div className="container mt-4">

      {/* HEADER */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-1">📚 Histórico</h2>
          <small className="text-muted">Veja os abates da semana de forma organizada e clara.</small>
        </div>

        <div style={{ minWidth: "220px" }}>
          <label className="form-label fw-bold">Selecionar Data</label>
          <input
            type="date"
            className="form-control shadow-sm"
            onChange={(e) =>
              e.target.value && setSemanaSelecionada(getWeekKey(e.target.value))
            }
          />
        </div>
      </div>

      {/* SEMANA SELECIONADA */}
      {semanaSelecionada && (
        <div className="mb-4">
          <div className="card border-0 shadow-sm p-3 bg-light">
            <h4 className="text-secondary fw-bold mb-1">
              📅 Semana {semanaSelecionada}
            </h4>
            <span className="text-muted">{getWeekRange(semanaSelecionada)}</span>
          </div>
        </div>
      )}

      {/* LISTAGEM POR DIA */}
      {diasSemana.length === 0 ? (
        <p className="text-muted">Nenhum registo encontrado para esta semana.</p>
      ) : (
        diasSemana.map(([dia, registos]) => {
          const produtos = agruparProdutosDia(registos);

          return (
            <div key={dia} className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-primary bg-opacity-10">
                <h5 className="mb-0 text-primary fw-bold">📅 {dia}</h5>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "40%" }}>Produto</th>
                        <th className="text-end">Antes</th>
                        <th className="text-end text-danger">Abate</th>
                        <th className="text-end">Depois</th>
                      </tr>
                    </thead>

                    <tbody>
                      {produtos.map((p, i) => (
                        <tr key={i}>
                          <td>{p.produto}</td>
                          <td className="text-end">{p.antes}</td>
                          <td className="text-end text-danger fw-bold">
                            -{p.abate}
                          </td>
                          <td className="text-end">{p.depois}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
