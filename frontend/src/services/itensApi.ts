import { api } from "./api";
import type { ItensResponse } from "../types/item";

type ListarItensParams = {
  busca: string;
  skip: number;
  limit?: number;
};

export async function listarItens({
  busca,
  skip,
  limit = 20,
}: ListarItensParams): Promise<ItensResponse> {
  const resposta = await api.get<ItensResponse>("/itens", {
    params: { busca, skip, limit },
  });
  return resposta.data;
}
