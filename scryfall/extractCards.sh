#!/bin/bash

# see https://scryfall.com/docs/api/cards and https://scryfall.com/docs/api/images

DEFAULT_JSON="scryfall-default-cards.json"

if [[ -f "${DEFAULT_JSON}" ]]; then
  if [[ $(date -r "${DEFAULT_JSON}" "+%m-%d-%Y") != $(date "+%m-%d-%Y") && \
        $(date -r "${DEFAULT_JSON}" "+%m-%d-%Y") != $(date "+%m-%d-%Y" "--date" "yesterday") ]]; then
    echo "stale json, moving to .old"
    rm "${DEFAULT_JSON}.old"
    mv "${DEFAULT_JSON}" "${DEFAULT_JSON}.old"
    DOWNLOAD_JSON=1
  else
    echo "new enough ${DEFAULT_JSON}"
  fi
else
  echo "${DEFAULT_JSON} not present"
  DOWNLOAD_JSON=1
fi

if [[ $DOWNLOAD_JSON ]]; then
  curl -o "${DEFAULT_JSON}" "https://archive.scryfall.com/json/${DEFAULT_JSON}"
fi

# subject 2 from line number to get array index for examples
# jq "[.[12,2135,10399] | ...

# test to filter for "Official sets always have a three-letter set code". weird cards have 4 letter. tokens have "t..."

CORE='sf_id: .id, name: .name, set_name: .set, number: .collector_number'
FACE='.image_uris | {small: .small, normal: .normal}'

CARD='if .image_uris then
    {'${CORE}', face: '${FACE}'}
  else
    {'${CORE}', faces: [.card_faces[] | {name: .name, small: .image_uris.small, normal: .image_uris.normal } ] }
  end'

OUT_DIR="../my-server/data/cards"

mkdir -p "${OUT_DIR}"

jq --compact-output '[.[] | select(.set|test("^...$")) | '"${CARD}"']' "${DEFAULT_JSON}" > "${OUT_DIR}"/cards.json
jq --compact-output '[.[] | select(.set|test("^t...$")) | '"${CARD}"']' "${DEFAULT_JSON}" > "${OUT_DIR}"/tokens.json

echo "output to ${OUT_DIR}"
ls "${OUT_DIR}"
