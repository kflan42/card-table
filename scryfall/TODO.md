

get the js to download (and cache) card images

normal quality jpg is 80kb per image, so 40mb for a 500 card game

deck is loaded in as text file from tapped out etc

https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
localStorage for the win, tho limit still around 50mb to 20% of free space (okay for this)
https://stackoverflow.com/questions/19183180/how-to-save-an-image-to-localstorage-and-display-it-on-the-next-page

https://scryfall.com/docs/api/cards

# to implement
 - clients send their decks to the server
   - deck is list of card names
 - serve the card info json (just essential fields) from my flask server
 - client can load the image based on url in that json
   - client should cache these, in localstorage - need to serialize to base64, bloats a little