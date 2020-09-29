#!/bin/bash
set -euo pipefail

# see https://scryfall.com/docs/api/cards and https://scryfall.com/docs/api/images

DEFAULT_JSON="scryfall-default-cards.json"

# subject 2 from line number to get array index for examples
# jq "[.[12,2135,10399] | ...

# test to filter for "Official sets always have a three-letter set code". weird cards have 4 letter. tokens have "t..."

CORE='sf_id: .id, name: .name, set_name: .set, number: .collector_number'

CARD='
{'${CORE}', 
  face: (if .image_uris then 
    .image_uris | { normal: .normal}
  else
    null
  end), 
  faces: (if .card_faces then
      [.card_faces[] | {name: .name,  normal: .image_uris.normal } ]
    else
      []
    end),
}'

C_FILTER='select( (.set|test("^...$")) and (.lang|test("en")) )'
T_FILTER='select( (.set|test("^t...$")) and (.lang|test("en")) )'

OUT_DIR="../my-server/cards"
mkdir -p "${OUT_DIR}"
echo "extracting fields via jq ..."

jq --compact-output '[.[] | '"${C_FILTER}"' | '"${CARD}"']' "${DEFAULT_JSON}" > "${OUT_DIR}"/cards.json
jq --compact-output '[.[] | '"${T_FILTER}"' | '"${CARD}"']' "${DEFAULT_JSON}" > "${OUT_DIR}"/tokens.json

echo "output to ${OUT_DIR}"
ls "${OUT_DIR}"
