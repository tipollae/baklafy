const browseBtn = document.getElementById('browse-btn');
const pathDisplay = document.getElementById('selected-path-display');
const urlInput = document.getElementById("url-input");
const directoryInput = document.getElementById("directory-input");
const submitButton = document.getElementById("download-btn");

browseBtn.addEventListener('click', async () => {
    try {
        const realPath = await window.electronAPI.selectFolder();

        if (realPath) {
            pathDisplay.textContent = realPath;
            directoryInput.value = realPath;
        }
    } catch (err) {
        console.error("Failed to open dialog: ", err);
    }
});

submitButton.addEventListener("click", (event) => {
    event.preventDefault();

    const videoUrl = urlInput.value.trim();
    const directory = directoryInput.value.trim();

    if (!videoUrl) {
        alert("Enter a youtube URL!");
        return;
    }

    submitButton.textContent = "Converting...";
    submitButton.disabled = true; 
    submitButton.style.backgroundColor = "#f39c12";

    socket.emit("downloadmp3", {
        url: videoUrl,
        folder: directory
    });
});

socket.on('download-file-transfer', async (data) => {
    const { fileName, fileData } = data;
    console.log(`Received raw file data from server for: ${fileName}`);

    const result = await window.electronAPI.saveToAppData({ fileName, fileData });

    if (result.success) {
        alert(`Downloaded and saved to your local AppData:\n${result.path}`);
    } else {
        alert(`Failed to save file: ${result.error}`);
    }
});

socket.on('download-status', (response) => {
    if (response.success) {
        submitButton.textContent = "Complete!"
        submitButton.style.backgroundColor = "#2ecc71";
        submitButton.disabled = false; //re-enable the button

        setTimeout(() => { //reset to default after 4s
                    submitButton.textContent = "Convert to MP3";
                    submitButton.style.backgroundColor = "";
                }, 4000);
    } else {
        submitButton.textContent = "Failed. Check your URL?";
        submitButton.style.backgroundColor = "#e74c3c";
        submitButton.disabled = false;

        setTimeout(() => { //reset to default after 4s
            submitButton.textContent = "Convert to MP3";
            submitButton.style.backgroundColor = "";
        }, 4000);
    }
});