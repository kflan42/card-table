import React, {useState, ChangeEvent} from 'react'
import {useSelector} from 'react-redux'
import {ClientState, LIBRARY, HAND, GRAVEYARD} from '../ClientState'
import StackCard from './StackCard'
import {useDrop, DropTargetMonitor} from 'react-dnd'
import {ItemTypes, DragCard} from './DnDUtils'
import {SHUFFLE_LIBRARY, MESSAGE} from '../Actions'
import {useConfirmation} from './ConfirmationService'
import {ConfirmationResult} from './ConfirmationDialog'
import {usePlayerActions} from '../PlayerDispatch'
import CardDB from "../CardDB";
import { CardMove } from '../magic_models'

interface CardStackP {
    name: string
    icon?: string
    owner: string
}


const CardStack: React.FC<CardStackP> = ({name, icon = null, owner}) => {

    const [shown, setShown] = useState(false)
    const [query, setQuery] = useState('')
    const [topN, setTopN] = useState<number[]>([])

    const zoneState = useSelector((state: ClientState) => {
        return state.game.zones[`${owner}-${name}`]
    })

    const cards = useSelector((state: ClientState) => state.game.cards)
    const tableCards = useSelector((state: ClientState) => state.game.tableCards)
    const playerName = useSelector((state: ClientState) => state.playerPrefs.name)

    const {action:playerDispatch, baseAction} = usePlayerActions()
    const confirmation = useConfirmation();

    function stackButtonClicked(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (!shown) {
            if (zoneState.name === LIBRARY) {
                confirmation({
                    choices: ["Search", "Look at Top _"].concat(zoneState.owner === playerName ? ["Draw _"] : []),
                    catchOnCancel: true,
                    title: `${zoneState.name} Action?`,
                    description: "",
                    location: {x: e.clientX, y: e.clientY}
                })
                    .then((s: ConfirmationResult) => {
                        switch (s.choice) {
                            case "Draw _":
                                const draws: CardMove[] = []
                                for (let i = 0; i < s.n; i++) {
                                    const cardMove = {
                                        card_id: zoneState.cards[i],
                                        src_zone: zoneState.name,
                                        src_owner: owner,
                                        tgt_zone: HAND,
                                        tgt_owner: owner,
                                        to_idx: 0, // put first
                                    }
                                    draws.push(cardMove)
                                }
                                playerDispatch({...baseAction(), card_moves:draws, kind:s.choice})
                                return; // don't want to show
                            case "Search":
                                setTopN([]);
                                break;
                            case "Look at Top _":
                                setTopN(zoneState.cards.slice(0, s.n))
                                break;
                        }
                        setShown(true)
                        setQuery('')
                        playerDispatch({...baseAction(), kind:MESSAGE, 
                            message:` ${s.choice.replace("_", `${s.n} of`)} ${playerName === owner ? "their" : `${owner}'s`} Library`})
                            // TODO move library looking / searching stuff to server to avoid client side hacking
                    })
                    .catch(() => setShown(false));
            } else {
                if (zoneState.name === HAND && playerName !== owner) {
                    playerDispatch({...baseAction(), kind:MESSAGE, message:` looked at ${owner}'s Hand`})
                    // TODO move hand looking to server to avoid client side hacking
                }
                setShown(true)
                setQuery('')
            }
        } else {
            setShown(false)
        }
    }

    function closeShuffleClicked(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        setShown(!shown)
        if (!shown) {
            setQuery('')
        }
        playerDispatch({...baseAction(), kind:`${SHUFFLE_LIBRARY}_${owner}`})
    }

    function queryChanged(event: ChangeEvent<HTMLInputElement>) {
        setQuery(event.target.value)
    }

    const label = icon ? icon : name;

    const [{isOver, dragCardOwner}, drop] = useDrop({
        accept: [ItemTypes.BFCARD, ItemTypes.CARD],
        drop(item: DragCard, monitor: DropTargetMonitor) {
            const cardMove = {
                card_id: item.cardId,
                src_zone: item.srcZone,
                src_owner: item.srcOwner,
                tgt_zone: name,
                tgt_owner: owner,
                to_idx: zoneState.name === GRAVEYARD ? 0 : null // drop on bottom
            }
            if (zoneState.name === LIBRARY) {
                confirmation({
                    choices: ["Top", "Insert _ from Top", "Bottom"],
                    catchOnCancel: true,
                    title: `Put Card Where?`,
                    description: "",
                    location: {x: monitor.getClientOffset()?.x || 0, y: monitor.getClientOffset()?.y || 0},
                    initialNumber: 1, // 0 from top would be top
                })
                    .then((s: ConfirmationResult) => {
                        switch (s.choice) {
                            case "Top":
                                cardMove.to_idx = 0;
                                break;
                            case "Insert _ from Top":
                                cardMove.to_idx = s.n; // 0 based indexing
                                break;
                            case "Bottom":
                                cardMove.to_idx = null;
                                break;
                        }
                        playerDispatch({...baseAction(), card_moves:[cardMove]})
                    })
                    .catch(() => null);
            } else if (item.srcOwner === owner && item.srcZone === zoneState.name) {
                return //nothing to do if in same zone, not doing order here like that
            } else {
                playerDispatch({...baseAction(), card_moves:[cardMove]})
            }
        },
        collect: (monitor: DropTargetMonitor) => ({
            isOver: monitor.isOver(),
            dragCardOwner: monitor.getItem()?.srcOwner
        }),
    })

    const size = zoneState ? zoneState.cards.length : 0
    const cardsShown = topN.length > 0 ? topN.length : size
    const cardHeight = useSelector((state: ClientState) => {
        return state.playerPrefs.bfCardSize/2 + state.playerPrefs.handCardSize/2;
    })

    function renderPopupBox() {
        const target_cols = 1 + Math.round(Math.sqrt(cardsShown - 7))
        const cards_per_col = Math.round(cardsShown / target_cols)
        const cardPortionShown = Math.max(1 / 3, Math.min(2 / cards_per_col, 1))
        const shownHeight = cardHeight * cardPortionShown
        const cardWidth = shownHeight / cardPortionShown * 146 / 204.0 // show top 1/7th, use small image ratio
        const boxHeight = shownHeight * cards_per_col * 1.1; // .1 margins, scrollbar
        const boxWidth = target_cols * cardWidth * 1.1
        const listItems = []
        if (zoneState) {
            const cardsToShow = topN.length > 0 ? topN : zoneState.cards
            for (let i = 0; i < cardsToShow.length; i++) {
                const cardId = cardsToShow[i];
                if (zoneState.cards.indexOf(cardId) < 0) {
                    continue
                } // skip cards removed since opened topN
                if (!query
                    || cards[cardId].facedown
                    || CardDB.getCard(tableCards[cardId].sf_id).name.toLowerCase().indexOf(query.toLowerCase()) > -1) {
                    listItems.push(
                        <StackCard key={cardId} cardId={cardId} height={shownHeight} width={cardWidth}
                                   zone={name} owner={owner}/>
                    )
                }
            }
        }

        return (<div className="StackPopUpBox">
                <div style={{display: "flex", justifyContent: "left", alignItems: "baseline", margin: "0.1em"}}>
                    <span>{name}</span>&nbsp;
                    {cardsShown > 7
                        ?
                        <span>Search:<input value={query} type="text" id="query" name="query" onChange={queryChanged}/></span>
                        : null}
                    {name === LIBRARY
                        ? <button style={{textAlign: "right", cursor: "pointer"}} onClick={e => closeShuffleClicked(e)}>
                            Close &amp; Shuffle</button>
                        : null}
                    <button style={{textAlign: "right", cursor: "pointer"}} onClick={e => setShown(false)}>
                        Close
                    </button>
                </div>
                <div className="CardStack" style={{
                    fontSize: "small", // match Card
                    height: `${boxHeight}em`,
                    minWidth: `${boxWidth}em`,
                }}>
                    {listItems}
                </div>
            </div>
        )
    }

    return (
        <>
            <div ref={drop} className="buttontooltip"
                 style={{
                     backgroundColor:
                         !dragCardOwner ? (isOver ? "darkGray" : undefined)
                             : dragCardOwner !== owner ? (isOver ? "#AA8888" : "#D9A393")
                             : (isOver ? "#88AA88" : "#A3D993"),  // same owner
                     border: shown ? "0.1em solid black" : undefined,
                 }}>
                <div onClick={e => stackButtonClicked(e)} className="DivButton">
                    {label} {`${size}`}
                </div>
                <span className="buttontooltiptext" style={{visibility: isOver ? "visible" : undefined}}>
                    {owner === playerName ? name : `${owner}'s ${name}`}
                </span>
                {shown ? renderPopupBox() : null}
            </div>
        </>
    )
}

export default CardStack