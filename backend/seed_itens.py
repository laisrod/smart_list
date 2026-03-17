import os
import random

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "shoptimus")
MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "itens")


def gerar_itens(quantidade: int = 120) -> list[dict]:
    categorias = [
        "Camiseta",
        "Calca",
        "Tenis",
        "Mochila",
        "Fone",
        "Relogio",
        "Jaqueta",
        "Livro",
    ]

    itens: list[dict] = []
    for i in range(1, quantidade + 1):
        categoria = categorias[(i - 1) % len(categorias)]
        itens.append(
            {
                "nome": f"{categoria} Modelo {i}",
                "descricao": f"Descricao do item {i} da categoria {categoria}.",
                "preco": round(random.uniform(29.9, 899.9), 2),
            }
        )
    return itens


def main() -> None:
    # Seed rapido: limpa a colecao para garantir paginacao previsivel no teste.
    client = MongoClient(MONGODB_URL)
    collection = client[MONGODB_DATABASE][MONGODB_COLLECTION]

    collection.delete_many({})
    resultado = collection.insert_many(gerar_itens(120))

    print(f"Seed concluido: {len(resultado.inserted_ids)} itens inseridos em '{MONGODB_COLLECTION}'.")


if __name__ == "__main__":
    main()
