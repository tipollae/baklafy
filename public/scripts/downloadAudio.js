const urlInput = document.getElementById("url-input");
const submitButton = document.getElementById("download-btn");

submitButton.addEventListener("click", (event) => {
    event.preventDefault();

    const videoUrl = urlInput.value.trim();

    if (!videoUrl) {
        alert("Enter a youtube URL!");
        return;
    }

    submitButton.textContent = "Converting...";
    submitButton.disabled = true; 
    submitButton.style.backgroundColor = "#f39c12";

    socket.emit("downloadmp3", {
        url: videoUrl,
    });

});

socket.on('download-file-transfer', async (data) => {

    const { fileName, fileData, metadata } = data;
    console.log(`Received raw file data from server for: ${fileName}`);

    document.getElementById('video-title').innerText = metadata.title;
    document.getElementById('video-uploader').innerText = metadata.uploader;
    document.getElementById('video-date').innerText = metadata.date;
    if (metadata.thumbnail) { 
        document.getElementById('video-thumbnail').src = metadata.thumbnail;
    }

    const result = await window.electronAPI.saveToAppData({ fileName, fileData });

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