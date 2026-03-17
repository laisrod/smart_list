import { atom, selector } from "recoil";

export type Item = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
};

export const filtroBuscaState = atom<string>({
  key: "filtroBuscaState",
  default: "",
});

export const itensCarregadosState = atom<Item[]>({
  key: "itensCarregadosState",
  default: [],
});

export const itensFiltradosState = selector<Item[]>({
  key: "itensFiltradosState",
  get: ({ get }) => {
    const filtro = get(filtroBuscaState).trim().toLowerCase();
    const itens = get(itensCarregadosState);

    if (!filtro) return itens;

    return itens.filter((item) => item.nome.toLowerCase().includes(filtro));
  },
});
