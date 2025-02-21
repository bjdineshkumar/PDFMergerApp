const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const { spawn, execSync } = require("child_process");
const path = require("path");

let mainWindow;

// ✅ Detect if running in Development or Packaged Mode
const isPackaged = app.isPackaged;

// ✅ Path to Embedded Python Executable
const pythonExecutable = isPackaged
    ? path.join(process.resourcesPath,"app", "backend", "python", "python.exe")  // ✅ Use embedded Python in packaged mode
    : path.join(__dirname, "backend", "python", "python.exe");  // ✅ Use local embedded Python in dev mode

// ✅ Path to Python Script
const pythonScriptPath = isPackaged
    ? path.join(process.resourcesPath,"app", "backend", "merge_pdfs.py")  // ✅ Packaged mode
    : path.join(__dirname, "backend", "merge_pdfs.py");  // ✅ Development mode

console.debug("🐍 Python Executable:", pythonExecutable);
console.debug("🐍 Python Script Path:", pythonScriptPath);

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: isPackaged, // ✅ Security enabled only in production
            sandbox: false,
            experimentalFeatures: true,
        },
        icon: path.join(__dirname, "icon.ico"),
    });

    console.debug("✅ Main process started. Running in", isPackaged ? "Packaged" : "Development", "mode.");

    // ✅ Register all IPC event handlers
    registerIpcHandlers();

    // ✅ Load the Frontend UI AFTER handlers are registered
    mainWindow.loadFile("frontend/index.html");

    // ✅ Quit the app when all windows are closed (except on macOS)
    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
});

// ✅ Function to register all IPC event handlers
function registerIpcHandlers() {
    // ✅ Handle File Selection Dialog (Resume or Cover Letter)
    ipcMain.handle("open-file-dialog", async (event, type) => {
        console.debug(`📂 Opening file dialog for: ${type}`);
        const { filePaths } = await dialog.showOpenDialog({
            title: `Select ${type === "resume" ? "Resume" : "Cover Letter"}`,
            properties: ["openFile"],
            filters: [{ name: "PDF Files", extensions: ["pdf"] }]
        });

        if (filePaths.length > 0) {
            console.debug(`📂 Selected ${type} file:`, filePaths[0]);
            return filePaths[0]; // ✅ Return selected file path to renderer
        } else {
            console.debug("⚠️ File selection canceled.");
            return null;
        }
    });

    // ✅ Handle Save Path Selection Dialog
    ipcMain.handle("select-save-path", async () => {
        console.debug("📂 Save path selection dialog opened...");
        const { filePath } = await dialog.showSaveDialog({
            title: "Save Merged PDF",
            defaultPath: "Resume.pdf",
            filters: [{ name: "PDF Files", extensions: ["pdf"] }]
        });

        console.debug("📂 Selected save path:", filePath || "None (canceled)");
        return filePath || null;
    });

    // ✅ Handle PDF Merging Request from Renderer Process
    ipcMain.on("merge-pdfs", (event, data) => {
        console.debug("📩 Received merge request from frontend:", data);

        if (!data?.resume || !data?.cover_letter || !data?.output) {
            console.debug("❌ Missing file paths in request!");
            event.reply("merge-result", { status: "error", message: "Missing file paths!" });
            return;
        }

        // ✅ Check if Python is available before executing the script
        if (!pythonExecutable) {
            event.reply("merge-result", { status: "error", message: "Python is not installed on this system!" });
            return;
        }

        // ✅ Spawn Python Process to Merge PDFs
        const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, JSON.stringify(data)]);

        pythonProcess.stdout.on("data", (output) => {
            const responseString = output.toString().trim();
            console.debug("🐍 Raw Python Output:", responseString);
        
            try {
                // ✅ Ensure the response is a valid JSON string
                if (responseString.startsWith("{") && responseString.endsWith("}")) {
                    const response = JSON.parse(responseString);
                    event.reply("merge-result", response);
                } else {
                    console.debug("⚠️ Unexpected output format from Python.");
                    event.reply("merge-result", { status: "error", message: "Unexpected response from backend. Received: " + responseString });
                }
            } catch (error) {
                console.debug("⚠️ Error parsing JSON:", error);
                event.reply("merge-result", { status: "error", message: "Failed to process response from Python." });
            }
        });
        

        pythonProcess.stderr.on("data", (error) => {
            console.debug("🐍 Python Error:", error.toString());
            event.reply("merge-result", { status: "error", message: error.toString() });
        });

        pythonProcess.on("close", (code) => {
            if (code !== 0) {
                event.reply("merge-result", { status: "error", message: "PDF merge failed. Process exited with code " + code });
            }
        });
    });

    // ✅ Handle External Links (Open in Browser)
    ipcMain.on("open-external-link", (event, url) => {
        console.debug("🌐 Opening external link:", url);
        shell.openExternal(url);
    });
}
