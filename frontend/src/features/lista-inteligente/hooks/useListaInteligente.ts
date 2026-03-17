import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { listarItens } from "../../../services/itensApi";
import {
  filtroBuscaState,
  itensCarregadosState,
  itensFiltradosState,
} from "../state/filtro";
import { useDebouncedValue } from "./useDebouncedValue";

export function useListaInteligente() {
  const [filtro, setFiltro] = useRecoilState(filtroBuscaState);
  const setItensCarregados = useSetRecoilState(itensCarregadosState);
  const itensFiltrados = useRecoilValue(itensFiltradosState);
  const sentinelaRef = useRef<HTMLDivElement | null>(null);
  const buscaServidor = useDebouncedValue(filtro, 500);

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
    queryFn: async ({ pageParam }) =>
      listarItens({
        busca: buscaServidor,
        skip: pageParam,
        limit: 20,
      }),
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

  return {
    filtro,
    setFiltro,
    itensFiltrados,
    sentinelaRef,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  };
}
