#!/bin/bash

# see https://scryfall.com/docs/api/cards and https://scryfall.com/docs/api/images

DEFAULT_JSON="scryfall-default-cards.json"

wget  "https://archive.scryfall.com/json/${DEFAULT_JSON}"

# subject 2 from line number to get array index for examples
# jq "[.[12,2135,10399] | ...

# test to filter for "Official sets always have a three-letter set code". weird cards have 4 letter. tokens have "t..."

CORE='sf_id: .id, name: .name, set_name: .set, number: .collector_number'

CARD='if .image_uris then
    {'"${CORE}"', face: .image_uris | {small: .small, normal: .normal}}
  else
    {'"${CORE}"', faces: .card_faces | map({(.name): .image_uris | {small: .small, normal: .normal}}) | add }
  end'

OUT_DIR="../my-server/data/cards"

mkdir -p "${OUT_DIR}"

jq '[.[] | select(.set|test("^...$")) | '"${CARD}"']' "${DEFAULT_JSON}" > "${OUT_DIR}"/cards.json
jq '[.[] | select(.set|test("^t...$")) | '"${CARD}"']' "${DEFAULT_JSON}" > "${OUT_DIR}"/tokens.json

cp "${OUT_DIR}"/* ../my-app/public

echo "output to ${OUT_DIR} and ../my-app/public"
ls "${OUT_DIR}"
