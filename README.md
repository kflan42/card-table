# card-table
My first serious side project! A React front end and Flask back end for a multiplayer card game.

If you'd like to play with the code, I recommend first having a look at the [design diagrams](design.md).

If you're here for gaming, read on.

![card-table-busy-game](https://user-images.githubusercontent.com/29559579/158732762-fe4509d3-08af-4eb5-8f6b-606f1128a52d.jpg)

## Features

Everything you need for a night of a table top card game with friends, assuming you already have voice or text chat solved. 

One can:

 * create rooms with _privacy by obscurity_.
 * create tables within the rooms, play 1 game per table.
 * load your cards based on an imported deck list.
 * chose your name and your sleeve color.
 * get an idea of who is on what table and join the table.
 * see your cards in various gameplay zones.
 * place simple counters or import other cards as needed for counters.
 * know when other players are moving cards around or peeking.
 * undo any action (if your friends let you).

## Instructions for Deployment

I run it in the Google App Engine's Free Tier for my friends - sorry I can't fit more players on the tiny backend! You'll need to host it yourself if you want to play.

To stay on top of new card releases, I setup a Cloud Scheduler triggered Cloud Function to reload the card data.

See [my-server/README.md](my-server/README.md) for deployment instructions.

## Instructions for Play

I recommend getting a tutorial from someone who knows it. Within minutes you'll be talking about the game instead of the interface.

You can read these in the game interface by hovering over the ❔, but here they are for an idea of what's possible.

Drag and drop cards for most things. Click on a card to tap/untap it.

Keyboard actions:
```
key	action
a	to draw a line from your 1st click on a card/player to your 2nd click on a card/player
A	clear your lines
n	pass turn to next player
	----
D	draw a card
M	mulligan dialog
c	create a counter on a card
C	create a token card, can choose to copy if cursor is over a card
B	put card on bottom of Library
G	put card in Graveyard
E	put card in Exile
F	turn a card facedown (or up)
R	rotate a card 180 degrees (e.g. a Flip card)
T	transform or turn over a two-side card
U	untap all your tapped cards
	----
^	vote to reset the game, counters and tokens will vanish and cards not in sideboard will go to library
v	view a large popup of the card under the cursor, press again to close
V	view a large popup of the other side of the card under the cursor
H	hide a player (or show a hidden one) via a dialog
O	open the options dialog to configure stuff
```

Click on the table to focus input there then press the key.

Click on the 🎲 to simulate die rolls or coin flips.

Click on the ➕ to add a Player Counter such as Poison or Commander Damage.

----

_Portions of Card-Table are unofficial Fan Content permitted under the [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy). Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC._

_[Scryfall](https://scryfall.com/) is used as a data source. Not approved/endorsed by Scryfall._
