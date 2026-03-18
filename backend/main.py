import os
from typing import Any

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="ShoptimusAI API")

cors_origins_env = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "shoptimus")
MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "itens")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[MONGODB_DATABASE]
collection: AsyncIOMotorCollection = db[MONGODB_COLLECTION]


class ItemOut(BaseModel):
    id: str
    nome: str
    descricao: str
    preco: float


class ItensResponse(BaseModel):
    itens: list[ItemOut]
    total: int
    has_more: bool


class ItensQueryParams(BaseModel):
    busca: str = Field(default="")
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1)


def get_itens_query_params(
    busca: str = Query(default=""),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1),
) -> ItensQueryParams:
    return ItensQueryParams(busca=busca, skip=skip, limit=limit)


def serialize_item(document: dict[str, Any]) -> ItemOut:
    return ItemOut(
        id=str(document["_id"]),
        nome=document.get("nome", ""),
        descricao=document.get("descricao", ""),
        preco=float(document.get("preco", 0)),
    )


@app.get("/itens", response_model=ItensResponse)
async def listar_itens(params: ItensQueryParams = Depends(get_itens_query_params)) -> ItensResponse:
    filtro: dict[str, Any] = {}
    if params.busca.strip():
        filtro["nome"] = {"$regex": params.busca.strip(), "$options": "i"}

    total = await collection.count_documents(filtro)

    cursor = (
        collection.find(filtro)
        .sort("_id", 1)
        .skip(params.skip)
        .limit(params.limit)
    )
    documentos = await cursor.to_list(length=params.limit)
    itens = [serialize_item(doc) for doc in documentos if isinstance(doc.get("_id"), ObjectId)]

    has_more = params.skip + len(itens) < total
    return ItensResponse(itens=itens, total=total, has_more=has_more)
