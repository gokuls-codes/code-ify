// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as http from "http";
// import * as open from "open";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "gokuls-codes-codeify" is now active!'
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "gokuls-codes-codeify.spotify",
      new SpotifyWebViewProvider(context)
    )
  );
  await context.secrets.store("spotify-access-token", "12345abcde");
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "gokuls-codes-codeify.helloWorld",
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from code-ify!" +
          (await context.secrets.get("spotify-access-token"))
      );
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

export class SpotifyWebViewProvider implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getWebviewContent();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "loginToSpotify":
          await this.startSpotifyAuth();
          break;
      }
    });
  }

  getWebviewContent() {
    return `
			  <!DOCTYPE html>
			  <html>
			  <style>
			 					  body {
					  font-family: Arial, sans-serif;
					  display: flex;
					  flex-direction: column;
					  align-items: center;
					  height: 100vh;
					  margin: 0;
					  background-color: #f0f0f0;
				  }
					  
				  h1 {
					  color: #333;
				  }

				  button {
					  padding: 10px 20px;
					  background-color: #1db954;
					  color: white;
					  border: none;
					  border-radius: 5px;
					  cursor: pointer;
				  }
			  </style>
			  <body>
				  <h1>Code-ify</h1>
				  <button onclick="sendMessage()">Login to spotify</button>
				  <script>
					  const vscode = acquireVsCodeApi();
					  async function sendMessage() {
						  vscode.postMessage({
							  command: 'loginToSpotify',
						  });
					  }
				  </script>
			  </body>
			  </html>
		  `;
  }

  private async startSpotifyAuth() {
    const spotifyClientId = "69bb0e71fec64a9c967d502f4b06d306";
    const spotifyRedirectUri = "http://localhost:3000/callback";
    const spotifyScopes = "user-read-playback-state user-modify-playback-state";

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${spotifyClientId}&response_type=token&redirect_uri=${encodeURIComponent(
      spotifyRedirectUri
    )}&scope=${encodeURIComponent(spotifyScopes)}`;

    // Open the Spotify login page in the user's default browser
    vscode.env.openExternal(authUrl as unknown as vscode.Uri);

    // Start a local server to handle the callback
    const server = http.createServer(async (req, res) => {
      if (req.url?.startsWith("/callback")) {
        const query = new URLSearchParams(req.url.split("#")[1]);
        const token = query.get("access_token");

        console.log(token);

        if (token) {
          await this.context.secrets.store("spotifyAuthToken", token);
          vscode.window.showInformationMessage("Spotify login successful!");

          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("Spotify login successful! You can close this tab.");
        } else {
          vscode.window.showErrorMessage("Spotify login failed!");
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Spotify login failed!");
        }

        server.close();
      }
    });

    server.listen(3000, () => {
      vscode.window.showInformationMessage("Waiting for Spotify login...");
    });
  }
}
