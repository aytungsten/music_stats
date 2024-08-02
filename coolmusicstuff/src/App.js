import React, {useState, useEffect} from "react";
import './App.css';
import { authEndpoint, redirectUri, scopes } from "./auth_config";
import SpotifyWebApi from 'spotify-web-api-js'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Avatar, ListItemIcon, ListItemText } from "@mui/material";


const spotify = new SpotifyWebApi();

const App = () => {
  const CLIENT_ID = "29ec048756da4eb092460068d82fa4a8";
  const loginUrl = `${authEndpoint}?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`
  const [accessToken, setaccessToken] = useState("");
  const [fiftytopTracks, setfiftytopTracks] = useState([]);
  const [STfiftytopTracks, setSTfiftytopTracks] = useState([]);
  const [MTfiftytopTracks, setMTfiftytopTracks] = useState([]);

  const [recommendations, setrecommendations] = useState([]);
  const [loggedIn, setloggedIn] = useState(false);
  const [display, setDisplay] = useState([]);




  useEffect(() => {
    if (window.location.hash != "") {
      setaccessToken(getTokenFromUrl().access_token);
      console.log(getTokenFromUrl().access_token);
      window.location.hash="";
      setloggedIn(true);
    }

  }, [])

  useEffect(() => {
    if (accessToken != ""){
      getLongTermTopTracks();
      getMiddleTermTopTracks();
      getShortTermTopTracks();
    }
  }, [accessToken])


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
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method,
      body: JSON.stringify(body)
    });
    return await res.json();
  }
  
  async function getLongTermTopTracks(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    const x = await fetchWebApi(
      'v1/me/top/tracks?time_range=long_term&limit=50', 'GET'
    ).then((data) => {
      setfiftytopTracks(printTracks(data.items))
    });
  }

  async function getShortTermTopTracks(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    const x = await fetchWebApi(
      'v1/me/top/tracks?time_range=short_term&limit=50', 'GET'
    ).then((data) => {
      setSTfiftytopTracks(printTracks(data.items))
    });
  }

  async function getMiddleTermTopTracks(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    const x = await fetchWebApi(
      'v1/me/top/tracks?time_range=medium_term&limit=50', 'GET'
    ).then((data) => {
      setMTfiftytopTracks(printTracks(data.items))
    });
  }
    
  
  async function getRecommendations(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-recommendations
    const x = await fetchWebApi(
      `v1/recommendations?limit=50&seed_tracks=${STfiftytopTracks.slice(0,5).map(fiftytopTracks => fiftytopTracks[3]).join(',')}`, 'GET'
    ).then((data) => {
    setrecommendations(printTracks(data.tracks))});
  }


    
  function printTracks(data) {
    const track = [];
    for (let i = 0; i < 50; i++) {
      track.push([
        data[i].album.images[0]["url"],
        data[i].name,
        data[i].artists.map(artist => artist.name).join(', '),
        data[i].id,
        data[i]
      ]);
    }
    return track
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
    <div>
      {!loggedIn && <a href={loginUrl}>hi</a>}
      {loggedIn && <div id='sidebyside'>
      <div>
      <div id='sidebyside'>
      <h1 onClick={(event) => setDisplay(fiftytopTracks)}>Long</h1>
      <h1 onClick={(event) => setDisplay(MTfiftytopTracks)}>Middle</h1>
      <h1 onClick={(event) => setDisplay(STfiftytopTracks)}>Short</h1>
      </div>
      <List sx={{ width: '100%', maxWidth: 600, bgcolor: 'background.paper' }}>
      {display.map((top, i) => {
              return (
                <ListItem sx={{}}
                  key={i}
                >
                  
                  <ListItemIcon>
                    <img src={top[0]} height={"40px"} alt={top[1]} />
                  </ListItemIcon>
                  
                   <ListItemText primary={top[1]} secondary={top[2]} ></ListItemText>
                </ListItem>
              );
            })}
      </List>
      </div>
      <div>
      <h1 onClick={(event) => getRecommendations()}>click for recs</h1>
      <List sx={{ width: '100%', maxWidth: 480, bgcolor: 'background.paper' }}>
      {recommendations.map((top, i) => {
              return (
                <ListItem
                  key={i}
                >
                  
                  <ListItemIcon>
                    <img src={top[0]} height={"40px"} alt={top[1]} />
                  </ListItemIcon>
                  
                   <ListItemText primary={top[1]} secondary={top[2]} ></ListItemText>
                </ListItem>
              );
            })}
      </List>
      </div>
      </div>}
      
      
    </div>
  );
}

export default App;
