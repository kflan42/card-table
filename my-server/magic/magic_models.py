from dataclasses import dataclass
from typing import Dict
from uuid import UUID

from marshmallow import Schema


@dataclass
class Face:
    small: str
    normal: str


FaceSchema = Schema.from_dataclass(Face)


@dataclass
class Card:
    id: UUID
    name: str
    set_name: str
    number: str
    face: Face = None
    faces: Dict[str, Face] = None


CardSchema = Schema.from_dataclass(Card)  # Scryfall schema snake_case, not camelCase

if __name__ == "__main__":
    c1 = CardSchema().load(
        {
            "id": "59cf9b3b-21ec-43c3-80d3-2e3c99f34714",
            "name": "Piper of the Swarm",
            "set_name": "prm",
            "number": "78862",
            "face": {
                "small": "https://img.scryfall.com/cards/small/front/5/9/59cf9b3b-21ec-43c3-80d3-2e3c99f34714.jpg?1585972274",
                "normal": "https://img.scryfall.com/cards/normal/front/5/9/59cf9b3b-21ec-43c3-80d3-2e3c99f34714.jpg?1585972274"
            }
        }
    )
    print(c1)

    c2 = CardSchema().load(
        {
            "id": "5646ea19-0025-4f88-ad22-36968a1d3b89",
            "name": "Nightmare Moon // Princess Luna",
            "set_name": "ptg",
            "number": "1",
            "faces": {
                "Nightmare Moon": {
                    "small": "https://img.scryfall.com/cards/small/front/5/6/5646ea19-0025-4f88-ad22-36968a1d3b89.jpg?1583354618",
                    "normal": "https://img.scryfall.com/cards/normal/front/5/6/5646ea19-0025-4f88-ad22-36968a1d3b89.jpg?1583354618"
                },
                "Princess Luna": {
                    "small": "https://img.scryfall.com/cards/small/back/5/6/5646ea19-0025-4f88-ad22-36968a1d3b89.jpg?1583354618",
                    "normal": "https://img.scryfall.com/cards/normal/back/5/6/5646ea19-0025-4f88-ad22-36968a1d3b89.jpg?1583354618"
                }
            }
        }
    )
    print(c2)
