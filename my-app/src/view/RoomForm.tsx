import cardBack from '../images/Magic_card_back.jpg'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { JoinRequest, SFCard, TableInfo, TableRequest } from "../magic_models";
import { setUserPrefs, setGame, setSessionId } from "../Actions";
import { useDispatch } from "react-redux";
import MySocket from '../MySocket';
import { safeString } from '../Utilities';
import { useRouteChanger } from './MyRouting';

interface RoomViewProps {
    sessionId: string|null
}

export const RoomForm: React.FC<RoomViewProps> = ({sessionId}) => {
    const routeChanger = useRouteChanger()
    const dispatch = useDispatch()

    const [deckList, setDeckList] = useState('')
    const [tableRequest, setTableRequest] = useState<TableRequest>({ table: '' })
    const [joinRequest, setJoinRequest] = useState<JoinRequest>({
        table: '',
        name: '',
        color: '',
        deck: [],
        sideboard: []
    })
    const [errorMsg, setErrorMsg] = useState('')
    const [deckMsg, setDeckMsg] = useState('Upload Result:')

    useEffect(() => {
        dispatch(setGame(
            {
                game: {
                    players: [],
                    cards: [],
                    zones: [],
                    battlefield_cards: [],
                },
                log_lines: [],
                actions: [],
                sf_cards: [],
                table_cards: []
            }
        ))
        dispatch(setSessionId(sessionId as string))
    }, [dispatch, sessionId])

    useEffect(() => {
        const name = localStorage.getItem('userName')
        const color = localStorage.getItem('userColor')
        const deckList = localStorage.getItem('deckList')
        const deckAndSide = localStorage.getItem('deckAndSide')

        let jr = { ...joinRequest }
        if (name !== null) {
            jr = { ...jr, name }
        }
        if (color !== null) {
            jr = { ...jr, color }
        }
        if (deckAndSide !== null) {
            const deckAndSideObj = JSON.parse(deckAndSide)
            setCardsList(cardsListToText(deckAndSideObj))
            jr = {...jr, deck: deckAndSideObj['deck'], sideboard: deckAndSideObj["sideboard"] }
        }
        setJoinRequest(jr)
        if (deckList !== null) {
            setDeckList(deckList)
        }
        loadTables()
        document.title = 'Magic Room ' + sessionId

        // wants to depend on joinRequest leads to infinite loop
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        try {

            MySocket.close_socket() // in case open from earlier
            console.log('Connecting room sockets...')
            // now that game is loaded, register for updates to it
            MySocket.get_socket().emit('join_room', { session: sessionId })
            MySocket.get_socket().on('room_update', function (msg: object) {
                const tableInfos = msg as TableInfo[]
                console.log('received room_update', tableInfos)
                handleTableInfos(tableInfos)
            })
            MySocket.get_socket().on('disconnect', () => {
                // socket corrupt after server restart
                const choice = window.confirm("Uh oh! The socket disconnected. Shall we reload the page to reconnect?")
                if (choice) {
                    console.log('reloading page...')
                    window.location.reload()
                }
            })
        } catch (e) {
            console.error(e)
        }

        return function cleanup() {
            console.log('disconnecting socket handlers for table')
            MySocket.get_socket().off('room_update')
            MySocket.get_socket().off('disconnect')
        }
    }, [sessionId])

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setJoinRequest({ ...joinRequest, name: event.target.value.replace(/[^A-Za-z0-9 .,_]/, '') });
    }

    const handleTableChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newTableName = safeString(event.target.value);
        setTableRequest({ ...tableRequest, table: newTableName });
        if (newTableName.startsWith("test")) {
            setErrorMsg("Warning! Tables starting with 'test' have pre-populated games and are not saved!")
        } else {
            setErrorMsg("");
        }
    }

    const [selectedTableIdx, setSelectedTableIdx] = useState(-1)

    const handleSelectTable = (event: React.ChangeEvent<HTMLSelectElement>) => {
        if (event.target.selectedIndex === undefined) {
            return;
        }
        const option = event.target[event.target.selectedIndex] as any
        setSelectedTableIdx(event.target.selectedIndex)
        setJoinRequest({ ...joinRequest, table: option.value as string });
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target && event.target.files) {
            event.persist() // make name stick next to chooser
            event.target.files[0].text()
                .then(d => setDeckList(d))
                .catch(function (reason) {
                    console.log(`Error reading deck file ${reason}`);
                    event.target.value = ''; // to allow upload of same file if error occurs
                });
        }
    }

    const handleDeckChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setDeckList(event.target.value)
    }

    const handlePickColor = (color: string) => {
        setJoinRequest({ ...joinRequest, color: color })
        setColorsShown(false)
    }

    const [colorsShown, setColorsShown] = useState(false)

    const toggleColorChooser = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setColorsShown(!colorsShown);
    }

    const [cardsList, setCardsList] = useState('')

    const handeLoadCards = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        if (deckList === '') {
            return;
        }
        sendDecklist()
            .then(async response => {
                console.log(response)

                // check for error response
                if (!response.ok) {
                    const data = await response.text()  // server uses text rather than json for these specifically
                    // get error message from body or default to response status
                    const error = data || response.status;
                    return Promise.reject(error);
                }
                const responseObj = await response.json()
                const deck = responseObj["deck"] as SFCard[];
                const sideboard = responseObj["sideboard"] as SFCard[];
                setJoinRequest({ ...joinRequest, deck: deck, sideboard: sideboard })
                const firstCard = deck ? deck[0].name : "none"
                const cmdrMsg = deck.length < 100 ? '' : `"${firstCard}" will be your commander.`
                setDeckMsg(`${deck.length} cards in deck and ${sideboard.length} cards in sideboard. ` + cmdrMsg)
                setCardsList(cardsListToText(responseObj))
            })
            .catch(error => {
                console.error('deck error', error);
                setDeckMsg('');
                setCardsList(error)
            });
    }

    const handleWatchTable = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        if (joinRequest.table === '') {
            return;
        }
        console.log("watching table...", joinRequest.table)
        localStorage.setItem('userName', joinRequest.name)
        fetch(`${process.env.REACT_APP_API_URL || ""}/api/session/${sessionId}/table/${joinRequest.table}`)
            .then(async response => {
                console.log(response)
                // check for error response
                if (!response.ok) {
                    const data = await response.text()  // server uses text rather than json for these specifically
                    // get error message from body or default to response status
                    const error = data || response.status;
                    return Promise.reject(error);
                }
                routeChanger(`?sessionId=${sessionId}&name=${joinRequest.table}`)
            })
            .catch(error => {
                console.error('There was an error!', error);
                setErrorMsg(error);
            });
    }

    const handleCreateTable = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        if (tableRequest.table.length > 32) {
            setErrorMsg("Table name is too long.");
            return;
        }
        if (tableRequest.table.length < 1) {
            setErrorMsg("Must enter a table name.");
            return;
        }
        sendCreate()
            .then(async response => {
                console.log(response)
                // check for error response
                if (!response.ok) {
                    const data = await response.text()  // server uses text rather than json for these specifically
                    // get error message from body or default to response status
                    const error = data || response.status;
                    return Promise.reject(error);
                }
                setErrorMsg('');
            })
            .catch(error => {
                console.error('submission error', error);
                setErrorMsg(error);
            });

    }

    const handleJoinTable = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        if (joinRequest.color === '') {
            setErrorMsg("Please pick a sleeve color before joining.");
            return;
        }
        if (joinRequest.name.length < 1) {
            setErrorMsg("Player name too short.");
            return;
        }
        if (joinRequest.name.length > 32) {
            setErrorMsg("Player name too long.");
            return;
        }
        if (joinRequest.deck.length === 0) {
            setErrorMsg("Please load your cards before joining.");
            return;
        }
        if (joinRequest.table === '') {
            setErrorMsg("Please select a table.")
            return
        }
        setErrorMsg('...');

        localStorage.setItem('userName', joinRequest.name)
        localStorage.setItem('userColor', joinRequest.color)
        localStorage.setItem('deckList', deckList)
        localStorage.setItem('deckAndSide', JSON.stringify({"deck": joinRequest.deck, "sideboard": joinRequest.sideboard}))

        console.log("joining table...", joinRequest)
        sendJoin()
            .then(async response => {
                console.log(response)

                // check for error response
                if (!response.ok) {
                    const data = await response.text()  // server uses text rather than json for these specifically
                    // get error message from body or default to response status
                    const error = data || response.status;
                    return Promise.reject(error);
                }

                // set user name in app memory
                dispatch(setUserPrefs({ name: joinRequest.name }))
                // route over to table
                routeChanger(`?sessionId=${sessionId}&name=${joinRequest.table}`)
            })
            .catch(error => {
                console.error('submission error', error);
                setErrorMsg(error);
            });
    }

    // parallel arrays
    const [tableItems, setTableItems] = useState<JSX.Element[]>([])
    const [playerItems, setPlayerItems] = useState<JSX.Element[][]>([])
    const [lastLoad, setLastLoad] = useState(0)

    const loadTables = () => {
        if (new Date().getTime() < lastLoad + 5000) {
            return // skip if loaded within 5s
        }
        console.log("loading tables")
        setLastLoad(new Date().getTime())
        fetch(`${process.env.REACT_APP_API_URL || ""}/api/session/${sessionId}/tables`).then(
            async response => {
                // check for error response
                if (!response.ok) {
                    const data = await response.text()  // server uses text rather than json for these specifically
                    // get error message from body or default to response status
                    const error = data || response.status;
                    return Promise.reject(error);
                }
                const tables = await response.json() as TableInfo[]

                handleTableInfos(tables);
            }
        ).catch(error => {
            console.error('loadTables error', error);
            setTableItems([<option key={-1} value={''}>Error Loading Tables</option>])
        });
    }

    function handleTableInfos(tables: TableInfo[]) {
        const tableList = [];
        const playersList = [];
        for (const table of tables) {
            const label = `${table.table} ` + (table.date === 'today' ? `(${table.colors.length} players)` : `[from ${table.date}]`)
            tableList.push(<option key={table.table} value={table.table}>{label}</option>)
    
            const players = [];
            let i = 0;
            for (const color of table.colors) {
                /* eslint-disable jsx-a11y/accessible-emoji */
                players.push(<span key={i++} style={{ backgroundColor: color, margin:'0.25em' }}>🧙</span>);
            }
            playersList.push(players);
        }
        setTableItems(tableList);
        setPlayerItems(playersList);
    }

    const sendCreate = () => {
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tableRequest)
        };
        return fetch(`${process.env.REACT_APP_API_URL || ""}/api/session/${sessionId}/tables/${tableRequest.table}`, requestOptions)
    }

    const sendJoin = () => {
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(joinRequest)
        };
        return fetch(`${process.env.REACT_APP_API_URL || ""}/api/session/${sessionId}/table/${joinRequest.table}`, requestOptions)
    }

    const sendDecklist = () => {
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deckList)
        };
        return fetch(`${process.env.REACT_APP_API_URL || ""}/api/deckList`, requestOptions)
    }


    const colorItems = []
    for (const color in colors) {
        // for (let r = 0; r <= 3; r++) {
        //   for (let g = 0; g <= 3; g++) {
        //     for (let b = 0; b <= 3; b++) {
        // const color = "#" + (r * 64 + 16).toString(16) + (g * 64 + 16).toString(16) + (b * 64 + 16).toString(16)
        const { luminance } = analyzeColor(color);
        // let too_pale = r < 0xa0 || g < 0xa0 || b < 0xa0;
        // let too_bright = r > 0x40 || g > 0x40 || b > 0x40;
        if (true) {
            colorItems.push(<span
                key={color}
                style={{
                    backgroundColor: color, color: luminance < 0.5 ? "white" : "black", cursor: "pointer",
                    margin: "0.5%", width: "24%"
                }}
                onClick={() => handlePickColor(color)}
            >{color}</span>)
        }
        //   }
        // }
    }

    return (
        /* eslint-disable jsx-a11y/accessible-emoji */
        <div className="myform" style={{ width: "100%", overflowY: "auto", overflowX: "auto" }}>
            <h3 style={{ display:"flex", alignItems:"center", justifyContent:"center", textAlign: "center" }}><img style={{ 
                            borderColor: joinRequest.color, 
                            background: joinRequest.color,
                            borderWidth: '0.01em',
                            borderStyle: 'solid',
                            objectFit: 'scale-down',
                            height: '2em',
                            borderRadius: '5%',
                            marginRight:'1em'
                             }} src={cardBack} alt="Magic Card Back" />
                             Welcome to Room {sessionId} 
                             <img style={{ 
                                borderColor: joinRequest.color, 
                                background: joinRequest.color,
                                borderWidth: '0.01em',
                                borderStyle: 'solid',
                                objectFit: 'scale-down',
                                height: '2em',
                                borderRadius: '5%',
                                marginLeft:'1em'
                                 }} src={cardBack} alt="Magic Card Back" /></h3>
            <div style={{
                width: "100%", height: "100%",
                display: "inline-grid", gridTemplateColumns: "auto auto",
                justifyContent: "center", alignContent: "start"
            }}>

                <div className="FormBox" style={{ gridArea: "1/2/4/3" }}>
                    <span style={{ gridColumn: "1/5", textAlign: "center" }}><b>📚 Deck Loader</b></span>
                    <button style={{ gridColumn: "2/4", alignSelf: "center" }} className="DivButton" onClick={handeLoadCards}>Upload Deck List</button>
                    <input style={{ gridColumn: "1/3", alignSelf: "center" }} className="DivButton" accept=".txt,.dek,.dec,*" type="file" onChange={handleFileChange} />
                    <span style={{ gridColumn: "3/5", textAlign: 'center', color: 'blue' }}> {deckMsg} </span>
                    <textarea style={{ gridColumn: "1/3", backgroundColor: "white", border: "0.125em solid #ccc" }}
                        value={deckList} required={true} onChange={handleDeckChange} cols={25} rows={25} />
                    <textarea style={{ gridColumn: "3/5", backgroundColor: "beige", border: "0.125em solid darkblue" }}
                        value={cardsList} readOnly={true} cols={25} rows={25} />
                    <ul style={{ gridColumn: "1/5" }}>
                        <li>Supports most formats used by Arena, Archidekt, Decked, TappedOut, TCGPlayer, XMage, et al. e.g.</li > 
                        <ul>
                            <li style={{fontFamily:"monospace"}}>1 Grizzly Bears</li>
                            <li style={{fontFamily:"monospace"}}>1x Grizzly Bears (7ED) 251</li>
                            <li>Set and collector number will be randomly selected if not provided.</li>
                        </ul>
                        <li>Any cards below a blank line will be put in your Sideboard. 📒</li>
                        <li>👑 If playing commander, please put your commander first or append <span style={{fontFamily:"monospace"}}>*CMDR*</span> to its line.</li>
                    </ul>
                </div>

                <div className="FormBox" style={{ gridArea: "1/1/2/2" }}>
                    <span style={{ gridColumn: "1/3", textAlign: "center" }}><b>Player Info</b></span>
                    <span >Name:</span>
                    <input type="text" value={joinRequest.name} onChange={handleNameChange} />
                    <span>Card Sleeve Color:</span>
                    <button className="DivButton" type="button" onClick={toggleColorChooser}
                        style={{
                            borderStyle: "solid",
                            borderColor: joinRequest.color,
                            borderWidth: "0.5em",
                        }}>{joinRequest.color ? joinRequest.color : "Choose"}</button>
                    {colorsShown ? <div style={{
                        gridColumn: "1/3", padding: "1em", display: "inline-block"
                    }}>
                        {colorItems}
                    </div> : null}
                </div>

                <div className="FormBox" style={{ gridArea: "2/1/3/2" }}>
                    <span style={{ textAlign: "center", gridColumn: "1/4" }}><b>Tables</b></span>
                    <select size={10} onChange={handleSelectTable}
                        style={{
                            gridArea: "2 / 1 / 7 / 3",
                            backgroundColor: "white",
                            border: "0.125em solid #ccc",
                            margin: "0.5em",
                            fontSize: "medium"
                        }}>
                        {tableItems}
                    </select>
                    {selectedTableIdx > -1 ? <div>
                        <span style={{ display: "block" }}>Players</span>
                        <span>{playerItems[selectedTableIdx]}</span>
                    </div> : null}
                    <button className="DivButton" onClick={handleJoinTable}>Join with Deck</button>
                    <button className="DivButton" onClick={handleWatchTable}>Watch or Rejoin</button>
                </div>

                <div className="FormBox" style={{ gridArea: "3/1/4/2" }}>
                    <span style={{ textAlign: "center", gridColumn: "1/3" }}><b>Make a new table?</b></span>
                    <span style={{ gridRow: 2 }} >Table Name: </span>
                    <input style={{ gridRow: 2 }} type="text" value={tableRequest.table} onChange={handleTableChange} />
                    <button style={{ gridColumn: "1/3" }} className="DivButton" onClick={handleCreateTable}>Create Table</button>
                    <span style={{ color: "red", gridColumn: "1/3" }}> {errorMsg ? errorMsg : null} </span>
                </div>
            </div>

        </div>
    );
}


