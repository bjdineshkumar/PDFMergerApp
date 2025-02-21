const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const express = require("express");

let mainWindow;

// ✅ Detect if running in Development or Packaged Mode
const isPackaged = app.isPackaged;

// ✅ Fix Frontend Path for Packaged App
const frontendPath = isPackaged
    ? path.join(process.resourcesPath,"app", "frontend")
    : path.join(__dirname, "frontend");

// ✅ Path to Embedded Python Executable
const pythonExecutable = isPackaged
    ? path.join(process.resourcesPath,"app", "backend", "python", "python.exe")
    : path.join(__dirname, "backend", "python", "python.exe");

// ✅ Path to Python Script
const pythonScriptPath = isPackaged
    ? path.join(process.resourcesPath,"app", "backend", "merge_pdfs.py")
    : path.join(__dirname, "backend", "merge_pdfs.py");

console.debug("🐍 Python Executable:", pythonExecutable);
console.debug("🐍 Python Script Path:", pythonScriptPath);

// ✅ Start Express Server to Serve Frontend (Fix Local File Load Issue)
const server = express();
server.use(express.static(frontendPath));

server.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ✅ Start the server on port 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.debug(`✅ Express server running at http://localhost:${PORT}`);
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
                if (responseString.startsWith("{") && responseString.endsWith("}")) {
                    const response = JSON.parse(responseString);
                    
                    // ✅ If merge is successful, open the merged PDF
                    if (response.status === "success") {
                        shell.openPath(data.output).catch(err => console.error("❌ Failed to open PDF:", err));
                    }
    
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

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: false,
            webSecurity: isPackaged,
            sandbox: false,
        },
        icon: path.join(__dirname, "icon.ico"),
    });

    console.debug("✅ Main process started. Running in", isPackaged ? "Packaged" : "Development", "mode.");

    // ✅ Register IPC event handlers before loading frontend
    registerIpcHandlers();

    // ✅ Load Frontend from Express Server
    mainWindow.loadURL(`http://localhost:${PORT}`);

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
});
