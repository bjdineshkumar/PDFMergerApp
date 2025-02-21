const { ipcRenderer } = require("electron");

console.debug("✅ Renderer script loaded!"); // Debug log to confirm the script is loaded

/**
 * Function to open a file selection dialog for selecting the Resume or Cover Letter PDF.
 * @param {string} type - The type of file to select ("resume" or "cover_letter").
 * @returns {Promise<string>} - Returns the selected file path.
 */
async function selectFile(type) {
    return await ipcRenderer.invoke("open-file-dialog", type);
}

// ✅ Add event listener to the Merge Button
document.getElementById("mergeBtn").addEventListener("click", async () => {

    console.debug("🚀 Merge button clicked!"); // Debug log to indicate button click

    // ✅ Get the status box element to show success/error messages
    const statusBox = document.getElementById("status");
    statusBox.style.display = "none"; // Hide status box before starting

    // ✅ Open file dialogs to select the Resume and Cover Letter PDFs
    const resumePath = await selectFile("resume");
    const coverLetterPath = await selectFile("cover_letter");

    console.debug("📂 Selected Resume Path:", resumePath);
    console.debug("📂 Selected Cover Letter Path:", coverLetterPath);

    // ✅ Validate if both files are selected
    if (!resumePath || !coverLetterPath) {
        statusBox.innerText = "❌ File selection failed!";
        statusBox.style.display = "block"; // Show status message
        console.debug("❌ No files selected. Merge process aborted.");
        return;
    }

    // ✅ Ask user where to save the merged PDF
    const outputPath = await ipcRenderer.invoke("select-save-path");

    if (!outputPath) {
        statusBox.innerText = "⚠️ Save canceled.";
        statusBox.style.display = "block"; // Show status message
        console.debug("⚠️ Save operation canceled by user.");
        return;
    }

    // ✅ Create an object containing file paths to send to the backend
    const pdfData = {
        resume: resumePath,
        cover_letter: coverLetterPath,
        output: outputPath
    };

    console.debug("📡 Sending data to backend:", pdfData); // Debug log before sending data

    // ✅ Send the selected files and save location to the backend for merging
    ipcRenderer.send("merge-pdfs", pdfData);
});

// ✅ Handle backend response and update the UI accordingly
ipcRenderer.on("merge-result", (event, response) => {
    const statusBox = document.getElementById("status");

    console.debug("📨 Raw Response from backend:", response); // Debug log for backend response

    try {
        // ✅ Ensure response is an object
        if (typeof response !== "object" || response === null) {
            throw new Error("Response is not a valid JSON object.");
        }

        // ✅ Check response status
        if (response.status === "success") {
            statusBox.innerText = "✅ " + response.message;
            statusBox.style.display = "block";
            statusBox.style.backgroundColor = "rgba(76, 175, 80, 0.7)"; // Green for success
        } else if (response.status === "error") {
            statusBox.innerText = "❌ " + response.message;
            statusBox.style.display = "block";
            statusBox.style.backgroundColor = "rgba(244, 67, 54, 0.7)"; // Red for error
            console.debug("⚠️ Backend Error:", response.message);
        } else {
            throw new Error("Response contains an unexpected status.");
        }
    } catch (error) {
        statusBox.innerText = "⚠️ Unexpected response from backend.";
        statusBox.style.display = "block";
        statusBox.style.backgroundColor = "rgba(255, 193, 7, 0.7)"; // Yellow for warnings
        console.debug("⚠️ Unexpected response format:", error, response);
    }
});

// ✅ Open external links in the default browser instead of inside the Electron app
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("a.external-link").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent the default in-app navigation
            const url = link.getAttribute("href");
            console.debug("🌐 Opening external link:", url);
            ipcRenderer.send("open-external-link", url); // Send event to main process
        });
    });
});
