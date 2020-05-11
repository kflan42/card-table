import React, {ChangeEvent, FormEvent} from 'react'
import {useHistory} from 'react-router-dom';


export const LoginForm: React.FC = (props) => {
    const history = useHistory()

    function cb(arg0: string) {
        history.push(arg0)
    }

    return (
        <Login cb={cb}></Login>
    )
}

interface LoginP {
    cb: (arg0: any) => void
}


class Login extends React.Component<LoginP> {
    state: { [index: string]: any }

    constructor(props: LoginP) {
        super(props);
        this.state = {
            name: '',
            table: '',
            deck: '',
            color: ''
        }

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleTableChange = this.handleTableChange.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.pickColor = this.pickColor.bind(this);
    }

    componentDidMount() {
        const name = localStorage.getItem('userName')
        const color = localStorage.getItem('userColor')

        if (name !== null) {
            this.setState({name})
        }
        if (color !== null) {
            this.setState({color})
        }
    }

    handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        this.setState({name: event.target.value});
    }

    handleTableChange(event: ChangeEvent<HTMLInputElement>) {
        this.setState({table: event.target.value});
    }

    handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target && event.target.files) {
            event.persist() // make name stick next to chooser
            event.target.files[0].text()
                .then(d => this.setState({deck: d}))
                .catch(function (reason) {
                    console.log(`Error reading deck file ${reason}`);
                    event.target.value = ''; // to allow upload of same file if error occurs
                });
        }
    }

    handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (this.state.color === '') {
            return;
        }

        localStorage.setItem('userName', this.state.name)
        localStorage.setItem('userColor', this.state.color)

        console.log("joining table...", this.state)
        this.sendChoices()
            .then(async response => {
                const data = await response.json();

                // check for error response
                if (!response.ok) {
                    // get error message from body or default to response status
                    const error = (data && data.message) || response.status;
                    return Promise.reject(error);
                }

                // route over to table
                this.props.cb(this.state.table)
            })
            .catch(error => {
                console.error('There was an error!', error);
            });
    }

    sendChoices() {
        // POST request using fetch with error handling
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(this.state)
        };
        return fetch('http://localhost:3000/table/' + this.state.table, requestOptions)

    }

    pickColor(color: string) {
        this.setState({color: color})
    }

    render() {
        const colorItems = []
        for (const color in colors) {
            // for (let r = 0; r <= 3; r++) {
            //   for (let g = 0; g <= 3; g++) {
            //     for (let b = 0; b <= 3; b++) {
            // const color = "#" + (r * 64 + 16).toString(16) + (g * 64 + 16).toString(16) + (b * 64 + 16).toString(16)
            const v = colors[color]
            const r = v >> 16
            const g = (v & 0x00ff00) >> 8
            const b = v & 0x0000ff
            // const s = r.toString(16) + g.toString(16) + b.toString(16)
            if ((r < 0xa0 || g < 0xa0 || b < 0xa0) /* && (r > 0x40 || g > 0x40 || b > 0x40) */) {
                colorItems.push(<span
                    key={color}
                    style={{backgroundColor: color, color: "white", cursor: "pointer"}}
                    onClick={() => this.pickColor(color)}
                >{color}</span>)
            }
            //   }
            // }
        }

        return (
            <div style={{
                paddingTop: "2em",
                paddingLeft: "2em",
                display: "block"
            }}>
                <form onSubmit={this.handleSubmit} className="Login">
                    <div style={{textAlign: "justify"}}>
                        Your Name: &nbsp;
                        <input type="text" value={this.state.name} required={true} onChange={this.handleNameChange}/>
                        <br/> <br/>
                        Table Name: &nbsp;
                        <input type="text" value={this.state.table} required={true} onChange={this.handleTableChange}/>
                        <br/> <br/>
                        Deck File:  &nbsp;
                        <input className="DivButton" accept=".txt,.dek,*" type="file" required={true}
                               onChange={this.handleFileChange}/>
                        <br/> <br/>
                        Sleeve Color: &nbsp;
                        <div className="dropdown">
                            <button
                                style={{backgroundColor: this.state.color}}>{this.state.color ? "Chosen" : "Choose"}</button>
                            <div className="dropdown-content" style={{maxHeight: colorItems.length * 2 / 5 + "em"}}>
                                {colorItems}
                            </div>
                        </div>
                        <br/> <br/>
                        <input className="DivButton" type="submit" value="Join Table"/>
                        <br/> <br/>
                        Deck: <br/>
                        <textarea value={this.state.deck} readOnly={true} cols={30} rows={25}/>
                    </div>
                </form>
            </div>
        );
    }
}

export default LoginForm

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