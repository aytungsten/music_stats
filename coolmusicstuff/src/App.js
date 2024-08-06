import React, {useState, useEffect} from "react";
import './App.css';
import { authEndpoint, redirectUri, scopes } from "./auth_config";
import SpotifyWebApi from 'spotify-web-api-js'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Avatar, ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import { create } from "@mui/material/styles/createTransitions";
import ListItemButton from '@mui/material/ListItemButton';
import {BarChart} from '@mui/x-charts/BarChart'



const spotify = new SpotifyWebApi();
let hoverTopTracks = Array.from({length: 50}, i => i = false);
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
  const [userInfo, setUserInfo] = useState({});

  const [STsongFT, setSTsongFT] = useState([]);
  const [MTsongFT, setMTsongFT] = useState([]);
  const [LTsongFT, setLTsongFT] = useState([]);


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
      getUserInfo();
      console.log(fiftytopTracks)
      console.log(userInfo)
      setDisplay(fiftytopTracks);
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

  async function createPlaylist(){
    return await fetchWebApi(`v1/users/${userInfo.id}/playlists`, 'POST', 
      {
        "name": "some recs for you",
        "description": "based on recent listening habits",
        "public": false
      }
    )
  }

  async function createRecommendationsPlaylist(){
    const t = await createPlaylist().then((data) => {
      console.log(data)
      let t = [];
      for (let i = 0; i < 50; i++) {
        t.push(recommendations[i][4]);
      }

      fetchWebApi(`v1/playlists/${data.id}/tracks`, 'POST',
        {'uris': t}
       )
    })
  }

  async function getUserInfo() {
    const x = await fetchWebApi('v1/me', 'GET')
    setUserInfo(x)
  }
  
  async function getLongTermTopTracks(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    const x = await fetchWebApi(
      'v1/me/top/tracks?time_range=long_term&limit=50', 'GET'
    ).then((data) => {
      printandStatTracks(data.items, setfiftytopTracks)
    });
  }

  async function getShortTermTopTracks(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    const x = await fetchWebApi(
      'v1/me/top/tracks?time_range=short_term&limit=50', 'GET'
    ).then((data) => {
      printandStatTracks(data.items, setSTfiftytopTracks)
    });
  }

  async function getMiddleTermTopTracks(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    const x = await fetchWebApi(
      'v1/me/top/tracks?time_range=medium_term&limit=50', 'GET'
    ).then((data) => {
      printandStatTracks(data.items, setMTfiftytopTracks)
    });
  }

  async function getRecommendations(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-recommendations
    const x = await fetchWebApi(
      `v1/recommendations?limit=50&seed_tracks=${STfiftytopTracks.slice(0,5).map(fiftytopTracks => fiftytopTracks[3]).join(',')}`, 'GET'
    ).then((data) => {
      printandStatTracks(data.tracks, setrecommendations)
    document.getElementById('buttonsss').innerHTML = '<button>Make a playlist with these songs!</button>'});
  }


  async function printTracks(data, setFunction) {
    const track = [];
    for (let i = 0; i < 50; i++) {
     track.push([
        data[i].album.images[0]["url"],
        data[i].name,
        data[i].artists.map(artist => artist.name).join(', '),
        data[i].id,
        data[i].uri,
        data[i].external_urls.spotify,
      ])
    }
    console.log(track)
    setFunction(track)
  }

  async function printandStatTracks(data, setFunction) {
    const track = [];
    const res = await getSongStats(data).then((info) => {    
    for (let i = 0; i < 50; i++) {
      track.push([
        data[i].album.images[0]["url"],
        data[i].name,
        data[i].artists.map(artist => artist.name).join(', '),
        data[i].id,
        data[i].uri,
        data[i].external_urls.spotify,
        info[i]
      ])}})
    console.log(track)
    setFunction(track)
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


  async function getSongStats(identifier) {
    let ids = identifier.map((identifier) => identifier.id)
    return (await fetchWebApi(
      `v1/audio-features?ids=${ids.toString()}`, 'GET'
    )).audio_features
  }
 
  async function getSongerStats(identifier) {
    let ids = identifier[3]
    const x =  await fetchWebApi(
      `v1/audio-features/${ids}`, 'GET'
    )
    console.log(x)
  }

  return (
    <div>
      {!loggedIn && <a href={loginUrl}>hi</a>}
      {loggedIn && <div id='sidebyside'>
      <div>
      <h1>Top songs</h1>
      <button onClick={(event) => setDisplay(fiftytopTracks)}>12 months</button>
      <button onClick={(event) => setDisplay(MTfiftytopTracks)}>6 months</button>
      <button onClick={(event) => setDisplay(STfiftytopTracks)}>1 month</button>
      <List sx={{ width: '100%', maxWidth: 320, bgcolor: 'background.paper' }}>
      {display.map((top, i) => {
              return (
                <Tooltip placement="right" title={
                <BarChart
                  series={[
                    {data: [top[6]['danceability'], top[6]['energy'], top[6]['acousticness'], top[6]['instrumentalness']]}]}
                  bottomAxis= {null}
                  xAxis = {[{data: ["dance", "energy", "acousticness", "instrumentalness"],  scaleType: 'band'}]}
                  height = {120}
                  width = {120}
                  margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                  >
                </BarChart>
                } >
                <ListItemButton sx={{}} 
                  key={i}
                  href={top[5]}
                >                  
                  <ListItemIcon>
                    <img src={top[0]} height={"40px"} alt={top[1]} />
                  </ListItemIcon>
                  
                   <ListItemText primary={top[1]} secondary={top[2]} ></ListItemText>
                </ListItemButton>
                </Tooltip>
              );
            })}
      </List>
      </div>
      {/* <div>
      <h1>Different stats (WIP)</h1>
      <BarChart
        series={[
          {data: display.map((display) => display[6]['danceability']).sort(function(a,b) { return a - b;})}
        ]}
        bottomAxis = {null}
        xAxis= {[{data: (display.map((display) => [display[1], display[6]['danceability']]).sort(function(a,b) {return a[1] - b[1]}).map((x) => x[0])), scaleType: 'band'}]}
        yAxis={[{label: 'Danceability'}]}
        height = {150}
        width= {200}
        margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        >
      </BarChart>
      <BarChart
        series={[
          {data: display.map((display) => display[6]['energy']).sort(function(a,b) { return a - b;})}
        ]}
        bottomAxis = {null}
        xAxis= {[{data: (display.map((display) => [display[1], display[6]['energy']]).sort(function(a,b) {return a[1] - b[1]}).map((x) => x[0])), scaleType: 'band'}]}
        yAxis={[{label: 'Energy'}]}
        height = {150}
        width= {200}
        margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        >
      </BarChart>
      <BarChart
        series={[
          {data: display.map((display) => display[6]['acousticness']).sort(function(a,b) { return a - b;})}
        ]}
        bottomAxis = {null}
        xAxis= {[{data: (display.map((display) => [display[1], display[6]['acousticness']]).sort(function(a,b) {return a[1] - b[1]}).map((x) => x[0])), scaleType: 'band'}]}
        yAxis={[{label: 'Acousticness'}]}
        height = {150}
        width= {200}
        margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        >
      </BarChart>
      <BarChart
        series={[
          {data: display.map((display) => display[6]['instrumentalness']).sort(function(a,b) { return a - b;})}
        ]}
        bottomAxis = {null}
        xAxis= {[{data: (display.map((display) => [display[1], display[6]['instrumentalness']]).sort(function(a,b) {return a[1] - b[1]}).map((x) => x[0])), scaleType: 'band'}]}
        yAxis={[{label: 'Instrumentality'}]}
        height = {150}
        width= {200}
        margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        >
      </BarChart>
      </div> */}
      <div>
      <h1 onClick={(event) => getRecommendations()}>click here for recs</h1>
      <div onClick={(event) => createRecommendationsPlaylist()} id = 'buttonsss'></div>
      <List sx={{ width: '100%', maxWidth: 320, bgcolor: 'background.paper' }}>
      {recommendations.map((top, i) => {
              return (
                <Tooltip placement="right" title={
                  <BarChart
                    series={[
                      {data: [top[6]['danceability'], top[6]['energy'], top[6]['acousticness'], top[6]['instrumentalness']]}]}
                    bottomAxis= {null}
                    xAxis = {[{data: ["dance", "energy", "acousticness", "instrumentalness"],  scaleType: 'band'}]}
                    height = {120}
                    width = {120}
                    margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                    >
                  </BarChart>
                  } >
                  <ListItemButton sx={{}} 
                    key={i}
                    href={top[5]}
                  >                  
                    <ListItemIcon>
                      <img src={top[0]} height={"40px"} alt={top[1]} />
                    </ListItemIcon>
                    
                     <ListItemText primary={top[1]} secondary={top[2]} ></ListItemText>
                  </ListItemButton>
                  </Tooltip>
              );
            })}
      </List>
      </div>
      

      </div>}
      
      
    </div>
  );
}

export default App;
