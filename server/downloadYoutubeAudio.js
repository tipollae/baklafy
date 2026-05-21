const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const youtubeDL = require('youtube-dl-exec');

function downloadYoutubeAudio(videoUrl, customFolder = 'downloads') {
    const targetDirectory = path.resolve(customFolder || 'downloads');
    const outputTemplate = path.join(targetDirectory, `%(title)s.%(ext)s`); //str template for output

    return youtubeDL.exec(videoUrl, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '0', //use 0 for VBR and 320k for CBR
        ffmpegLocation: ffmpegPath,
        output: outputTemplate,
        noAbortOnError: true, //SKIP UNAVAILABLE VIDEOS

        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    }).then(processResult => {
        return processResult;
    }).catch(err => {
        if (err.exitCode === 1) {
            console.warn("yt-dlp completed with partial warnings (usually unavailable videos). success.")
            return err.stdout;
        }

        throw err;
    });
};

module.exports = { downloadYoutubeAudio }