export default RoomForm

function cardsListToText(d: any) {
    const loadedCardsList = []
    function processList(sfcards: SFCard[]) {
        let last = "";
        let count = 1;
        for (const sfcard of sfcards) {
            const cardLine = `${sfcard.name} (${sfcard.set_name.toUpperCase()}) ${sfcard.number}`;
            if (cardLine === last) {
                count++;
            } else {
                if (last) {
                    loadedCardsList.push(`${count} ${last}`);
                }
                last = cardLine;
                count = 1;
            }
        }
        if (last) {
            loadedCardsList.push(`${count} ${last}`);
        }
    }
    processList(d["deck"]);
    loadedCardsList.push("\n")
    processList(d["sideboard"]);
    return loadedCardsList.join("\n");
}

export function analyzeColor(color: string) {
    const v = colors[color]
    const r = v >> 16
    const g = (v & 0x00ff00) >> 8
    const b = v & 0x0000ff
    const brightness = r + g + b
    // Counting the perceptive luminance - human eye favors green color... 
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // const s = r.toString(16) + g.toString(16) + b.toString(16)
    return { r, g, b, brightness, luminance };
}

export const colors: { [index: string]: number } = {
    "IndianRed": 0xCD5C5C,
    "LightCoral": 0xF08080,
    "Salmon": 0xFA8072,
    "DarkSalmon": 0xE9967A,
    "LightSalmon": 0xFFA07A,
    "Crimson": 0xDC143C,
    "Red": 0xFF0000,
    "FireBrick": 0xB22222,
    "DarkRed": 0x8B0000,
    "Pink": 0xFFC0CB,
    "LightPink": 0xFFB6C1,
    "HotPink": 0xFF69B4,
    "DeepPink": 0xFF1493,
    "MediumVioletRed": 0xC71585,
    "PaleVioletRed": 0xDB7093,
    "Coral": 0xFF7F50,
    "Tomato": 0xFF6347,
    "OrangeRed": 0xFF4500,
    "DarkOrange": 0xFF8C00,
    "Orange": 0xFFA500,
    "Gold": 0xFFD700,
    "Yellow": 0xFFFF00,
    "LightYellow": 0xFFFFE0,
    "LemonChiffon": 0xFFFACD,
    "LightGoldenrodYellow": 0xFAFAD2,
    "PapayaWhip": 0xFFEFD5,
    "Moccasin": 0xFFE4B5,
    "PeachPuff": 0xFFDAB9,
    "PaleGoldenrod": 0xEEE8AA,
    "Khaki": 0xF0E68C,
    "DarkKhaki": 0xBDB76,
    "Lavender": 0xE6E6FA,
    "Thistle": 0xD8BFD8,
    "Plum": 0xDDA0DD,
    "Violet": 0xEE82EE,
    "Orchid": 0xDA70D6,
    "Fuchsia": 0xFF00FF,
    "Magenta": 0xFF00FF,
    "MediumOrchid": 0xBA55D3,
    "MediumPurple": 0x9370DB,
    "BlueViolet": 0x8A2BE2,
    "DarkViolet": 0x9400D3,
    "DarkOrchid": 0x9932CC,
    "DarkMagenta": 0x8B008B,
    "Purple": 0x800080,
    "Indigo": 0x4B0082,
    "SlateBlue": 0x6A5ACD,
    "DarkSlateBlue": 0x483D8B,
    "MediumSlateBlue": 0x7B68EE,
    "GreenYellow": 0xADFF2F,
    "Chartreuse": 0x7FFF00,
    "LawnGreen": 0x7CFC00,
    "Lime": 0x00FF00,
    "LimeGreen": 0x32CD32,
    "PaleGreen": 0x98FB98,
    "LightGreen": 0x90EE90,
    "MediumSpringGreen": 0x00FA9A,
    "SpringGreen": 0x00FF7F,
    "MediumSeaGreen": 0x3CB371,
    "SeaGreen": 0x2E8B57,
    "ForestGreen": 0x228B22,
    "Green": 0x008000,
    "DarkGreen": 0x006400,
    "YellowGreen": 0x9ACD32,
    "OliveDrab": 0x6B8E23,
    "Olive": 0x808000,
    "DarkOliveGreen": 0x556B2F,
    "MediumAquamarine": 0x66CDAA,
    "DarkSeaGreen": 0x8FBC8F,
    "LightSeaGreen": 0x20B2AA,
    "DarkCyan": 0x008B8B,
    "Teal": 0x008080,
    "Aqua": 0x00FFFF,
    "Cyan": 0x00FFFF,
    "LightCyan": 0xE0FFFF,
    "PaleTurquoise": 0xAFEEEE,
    "Aquamarine": 0x7FFFD4,
    "Turquoise": 0x40E0D0,
    "MediumTurquoise": 0x48D1CC,
    "DarkTurquoise": 0x00CED1,
    "CadetBlue": 0x5F9EA0,
    "SteelBlue": 0x4682B4,
    "LightSteelBlue": 0xB0C4DE,
    "PowderBlue": 0xB0E0E6,
    "LightBlue": 0xADD8E6,
    "SkyBlue": 0x87CEEB,
    "LightSkyBlue": 0x87CEFA,
    "DeepSkyBlue": 0x00BFFF,
    "DodgerBlue": 0x1E90FF,
    "CornflowerBlue": 0x6495ED,
    "RoyalBlue": 0x4169E1,
    "Blue": 0x0000FF,
    "MediumBlue": 0x0000CD,
    "DarkBlue": 0x00008B,
    "Navy": 0x000080,
    "MidnightBlue": 0x191970,
    "Cornsilk": 0xFFF8DC,
    "BlanchedAlmond": 0xFFEBCD,
    "Bisque": 0xFFE4C4,
    "NavajoWhite": 0xFFDEAD,
    "Wheat": 0xF5DEB3,
    // used for Battlefield "BurlyWood": 0xDEB887,
    "Tan": 0xD2B48C,
    "RosyBrown": 0xBC8F8F,
    "SandyBrown": 0xF4A460,
    "Goldenrod": 0xDAA520,
    "DarkGoldenrod": 0xB8860B,
    "Peru": 0xCD853F,
    "Chocolate": 0xD2691E,
    "SaddleBrown": 0x8B4513,
    "Sienna": 0xA0522D,
    "Brown": 0xA52A2A,
    "Maroon": 0x800000,
    "White": 0xFFFFFF,
    "Snow": 0xFFFAFA,
    "Honeydew": 0xF0FFF0,
    "MintCream": 0xF5FFFA,
    "Azure": 0xF0FFFF,
    "AliceBlue": 0xF0F8FF,
    "GhostWhite": 0xF8F8FF,
    "WhiteSmoke": 0xF5F5F5,
    "Seashell": 0xFFF5EE,
    "Beige": 0xF5F5DC,
    "OldLace": 0xFDF5E6,
    "FloralWhite": 0xFFFAF0,
    "Ivory": 0xFFFFF0,
    "AntiqueWhite": 0xFAEBD7,
    "Linen": 0xFAF0E6,
    "LavenderBlush": 0xFFF0F5,
    "MistyRose": 0xFFE4E1,
    "Gainsboro": 0xDCDCDC,
    "LightGrey": 0xD3D3D3,
    "Silver": 0xC0C0C0,
    "DarkGray": 0xA9A9A9,
    "Gray": 0x808080,
    "DimGray": 0x696969,
    "LightSlateGray": 0x778899,
    "SlateGray": 0x708090,
    "DarkSlateGray": 0x2F4F4F,
    "Black": 0x000000,
}