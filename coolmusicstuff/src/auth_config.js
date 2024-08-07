export const authEndpoint = "https://accounts.spotify.com/authorize";

export const client_id = "29ec048756da4eb092460068d82fa4a8";
export const redirectUri = "http://localhost:3000/callback";
export const scopes = [
    "user-top-read",
    "user-read-currently-playing",
    "user-read-playback-state",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-recently-played",
    "streaming",
    "user-read-email",
    "user-read-private"
];