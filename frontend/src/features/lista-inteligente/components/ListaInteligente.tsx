import React from "react";
import { useListaInteligente } from "../hooks/useListaInteligente";
import "../styles/listaInteligente.css";

export function ListaInteligente() {
  const {
    filtro,
    setFiltro,
    itensFiltrados,
    sentinelaRef,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useListaInteligente();

  if (isLoading) return <p>Carregando itens...</p>;
  if (error) return <p>Erro ao carregar itens.</p>;

  return (
    <section className="lista-wrapper">
      <div className="lista-container">
        <h1 className="lista-title">Lista Inteligente</h1>
        <p className="lista-subtitle">Busca instantanea com paginação infinita.</p>

        <input
          className="lista-input"
          type="text"
          value={filtro}
          onChange={(evento) => setFiltro(evento.target.value)}
          placeholder="Buscar por nome..."
        />

        {isFetching && !isFetchingNextPage ? (
          <p className="lista-status">Atualizando dados...</p>
        ) : null}

        <ul className="lista-items">
          {itensFiltrados.map((item) => (
            <li key={item.id} className="lista-item">
              <strong className="item-title">{item.nome}</strong>
              <p className="item-description">{item.descricao}</p>
              <span className="item-price">R$ {item.preco.toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <div ref={sentinelaRef} className="lista-sentinela" />

        {isFetchingNextPage ? (
          <p className="lista-status lista-status-spacing">Carregando mais itens...</p>
        ) : null}
        {!hasNextPage ? (
          <p className="lista-status lista-status-spacing">Fim da lista.</p>
        ) : null}
      </div>
    </section>
  );
}
