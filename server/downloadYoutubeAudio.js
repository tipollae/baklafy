const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const youtubeDL = require('youtube-dl-exec');
const userDataPath = path.join(process.env.APPDATA, 'baklafy');

async function downloadYoutubeAudio(videoUrl, socket = null) {
    const targetDirectory = path.resolve(`${userDataPath}/downloads`);
    const outputTemplate = path.join(targetDirectory, `%(title)s.%(ext)s`);

    try {
        const today = new Date();
        const formatter = new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        //formats the current date as: 13 July 2026
        const currentDate = formatter.format(today);

        const rawMetadata = await youtubeDL(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });

        const metadata = {
            title: rawMetadata.title || 'Unknown Title',
            id: rawMetadata.id || 'Unknown ID',
            duration: rawMetadata.duration || 'Unknown Duration',
            uploader: rawMetadata.uploader || 'Unknown Uploader',
            date: currentDate || 'Unknown Date',
            thumbnail: rawMetadata.thumbnail || null
        };

        const processResult = await youtubeDL.exec(videoUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '0', 
            ffmpegLocation: ffmpegPath,
            output: outputTemplate,
            noAbortOnError: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });

        const files = await fs.promises.readdir(targetDirectory);

        const mp3Files = files
            .filter(f => f.endsWith('.mp3'))
            .map(f => ({ name: f, time: fs.statSync(path.join(targetDirectory, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (mp3Files.length === 0) return { processResult, metadata };
        
        const fileName = mp3Files[0].name;
        const sourceFile = path.join(targetDirectory, fileName);
        
        if (socket) {
            const fileBuffer = await fs.promises.readFile(sourceFile);
            
            socket.emit('download-file-transfer', {
                fileName: fileName,
                fileData: fileBuffer,
                metadata: metadata 
            });

            try {
                await fs.promises.unlink(sourceFile);
            } catch {
                console.error("failed to delete temp server-file");
            }
        }

        return { processResult, metadata };

    } catch (err) {
        const isInvalidUrl = err && err.stderr && (
            err.stderr.includes('not a valid URL') || 
            err.stderr.includes('is not a valid URL') ||
            err.stderr.includes('Unable to extract')
        );

        if (err && err.exitCode === 1 && !isInvalidUrl) {
            console.warn("yt-dlp completed with partial warnings (usually unavailable videos). success.");
            return err.stdout;
        }

        throw err;
    }
}

module.exports = { downloadYoutubeAudio };