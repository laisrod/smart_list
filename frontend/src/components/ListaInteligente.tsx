import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  filtroBuscaState,
  itensCarregadosState,
  itensFiltradosState,
  type Item,
} from "../atoms/filtro";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

type ItensResponse = {
  itens: Item[];
  total: number;
  has_more: boolean;
};

export function ListaInteligente() {
  const [filtro, setFiltro] = useRecoilState(filtroBuscaState);
  const setItensCarregados = useSetRecoilState(itensCarregadosState);
  const itensFiltrados = useRecoilValue(itensFiltradosState);
  const [buscaServidor, setBuscaServidor] = useState(filtro);
  const sentinelaRef = useRef<HTMLDivElement | null>(null);

  // Debounce simples: filtro local é instantaneo, busca no servidor só após pausa na digitacao.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setBuscaServidor(filtro);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [filtro]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: ["itens", buscaServidor],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const resposta = await api.get<ItensResponse>("/itens", {
        params: {
          busca: buscaServidor,
          skip: pageParam,
          limit: 20,
        },
      });
      return resposta.data;
    },
    getNextPageParam: (ultimaPagina, paginas) => {
      if (!ultimaPagina.has_more) return undefined;
      const totalCarregado = paginas.reduce(
        (acumulado, pagina) => acumulado + pagina.itens.length,
        0
      );
      return totalCarregado;
    },
  });

  const itensAgrupados = useMemo(
    () => data?.pages.flatMap((pagina) => pagina.itens) ?? [],
    [data]
  );

  useEffect(() => {
    setItensCarregados(itensAgrupados);
  }, [itensAgrupados, setItensCarregados]);

  useEffect(() => {
    if (!sentinelaRef.current) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        const entrada = entradas[0];
        if (entrada.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(sentinelaRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <p>Carregando itens...</p>;
  if (error) return <p>Erro ao carregar itens.</p>;

  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "1rem" }}>
      <h1>Lista Inteligente</h1>

      <input
        type="text"
        value={filtro}
        onChange={(evento) => setFiltro(evento.target.value)}
        placeholder="Buscar por nome..."
        style={{
          width: "100%",
          padding: "0.75rem",
          marginBottom: "1rem",
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      />

      {isFetching && !isFetchingNextPage ? <p>Atualizando dados...</p> : null}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {itensFiltrados.map((item) => (
          <li
            key={item.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              marginBottom: "0.75rem",
              padding: "0.75rem",
            }}
          >
            <strong>{item.nome}</strong>
            <p style={{ margin: "0.5rem 0" }}>{item.descricao}</p>
            <span>R$ {item.preco.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div ref={sentinelaRef} style={{ height: 1 }} />

      {isFetchingNextPage ? <p>Carregando mais itens...</p> : null}
      {!hasNextPage ? <p>Fim da lista.</p> : null}
    </section>
  );
}
