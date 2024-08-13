import React, {useState, useEffect} from "react";
import '../src/App.css';
import { authEndpoint, redirectUri, scopes } from "./auth_config";
import SpotifyWebApi from 'spotify-web-api-js';
import List from '@mui/material/List';
import {ListItemIcon, ListItemText, Tooltip, Button} from "@mui/material";
import ListItemButton from '@mui/material/ListItemButton';
import {BarChart} from '@mui/x-charts/BarChart';
import Modal from 'react-modal';
import Exit from './photos/exit.png';
import {ColorExtractor} from 'react-color-extractor';
import { styled } from '@mui/material/styles';



const spotify = new SpotifyWebApi();
let audio = "";
let playingTrack = "";
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
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState([]);
  const [colors, setColors] = useState([]);
  const [landingPage, setLandingPage] = useState(false);
  const [profilePage, setProfilePage] = useState(false);
  const [currentSong, setCurrentSong] = useState([]);
  const [currentSongModal, setCurrentSongModal] = useState(false);

  
  const handleShow = () => setShow(true);
  useEffect(() => {
    if (window.location.hash != "") {
      setaccessToken(getTokenFromUrl().access_token);
      console.log(getTokenFromUrl().access_token);
      window.location.hash="";
      setLandingPage(true);
    }

  }, [])

  useEffect(() => {
    if (accessToken != ""){
      getLongTermTopTracks();
      getMiddleTermTopTracks();
      getShortTermTopTracks();
      getUserInfo();
      getCurrentlyPlayingSong();
      console.log(fiftytopTracks)
      console.log(userInfo)
      setDisplay(fiftytopTracks);

    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken != "") {
    const playing = setTimeout(getCurrentlyPlayingSong, 10000);
    
    return () => clearTimeout(playing);
    }
  }, [currentSong])

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
    setloggedIn(true)
  }
  
  async function getLongTermTopTracks(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    const x = await fetchWebApi(
      'v1/me/top/tracks?time_range=long_term&limit=50', 'GET'
    ).then((data) => {
      printandStatTracks(data.items, setfiftytopTracks)
    });
  }

  async function getTopArtists(){

  }

  async function getRecentlyPlayedTracks(){
    const res = await fetchWebApi(
      'v1/me/player/recently-played?limit=50'
    )
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

  async function getCurrentlyPlayingSong(){
    const res = await fetchWebApi('v1/me/player/currently-playing').then((data) => {
      if (data.item != null) {
      console.log("current id: " + data.item.id + " old id: " + currentSong[3])
      console.log(data.item);
      printandStatTrack(data.item, setCurrentSong);
      }
    }).then(() => {
      if (currentSong != []) {
      return (<ColorExtractor rgb getColors={colors => {setColors(colors);
        console.log(colors);
        document.body.style.backgroundColor = `rgb(${colors[0].toString()},0.2)`
        document.body.style.color = `rgb(${colors[2].toString()})`
      }} maxColors = {3}>
      <img src={currentSong[0]} height={"200px"}></img>
      </ColorExtractor>)
      }
    })
  }

  async function getRecommendations(){
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-recommendations
    const x = await fetchWebApi(
      `v1/recommendations?limit=50&seed_tracks=${STfiftytopTracks.slice(0,5).map(fiftytopTracks => fiftytopTracks[3]).join(',')}`, 'GET'
    ).then((data) => {
      printandStatTracks(data.tracks, setrecommendations)})
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

  async function printandStatTrack(data, setFunction) {

    const track = [];
    const res = await getSongerStats(data).then((info) => {
      track.push(
        data.album.images[0]["url"],
        data.name,
        data.artists.map(artist => artist.name).join(', '),
        data.id,
        data.uri,
        data.external_urls.spotify,
        info,
        data.preview_url,
      )})
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
        info[i],
        data[i].preview_url,
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
    console.log('identifier ' + identifier)
    let ids = identifier.id
    return (await fetchWebApi(
      `v1/audio-features?ids=${ids}`, 'GET'
    )).audio_features
  }



  function handleClose(set) {
    set(false); 
    document.body.style.overflow = 'unset'; 
    if (audio != "") {
      audio.pause();
    }
  }



  function Popup(data, display, set) {
    document.body.style.overflow = 'hidden';
    return (
      <Modal isOpen={display} className="popup" id = "songpop">
        <img src= {Exit} alt="bro where is it" height={'40px'} onClick={(event) => {handleClose(set)}} id="closeitup"></img>     
        <div className="center">
        <ColorExtractor rgb getColors={colors => {setColors(colors);
          console.log(colors);
          document.getElementById('songpop').style.background = `linear-gradient(rgb(${colors[0].toString()},0.4), rgb(${colors[0].toString()}, 0.4))`
          document.getElementById('songpop').style.color = `rgb(${colors[2].toString()})`
        }} maxColors = {3}>
        <img src={data[0]} height={"200px"}></img>
        </ColorExtractor>
        <div>
        <h2 id="Name">{data[1]}</h2>
        <p id="Name">{data[2]}</p>
        </div>
        <Button color = "inherit" onClick={                                       
           (event) => {
                    if (playingTrack == data[1]) {
                      audio.pause();
                      playingTrack = "";
                    }
                    else {
                    if (audio != "") {
                      audio.pause();
                    }
                    audio = new Audio(data[7])
                    audio.play()
                    playingTrack = data[1]}}}>Preview</Button>

        </div>
        </Modal>
    )
  }



  return (
    <div>
      {!loggedIn && <Button color="inherit" href={loginUrl} >hi</Button>}
      {loggedIn && landingPage && <div>
      <div>
      <div>
        <img src= {userInfo.images[1].url} onClick = {(event) =>{setLandingPage(false); setProfilePage(true)}}  class='profilePic'></img>
      </div>
      <h1>Top songs</h1>
      <Button color="inherit" onClick={(event) => setDisplay(fiftytopTracks)}>12 months</Button>
      <Button color="inherit" onClick={(event) => setDisplay(MTfiftytopTracks)}>6 months</Button>
      <Button color="inherit" onClick={(event) => setDisplay(STfiftytopTracks)}>1 month</Button>
      <List sx={{display: "flex", flexWrap: "wrap", width: '100%', height: '50%'}}>
      {display.map((top, i) => {
              return (
                <div>
                <Tooltip placement="top-end" title={
                <div>
                <h3>{top[1]}</h3>
                <div>
                <BarChart

                  series={[
                    {data: [top[6]['danceability']*10], label: 'Danceability'}, 
                    {data: [top[6]['energy']*10], label: 'Energy'}, 
                    {data: [top[6]['acousticness']*10], label: 'Acousticness'},
                    {data: [top[6]['instrumentalness']*10], label: 'Instrumentalness'}]}
                  xAxis = {[{data: ['Audio Features'],  scaleType: 'band'}]}
                  height = {100}
                  width = {150}
                  slotProps={{ legend: { hidden: true } }}
                  margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                  >
                  </BarChart>

                </div>
                </div>
                } slotProps={{
                  tooltip: {
                    sx: {
                    },
                  },
                }} >
                <ListItemButton sx={{width: 283, height: 90}}
                  key={i}
                  onClick={(event) => {handleShow(); setFocus(top)}}

                >                  
                  <ListItemIcon>
                    <img src={top[0]} height={"40px"} alt={top[1]} />
                  </ListItemIcon>
                  
                   <ListItemText primary={top[1]} secondary={top[2]} ></ListItemText>
                </ListItemButton>
                </Tooltip>
                </div>
              );
            })}
      </List>
      </div>
      <div>
      <h1 onClick={(event) => getRecommendations()}>click here for recs</h1>
      {(recommendations.length != 0) && <div onClick={(event) => createRecommendationsPlaylist()} id = 'buttonsss'>
      <Button color="inherit" >Make a playlist with these songs!</Button>
      </div>}

      <List sx={{display: "flex", flexWrap: "wrap", width: '100%', height: '50%'}}>
      {recommendations.map((top, i) => {
              return (
                <div>
                <Tooltip placement="top-end" title={
                <div>
                <h3>{top[1]}</h3>
                <div>
                <BarChart

                  series={[
                    {data: [top[6]['danceability']*10], label: 'Danceability'}, 
                    {data: [top[6]['energy']*10], label: 'Energy'}, 
                    {data: [top[6]['acousticness']*10], label: 'Acousticness'},
                    {data: [top[6]['instrumentalness']*10], label: 'Instrumentalness'}]}
                  xAxis = {[{data: ['Audio Features'],  scaleType: 'band'}]}
                  height = {100}
                  width = {150}
                  slotProps={{ legend: { hidden: true } }}
                  margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                  >
                  </BarChart>

                </div>
                </div>
                } >
                <ListItemButton sx={{width: 283, height: 90}}
                  key={i}
                  onClick={(event) => {handleShow(); setFocus(top)}}

                >                  
                  <ListItemIcon>
                    <img src={top[0]} height={"40px"} alt={top[1]} />
                  </ListItemIcon>
                  
                   <ListItemText primary={top[1]} secondary={top[2]} ></ListItemText>
                </ListItemButton>
                </Tooltip>
                </div>
              );
            })}
      </List>
      </div>

      

      </div>}
      {loggedIn && profilePage && <div id="profile">
        <ColorExtractor src={userInfo.images[1].url} rgb getColors={colors => {
        document.getElementById("profile").style.color = `rgb(${colors[0].toString()})`
        document.getElementById("profile").style.backgroundColor = `rgb(${colors[0].toString()}, 0.1)`;
        }} maxColors = {5}></ColorExtractor>
        <div>
        <img className = "picProfile"src= {userInfo.images[1].url} onClick = {(event) =>{setLandingPage(true); setProfilePage(false)}}></img>
        </div>
        <h1>{userInfo.display_name}</h1>
        <h1>this is your profile</h1>
        <Button color="inherit" onClick = {(event) => {setCurrentSongModal(true)}}>click to display current song</Button>
        <Button color="inherit" onClick = {(event) =>{setLandingPage(true); setProfilePage(false)}}>click here to go back</Button>
        </div>}
      {show && Popup(focus, show, setShow)}
      {currentSongModal && Popup(currentSong, currentSongModal, setCurrentSongModal)}
      
    
    </div>
  );
}


export default App;
