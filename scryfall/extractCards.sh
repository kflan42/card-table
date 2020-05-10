#!/bin/bash

# see https://scryfall.com/docs/api/cards and https://scryfall.com/docs/api/images
# https://archive.scryfall.com/json/scryfall-default-cards.json

# subject 2 from line number to get array index for examples
# jq "[.[12,2135,10399] | ...

# test to filter for "Official sets always have a three-letter set code". weird cards have 4 letter. tokens have "t..."

# need to output camelCase field names since using a camelCase marshmallow schema

CORE='id: .id, name: .name, setName: .set, number: .collector_number'

CARD='if .image_uris then
    {'"${CORE}"', face: .image_uris | {small: .small, normal: .normal}}
  else
    {'"${CORE}"', faces: .card_faces | map({(.name): .image_uris | {small: .small, normal: .normal}}) | add }
  end'

jq '[.[] | select(.set|test("^...$")) | '"${CARD}"']' samples/scryfall-default-cards.json > ../my-app/public/my-cards.json
jq '[.[] | select(.set|test("^t...$")) | '"${CARD}"']' samples/scryfall-default-cards.json > ../my-app/public/my-tokens.json
