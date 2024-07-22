import React, {useState, useEffect} from "react";
import './App.css';
import { authEndpoint, redirectUri, scopes } from "./auth_config";
import SpotifyWebApi from 'spotify-web-api-js'

const spotify = new SpotifyWebApi();

const App = () => {
  const CLIENT_ID = "29ec048756da4eb092460068d82fa4a8";
  const loginUrl = `${authEndpoint}?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`
  const [accessToken, setaccessToken] = useState("");
  const [fiftytopTracks, setfiftytopTracks] = useState([]);





  useEffect(() => {
    if (window.location.hash != "") {
      setaccessToken(getTokenFromUrl().access_token);
      console.log(getTokenFromUrl().access_token);
      window.location.hash="";
    }

  }, []);
  console.log(accessToken);



  //useEffect(() => {
  //   var authParameters = {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/x-www-form-urlencoded"
  //     },
  //     body:
  //       "grant_type=client_credentials&client_id=" +
  //       CLIENT_ID +
  //       "&client_secret=" +
  //       CLIENT_SECRET
  //   };
  //   fetch("https://accounts.spotify.com/api/token", authParameters)
  //     .then((result) => result.json())
  //     .then((data) => setAccessToken(data.access_token));
  // }, []);

  async function fetchWebApi(endpoint, method, body) {
    console.log(accessToken);
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method,
      body: JSON.stringify(body)
    });
    return await res.json();
  }
  
  async function getTopTracks(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    return (await fetchWebApi(
      'v1/me/top/tracks?time_range=long_term&limit=50', 'GET'
    )).items;
  }
  
  async function printTopTracks() {
    var topTracks = await getTopTracks()
    .then((data) => {
      const track = [];
      for (let i = 0; i < 50; i++) {
        track.push([
          data[i].album.images[0]["url"],
          data[i].name,
          data[i].artists.map(artist => artist.name).join(', ')
        ]);
      }
      setfiftytopTracks(track);
    });
    
    // console.log(
    //   topTracks?.map(
    //     ({name, artists}) =>
    //       `${name} by ${artists.map(artist => artist.name).join(', ')}`)
    // );


  }

  const getTokenFromUrl = () => {
    return window.location.hash
      .substring(1)
      .split('&')
      .reduce((initial, item)=>{
        let parts = item.split("=");
        initial[parts[0]] = decodeURIComponent(parts[1])

        return initial
      }, {});
  }

 

  return (
    <div className>
      <a href={loginUrl}>hi</a>
      <h1 onClick = {(event) => printTopTracks()}>click me after logging in</h1>
      <h5>
      {fiftytopTracks.map((top, i) => {
              return (
                <div
                  key={i}
                >
                  <img src={top[0]} height={"50px"} alt={top[1]} />
                  <h5>
                    {top[1]}, {top[2]}
                  </h5>
                </div>
              );
            })}
      </h5>
    </div>
  );
}

export default App;
