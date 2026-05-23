const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const youtubeDL = require('youtube-dl-exec');
const userDataPath = path.join(process.env.APPDATA, 'unemployedihfy');

function downloadYoutubeAudio(videoUrl, customFolder = `${userDataPath}/downloads`) {
    const targetDirectory = path.resolve(customFolder || `${userDataPath}/downloads`);
    const outputTemplate = path.join(targetDirectory, `%(title)s.%(ext)s`); //str template for output

    return youtubeDL.exec(videoUrl, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '0', //use 0 for VBR and 320k for CBR
        ffmpegLocation: ffmpegPath,
        output: outputTemplate,
        exec: 'echo', // echoes the final path
        noAbortOnError: true, //SKIP UNAVAILABLE VIDEOS

        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
}).then( async (processResult) => {
        const files = await fs.promises.readdir(targetDirectory);

        const mp3Files = files
            .filter(f => f.endsWith('.mp3'))
            .map(f => ({ name: f, time: fs.statSync(path.join(targetDirectory, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (mp3Files.length === 0) return processResult;
        
        const fileName = mp3Files[0].name;
        const sourceFile = path.join(targetDirectory, fileName);
        const destinationFile = path.join(path.resolve(`${userDataPath}/downloads`), fileName);

        if (sourceFile !== destinationFile) {
            await fs.promises.mkdir(path.dirname(destinationFile), { recursive: true });
            await fs.promises.copyFile(sourceFile, destinationFile);
        }

        return processResult;
    }).catch(err => {
        const isInvalidUrl = err.stderr && (
            err.stderr.includes('not a valid URL') || 
            err.stderr.includes('is not a valid URL') ||
            err.stderr.includes('Unable to extract')
        );

        if (err.exitCode === 1 && !isInvalidUrl) {
            console.warn("yt-dlp completed with partial warnings (usually unavailable videos). success.")
            return err.stdout;
        }

        throw err;
    });
};

module.exports = { downloadYoutubeAudio }