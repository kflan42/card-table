import React from 'react'

import './_style.css';
import PlayerCounter from './PlayerCounter';
import CardStack from './CardStack';
import { EXILE, COMMAND_ZONE, GRAVEYARD, LIBRARY, HAND, ClientState } from '../ClientState';
import {useDispatch, useSelector} from 'react-redux';
import { useConfirmation } from './ConfirmationService';
import {drawing, drawLine, setPlayerCounter} from '../Actions';
import { ConfirmationResult } from './ConfirmationDialog';
import { usePlayerDispatch } from '../PlayerDispatch';

interface PlayerBoxP {
    player: string
}

const PlayerBox: React.FC<PlayerBoxP> = ({ player }) => {

    const playerState = useSelector((state: ClientState) => {
        return state.game.players[player];
    });

    const counters = []
    for (const counter of playerState.counters) {
        counters.push(<PlayerCounter key={counter.name} player={player} kind={counter.name} value={counter.value}/>)
    }

    const {action:playerDispatch, draw:drawDispatch} = usePlayerDispatch()
    const confirmation = useConfirmation();

    const addCounter = () => {
        confirmation({
            choices: ["Create Name * Count _"],
            catchOnCancel: true,
            title: "Create Player Counter",
            description: ""
        })
            .then((s: ConfirmationResult) => {
                switch (s.choice) {
                    case "Create Name * Count _":
                        playerDispatch(setPlayerCounter(player, s.s, s.n));
                        break;
                }
            })
            .catch(() => null);
    }

    const drawingFirst = useSelector((state: ClientState) => state.drawing.first)
    const drawerColor = useSelector((state: ClientState) => state.game.players.hasOwnProperty(state.playerPrefs.name)
        ? state.game.players[state.playerPrefs.name].color
        : "gray")
    const dispatch = useDispatch()

    const click = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (drawingFirst === '') {
            dispatch(drawing(`p-${player}`))
            event.preventDefault()
            return
        }
        if (drawingFirst !== null && drawingFirst !== '') {
            drawDispatch(drawLine({color: drawerColor, from: drawingFirst, to: `p-${player}`}))
            dispatch(drawing(null))
            event.preventDefault()
            return;
        }
    }

    return (
        /* eslint-disable jsx-a11y/accessible-emoji */
        <div className="PlayerBox" style={{ backgroundColor: playerState.color }}>
            <div className={`p-${player}`} style={{
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: "6em",
                }} onClick={click}>
                <strong>{player}</strong>
            </div>
            <CardStack name={HAND} owner={player} icon="✋" />
            <CardStack name={LIBRARY} owner={player} icon="📚" />
            <CardStack name={GRAVEYARD} owner={player} icon="🗑️" />
            <CardStack name={EXILE} owner={player} icon="📒" />
            <CardStack name={COMMAND_ZONE} owner={player} icon="👑" />
            {counters}
            <div className=" buttontooltip">
                <div className="DivButton" onClick={addCounter}>➕</div>
                <span className="buttontooltiptext">Add Counter</span>
            </div>
        </div>
    )
}

export default PlayerBox