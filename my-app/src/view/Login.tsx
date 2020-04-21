import React, { ChangeEvent, FormEvent } from 'react'
import { useHistory } from 'react-router-dom';


export const LoginForm: React.FC = (props) => {
  const history = useHistory()

  function cb(arg0: string) {
    history.push(arg0)
  }

  return(
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
      deck: ''
    }

    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleTableChange = this.handleTableChange.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({ name: event.target.value });
  }

  handleTableChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({ table: event.target.value });
  }

  handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target && event.target.files) {
      event.persist() // make name stick next to chooser
      event.target.files[0].text()
        .then(d => this.setState({ deck: d }))
        .catch(function (reason) {
          console.log(`Error reading deck file ${reason}`);
          event.target.value = ''; // to allow upload of same file if error occurs
        });
    }
  }

  handleSubmit(event: FormEvent<HTMLFormElement>) {
    
    console.log(this.state.name, this.state.table, this.state.deck)
    localStorage.setItem('userName', this.state.name)
    // TODO send name and deck to server here
    this.props.cb(this.state.table)
      
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit} className="Login">
        Your Name: &nbsp;
        <input type="text" value={this.state.name} required={true} onChange={this.handleNameChange} />
          <br /> <br />
        Table Name: &nbsp;
        <input type="text" value={this.state.table} required={true} onChange={this.handleTableChange} />
          <br /> <br />
        Deck File:  &nbsp;
        <input accept=".txt,*" type="file" required={true} onChange={this.handleFileChange} />
        <br /> <br />
        <input type="submit" value="Join Table"/>
        <br /> <br />
        Deck: <br />
        <textarea value={this.state.deck} readOnly={true} cols={64} rows={33} />
      </form>
    );
  }
}
export default LoginForm