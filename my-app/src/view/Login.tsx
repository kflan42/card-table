import React, { ChangeEvent, FormEvent, useEffect } from 'react'
import { useHistory } from 'react-router-dom';
import { JoinRequest } from "../magic_models";
import { setUserPrefs, setGame } from "../Actions";
import { useDispatch } from "react-redux";
import { blankGame } from '../ClientState';


export const LoginForm: React.FC = (props) => {
    const history = useHistory()

    const dispatch = useDispatch()

    useEffect(() => { dispatch(setGame(blankGame())) })

    return (
        <JoinTableForm
            routeChange={(r) => history.push(r)}
            setUserPrefs={(up) => dispatch(up)}
        ></JoinTableForm>
    )
}

interface LoginP {
    routeChange: (arg0: string) => void
    setUserPrefs: (arg0: object) => void
}


class JoinTableForm extends React.Component<LoginP> {
    state: JoinRequest
    response: string

    constructor(props: LoginP) {
        super(props);
        this.state = {
            name: '',
            table: '',
            deck_list: '',
            color: ''
        }
        this.response = ''

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleTableChange = this.handleTableChange.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
        this.handleDeckChange = this.handleDeckChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleWatchTable = this.handleWatchTable.bind(this);
        this.handlePickColor = this.handlePickColor.bind(this);
        this.setErrorMsg = this.setErrorMsg.bind(this);
    }

    componentDidMount() {
        const name = localStorage.getItem('userName')
        const color = localStorage.getItem('userColor')
        const deckList = localStorage.getItem('deckList')

        if (name !== null) {
            this.setState({ name })
        }
        if (color !== null) {
            this.setState({ color })
        }
        if (deckList !== null) {
            this.setState({ deck_list: deckList })
        }
    }

    setErrorMsg(msg: string) {
        this.response = msg;
        this.forceUpdate()
    }

    handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        this.setState({ name: event.target.value.replace(/[^A-Za-z0-9 .,_]/, '') }); 
        // '-' used for indexed zone names
    }

    handleTableChange(event: ChangeEvent<HTMLInputElement>) {
        const newTableName = event.target.value.replace(/[^A-Za-z0-9-_]/, '');
        this.setState({ table: newTableName });
        if (newTableName.startsWith("test")) {
            this.setErrorMsg("Warning! Tables starting with 'test' have random games and are not saved!")
        } else {
            this.setErrorMsg("");
        }
    }

    handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target && event.target.files) {
            event.persist() // make name stick next to chooser
            event.target.files[0].text()
                .then(d => this.setState({ deck_list: d }))
                .catch(function (reason) {
                    console.log(`Error reading deck file ${reason}`);
                    event.target.value = ''; // to allow upload of same file if error occurs
                });
        }
    }

    handleDeckChange(event: ChangeEvent<HTMLTextAreaElement>) {
        this.setState({ deck_list: event.target.value })
    }

    handlePickColor(color: string) {
        this.setState({ color: color })
    }

    handleWatchTable(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        event.preventDefault();
        if (this.state.table === '') {
            return;
        }
        console.log("watching table...", this.state.table)
        fetch(`${process.env.REACT_APP_API_URL}/api/table/${this.state.table}`)
            .then(async response => {
                console.log(response)
                // check for error response
                if (!response.ok) {
                    const data = await response.text()  // server uses text rather than json for these specifically
                    // get error message from body or default to response status
                    const error = data || response.status;
                    return Promise.reject(error);
                }
                this.props.routeChange('/table?name=' + this.state.table)
            })
            .catch(error => {
                console.error('There was an error!', error);
                this.setErrorMsg(error);
            });
    }

    handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (this.state.color === '') {
            this.setErrorMsg("Please pick a sleeve color before joining.");
            return;
        }
        if (this.state.table.length > 32) {
            this.setErrorMsg("Table name is too long.");
            return;
        }
        if (this.state.name.length > 32) {
            this.setErrorMsg("Player name too long.");
            return;
        }
        this.setErrorMsg('...');

        localStorage.setItem('userName', this.state.name)
        localStorage.setItem('userColor', this.state.color)
        localStorage.setItem('deckList', this.state.deck_list)

        console.log("joining table...", this.state)
        this.sendChoices()
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
                this.props.setUserPrefs(setUserPrefs({ name: this.state.name }))
                // route over to table
                this.props.routeChange('/table?name=' + this.state.table)
            })
            .catch(error => {
                console.error('There was an error!', error);
                this.setErrorMsg(error);
            });
    }

    sendChoices() {
        // POST request using fetch with error handling
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.state)
        };
        return fetch(`${process.env.REACT_APP_API_URL}/api/table/${this.state.table}`, requestOptions)

    }

    render() {
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
                    onClick={() => this.handlePickColor(color)}
                >{color}</span>)
            }
            //   }
            // }
        }

        return (
            <div className="myform" style={{
                paddingTop: "2em",
                paddingLeft: "2em",
            }}>
                <h2 style={{textAlign:"center"}}>Welcome to my "Card Table"</h2>
                <form onSubmit={this.handleSubmit} className="Login">
                    <div>
                        Your Name: &nbsp;
                        <input type="text" value={this.state.name} required={true} onChange={this.handleNameChange} />
                        Table Name: &nbsp;
                        <input type="text" value={this.state.table} required={true} onChange={this.handleTableChange} />
                        <br /><span className="FormSpan" style={{ color: "red" }}> {this.response ? this.response : null} </span>
                        <div style={{display:"flex", justifyContent:"space-evenly"}}>
                        <button className="DivButton" onClick={this.handleWatchTable}>Watch Table</button>
                        <input className="DivButton" type="submit" value="Join Table" />
                        </div>
                        <br /><span className="InfoSpan"><b>Join</b> adds you as a player with your deck to the table, creating the table if necessary. 
                        <br /><b>Watch</b> can be used for spectating or resuming a game as an existing player.</span>
                        <br /><span className="FormSpan">Your Card Sleeve Color: &nbsp; </span>
                        <div className="dropdown">
                            <button
                                style={{
                                    //backgroundColor: this.state.color,
                                    borderStyle: "solid",
                                    borderColor: this.state.color,
                                    borderWidth: "0.5em"
                                }}>{this.state.color ? "Chosen" : "Choose"}</button>
                            <div className="dropdown-content" style={{ maxHeight: colorItems.length / 4 + "em" }}>
                                {colorItems}
                            </div>
                        </div>
                        <br />
                        <span className="FormSpan">Upload Your Deck File: &nbsp; </span>
                        <input className="DivButton" accept=".txt,.dek,.dec,*" type="file" required={false} onChange={this.handleFileChange} />
                        <br />
                        <span className="FormSpan">Or Paste and edit it here. Please put your commander last or append *CMDR* to its line.</span>
                        <br />
                        <textarea value={this.state.deck_list} required={true} onChange={this.handleDeckChange} cols={60} rows={30} />
                    </div>
                </form>
            </div>
        );
    }
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