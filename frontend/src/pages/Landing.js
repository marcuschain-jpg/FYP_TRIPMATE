import axios from 'axios'; // for API calls (frontend talk to backend, both ways)
import '../styles/App.css'; // link from css page

function Landing() {
  const apiCallbtn = () => {
    axios.get('http://localhost:8080').then((data) => {
      console.log(data);
    })
  }
    return (
        <div className="App">
              <header className="App-header">
                <button onClick={(apiCallbtn)}>Api Call</button>
                <p>
                  Yay, it works! Welcome to frontend :D<h1>Landing Page</h1>
                </p>
              </header>
            </div>
    );
}

export default Landing;