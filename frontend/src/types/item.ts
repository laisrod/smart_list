export type Item = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
};

export type ItensResponse = {
  itens: Item[];
  total: number;
  has_more: boolean;
};
