import React from "react";
import { Modal } from "react-bootstrap";

export default function DiferencasModal({ show, onClose, receita, onAtualizar }) {
    if (!receita || !receita.differences) return null;

    const dif = receita.differences;

    // Verifica se um campo foi alterado
    const campoFoiAlterado = (index, campo) => {
        return dif.ingredientes.some(
            (d) => d.index === index && d.campo === campo
        );
    };

    // Construir versão ANTES com base nas differences
    const ingredientesAntigos = receita.ingredientes.map((ing, idx) => {
        const difs = dif.ingredientes.filter((d) => d.index === idx);

        let antigo = {
            produto: ing.produto,
            quantidade: ing.quantidade,
            unidade: ing.unidade,
            preco: ing.preco,
            subtotal: ing.subtotal
        };

        difs.forEach((d) => {
            if (d.campo === "produto") antigo.produto = d.antigo;
            if (d.campo === "preco") antigo.preco = d.antigo;
            if (d.campo === "unidade") antigo.unidade = d.antigo;
        });

        antigo.subtotal = antigo.preco * ing.quantidade;
        return antigo;
    });

    return (
        <Modal show={show} onHide={onClose} centered size="lg">

            {/* HEADER */}
            <Modal.Header
                className="bg-danger text-white d-flex justify-content-center position-relative"
            >
                <Modal.Title
                    className="text-center w-100 fw-bold"
                    style={{ fontSize: "1.4rem" }}
                >
                    ⚠️ Alterações Detetadas ⚠️
                </Modal.Title>

                <button
                    type="button"
                    className="btn-close btn-close-white position-absolute end-0 me-3"
                    onClick={onClose}
                ></button>
            </Modal.Header>

            {/* BODY */}
            <Modal.Body style={{ background: "#f7f7f7" }}>

                {/* TÍTULO DA RECEITA */}
                <div className="text-center my-3">
                    <h4 className="fw-bold text-primary m-0" style={{ fontSize: "1.6rem" }}>
                        {receita.nome}
                    </h4>

                    <div
                        className="mx-auto mt-1"
                        style={{
                            width: "60%",
                            height: "3px",
                            background: "#007bff20",
                            borderRadius: "50px",
                        }}
                    ></div>
                </div>

                {/* ===================== ANTES ===================== */}
                <div className="p-3 rounded shadow-sm bg-white border mb-4">
                    <h5 className="fw-bold text-center" style={{ color: "#555" }}>
                        Receita Desatualizada
                    </h5>

                    <table className="table table-bordered table-sm text-center mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Ingrediente</th>
                                <th>Qtd</th>
                                <th>Unidade</th>
                                <th>Preço / Uni</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>

                        <tbody>
                            {ingredientesAntigos.map((i, index) => (
                                <tr key={index}>
                                    <td style={{ color: campoFoiAlterado(index, "produto") ? "red" : "inherit" }}>
                                        {i.produto}
                                    </td>

                                    <td>{i.quantidade}</td>

                                    <td style={{ color: campoFoiAlterado(index, "unidade") ? "red" : "inherit" }}>
                                        {i.unidade}
                                    </td>

                                    <td style={{ color: campoFoiAlterado(index, "preco") ? "red" : "inherit" }}>
                                        {i.preco} €
                                    </td>

                                    <td style={{ color: campoFoiAlterado(index, "preco") ? "red" : "inherit" }}>
                                        {i.subtotal.toFixed(2)} €
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* SETA */}
                <div className="text-center my-3">
                    <div className="fw-bold text-muted">Atualizar para</div>
                    <span style={{ fontSize: "2.4rem", fontWeight: "bold" }}>⬇️</span>

                </div>

                {/* ===================== DEPOIS ===================== */}
                {/* NOVO NOME — APENAS SE DIFERENTE */}
                {dif.nome && (
                    <div className="text-center my-4">

                        {/* Título azul */}
                        <h4
                            className="fw-bold m-0"
                            style={{ color: "#007bff", fontSize: "1.6rem" }}
                        >
                            {dif.nome.novo}
                        </h4>

                        {/* Linha azul clarinha */}
                        <div
                            className="mx-auto mt-2"
                            style={{
                                width: "60%",
                                height: "3px",
                                background: "#cfe2ff",   // azul clarinho igual ao screenshot
                                borderRadius: "50px",
                            }}
                        ></div>

                    </div>
                )}

                <div className="p-3 rounded shadow-sm bg-white border mb-2">
                    <h5
                        className="fw-bold text-center mb-3"
                        style={{ color: "#555" }}  // verde escuro premium
                    >
                        Receita Atualizada
                    </h5>

                    <table className="table table-bordered table-sm text-center mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Ingrediente</th>
                                <th>Qtd</th>
                                <th>Unidade</th>
                                <th>Preço / Uni</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>

                        <tbody>
                            {(receita.ingredientesNovos || receita.ingredientes).map((i, index) => (

                                <tr key={index}>
                                    <td style={{ color: campoFoiAlterado(index, "produto") ? "#0A8A32" : "inherit" }}>
                                        {i.produto}
                                    </td>

                                    <td>{i.quantidade}</td>

                                    <td style={{ color: campoFoiAlterado(index, "unidade") ? "#0A8A32" : "inherit" }}>
                                        {i.unidade}
                                    </td>

                                    <td style={{ color: campoFoiAlterado(index, "preco") ? "#0A8A32" : "inherit" }}>
                                        {i.preco} €
                                    </td>

                                    <td style={{ color: campoFoiAlterado(index, "preco") ? "#0A8A32" : "inherit" }}>
                                        {i.subtotal.toFixed(2)} €
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal.Body>

            {/* FOOTER */}
            <Modal.Footer className="d-flex justify-content-end gap-2">
                <button
                    className="btn btn-success d-flex align-items-center gap-2"
                    onClick={() => {
                        onAtualizar(receita);
                        onClose();
                    }}
                >
                    💾 <span>Atualizar Receita</span>
                </button>

                <button className="btn btn-secondary" onClick={onClose}>
                    Fechar
                </button>
            </Modal.Footer>
        </Modal>
    );
}
