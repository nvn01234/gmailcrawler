const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials) {
    let clientSecret = credentials.installed.client_secret;
    let clientId = credentials.installed.client_id;
    let redirectUrl = credentials.installed.redirect_uris[0];
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    return new Promise((resolve, reject) => {
        fs.readFile(TOKEN_PATH, function(err, token) {
            if (err) {
                getNewToken(oauth2Client).then(resolve);
            } else {
                oauth2Client.credentials = JSON.parse(token);
                resolve(oauth2Client);
            }
        });
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 */
function getNewToken(oauth2Client) {
    let authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', function(code) {
            rl.close();
            oauth2Client.getToken(code, function(err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    reject(err);
                }
                oauth2Client.credentials = token;
                try {
                    storeToken(token);
                } catch(e) {
                    reject(e);
                }
                resolve(oauth2Client);
            });
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

// Load client secrets from a local file.
function load() {
    return new Promise((resolve, reject) => {
        fs.readFile('client_secret.json', function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                reject(err);
            }
            // Authorize a client with the loaded credentials, then call the
            // Gmail API.
            authorize(JSON.parse(content)).then(resolve);
        });
    });
}

function listMessages(auth, processMessages) {
    console.log("listing messages");
    return new Promise((resolve, reject) => {
        let gmail = google.gmail('v1');
        let params = {
            auth: auth,
            userId: 'me',
            includeSpamTrash: true,
        };
        let getPageOfMessages = (gmail, params) => {
            gmail.users.messages.list(params, {}, (err, response) => {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    reject(err);
                } else {
                    let messages = response.messages;
                    processMessages(messages);
                    console.log(`+ ${messages.length} messages`);
                    let nextPageToken = response.nextPageToken;
                    if (nextPageToken) {
                        params["pageToken"] = nextPageToken;
                        getPageOfMessages(gmail, params);
                    } else {
                        resolve();
                    }
                }
            });
        };
        getPageOfMessages(gmail, params);
    });
}

function getMessage(auth, id) {
    console.log(`get message ${id}`);
    return new Promise((resolve, reject) => {
        let gmail = google.gmail('v1');
        let params = {
            auth: auth,
            userId: 'me',
            id: id,
        };
        gmail.users.messages.get(params, {}, (err, response) => {
            if (err) {
                console.log('The API returned an error: ' + err);
                reject(err);
            }
            resolve(response);
        });
    });
}

export default {
    load: load,
    listMessages: listMessages,
    getMessage: getMessage,
};