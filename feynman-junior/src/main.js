const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { ChatOllama } = require('langchain/chat_models/ollama');
const { SystemMessage } = require('langchain/schema');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let chatOllama;

const initializeOllama = async () => {
	chatOllama = new ChatOllama({
		baseUrl: "http://localhost:11434",
		model: "llama3.1:8b",
		temperature: 1
	});

	const sys = `You are acting as an audience to a presentation I will give in text. 
	First I will give you in the next message two things: <presentation topic>, <intended audience>
	I will then write a presentation script presenting the topic <presentataion topic>, you are to read the script,
	clean it up and ask 7 questions regarding <presentation topic> in the mindset of <audience>. 
	After each response to each question, validate the answer to the question and move on to the next question`
	

	const systemMessage = new SystemMessage(sys)

	try {
		const response = await chatOllama.call([systemMessage]);
		console.log("Model initialized with system message. Response:", response);
	  } catch (error) {
		console.error("Error initializing ChatOllama:", error);
	  };
	
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
	await initializeOllama();
	createWindow();

	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
