import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom';
import { JoinRequest, SFCard } from "../magic_models";
import { setUserPrefs, setGame } from "../Actions";
import { useDispatch } from "react-redux";
import MySocket from '../MySocket';


export const LoginForm: React.FC = () => {
    const history = useHistory()

    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setGame(
            {
                name: "",
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
    })

    const routeChange = (r: string) => history.push(r)

    const [deckList, setDeckList] = useState('')
    const [joinRequest, setJoinRequest] = useState<JoinRequest>({
        name: '',
        table: '',
        color: '',
        deck: []
    })
    const [errorMsg, setErrorMsg] = useState('')
    const [deckMsg, setDeckMsg] = useState('')

    useEffect(() => {
        const name = localStorage.getItem('userName')
        const color = localStorage.getItem('userColor')
        const deckList = localStorage.getItem('deckList')

        let jr = {...joinRequest}
        if (name !== null) {
            jr = { ...jr, name }
        }
        if (color !== null) {
            jr = { ...jr, color }
        }
        setJoinRequest(jr)
        if (deckList !== null) {
            setDeckList(deckList)
        }

        MySocket.close_socket()  // in case it's open from an earlier game, remove event handlers
    },
        // since it wants joinRequest but that changes every render and infinite loops
        // eslint-disable-next-line 
        [])

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setJoinRequest({ ...joinRequest, name: event.target.value.replace(/[^A-Za-z0-9 .,_]/, '') });
        // '-' used for indexed zone names
    }

    const handleTableChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newTableName = event.target.value.replace(/[^A-Za-z0-9-_]/, '');
        setJoinRequest({ ...joinRequest, table: newTableName });
        if (newTableName.startsWith("test")) {
            setErrorMsg("Warning! Tables starting with 'test' have random games and are not saved!")
        } else {
            setErrorMsg("");
        }
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
                const data: SFCard[] = await response.json()
                setJoinRequest({ ...joinRequest, deck: data })
                const cardCount = data.length
                const firstCard = data ? data[0].name : "none"
                const cmdrMsg = cardCount < 100 ? '' : `'${firstCard}' will be your commander.`
                setDeckMsg(`${cardCount} cards loaded. ` + cmdrMsg)
                setCardsList(data.map(sfcard => `1 ${sfcard.name} (${sfcard.set_name.toUpperCase()}) ${sfcard.number}`).join("\n"))
            })
            .catch(error => {
                console.error('deck error', error);
                setDeckMsg(error);
            });
    }

    const handleWatchTable = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        if (joinRequest.table === '') {
            return;
        }
        console.log("watching table...", joinRequest.table)
        fetch(`${process.env.REACT_APP_API_URL || ""}/api/table/${joinRequest.table}`)
            .then(async response => {
                console.log(response)
                // check for error response
                if (!response.ok) {
                    const data = await response.text()  // server uses text rather than json for these specifically
                    // get error message from body or default to response status
                    const error = data || response.status;
                    return Promise.reject(error);
                }
                routeChange('/table?name=' + joinRequest.table)
            })
            .catch(error => {
                console.error('There was an error!', error);
                setErrorMsg(error);
            });
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (joinRequest.color === '') {
            setErrorMsg("Please pick a sleeve color before joining.");
            return;
        }
        if (joinRequest.table.length > 32) {
            setErrorMsg("Table name is too long.");
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
        setErrorMsg('...');

        localStorage.setItem('userName', joinRequest.name)
        localStorage.setItem('userColor', joinRequest.color)
        localStorage.setItem('deckList', deckList)

        console.log("joining table...", joinRequest)
        sendChoices()
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
                routeChange('/table?name=' + joinRequest.table)
            })
            .catch(error => {
                console.error('submission error', error);
                setErrorMsg(error);
            });
    }

    const sendChoices = () => {
        // POST request using fetch with error handling
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(joinRequest)
        };
        return fetch(`${process.env.REACT_APP_API_URL || ""}/api/table/${joinRequest.table}`, requestOptions)
    }

    const sendDecklist = () => {
        // POST request using fetch with error handling
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
                style={{ backgroundColor: color, color: luminance < 0.5 ? "white" : "black", cursor: "pointer" }}
                onClick={() => handlePickColor(color)}
            >{color}</span>)
        }
        //   }
        // }
    }

    return (
        <div className="myform" style={{}}>
            <h3 style={{ textAlign: "center" }}>Welcome to my "Card Table"</h3>
            <form onSubmit={handleSubmit} className="Login">
                <div style={{ border: '0.2em solid black' }}>
                    <span className='SmallSpan'>Your Name:</span>
                    <input type="text" value={joinRequest.name} required={true} onChange={handleNameChange} />
                    <br />

                    <span className='SmallSpan'>Your Card Sleeve Color:</span>
                    <div className="dropdown">
                        <button type="button"
                            style={{
                                borderStyle: "solid",
                                borderColor: joinRequest.color,
                                borderWidth: "0.75em",
                                minWidth: '10em'
                            }}>{joinRequest.color ? joinRequest.color : "Choose"}</button>
                        <div className="dropdown-content" style={{ maxHeight: colorItems.length / 4 + "em" }}>
                            {colorItems}
                        </div>
                    </div>
                    <br />

                    <span className='SmallSpan'>Table Name: </span>
                    <input type="text" value={joinRequest.table} required={true} onChange={handleTableChange} />
                    <br />

                    <input className="DivButton" type="submit" value="Join Table" />
                    <span className="MediumSpan"><b>Join</b> adds you as a player with your deck to the table, creating the table if necessary.</span>
                    <br />

                    <button className="DivButton" onClick={handleWatchTable}>Watch Table</button>
                    <span className="MediumSpan"><b>Watch</b> can be used for spectating or resuming a game as an existing player.</span>
                    <br />

                    <span className="FullSpan" style={{ color: "red" }}> {errorMsg ? errorMsg : null} </span>
                </div>
                <br />
                <div style={{ border: '0.2em solid black' }}>
                    <span className="MediumSpan">Upload your deck from a file or paste it below. &nbsp; </span>
                    <input className="DivButton" accept=".txt,.dek,.dec,*" type="file" required={false} onChange={handleFileChange} />
                    <br />
                    <span className="MediumSpan">Once your deck list is ready, load it! </span>
                    <button className="DivButton" onClick={handeLoadCards}>{joinRequest.deck.length > 0 ? "Reload Cards" : "Load Cards"}</button>
                    <br />
                    <span className="FullSpan"><i>Supported formats include Arena, TappedOut, TCGPlayer, and XMage.</i></span>
                    <br />
                    <span className="FullSpan"><i>If playing commander, please put your commander first or append *CMDR* to its line.</i></span>
                    <br />
                    {deckMsg ? <span className="FullSpan" style={{ color: 'darkblue', width: '40em', textAlign: 'center' }}> {deckMsg} </span> : null}
                    {deckMsg ? <br /> : null}
                    <textarea value={deckList} required={true} onChange={handleDeckChange} cols={25} rows={25} />
                    {cardsList ? <textarea value={cardsList} required={false} readOnly={true} cols={25} rows={25} /> : null}
                </div>
            </form>
        </div>
    );

}


export default LoginForm

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