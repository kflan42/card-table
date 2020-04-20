#!/bin/bash

# see https://scryfall.com/docs/api/cards and https://scryfall.com/docs/api/images
# https://archive.scryfall.com/json/scryfall-default-cards.json

# subject 2 from line number to get array index for examples
# jq "[.[12,2135,10399] | ...

# test to filter for "Official sets always have a three-letter set code". weird cards have 4 letter.

jq '[.[] | select(.set|test("^...$")) | if .image_uris then 
    {name: .name, set: .set, num: .collector_number, face: .image_uris.normal}
  else
    {name: .name, set: .set, num: .collector_number, faces: .card_faces | map({(.name): .image_uris.normal}) | add  }
  end]' samples/scryfall-default-cards.json > ../my-app/public/my-cards.json
