const songImage = document.getElementById("song-image");
const songTitle = document.getElementById("song-name");
const songArtist = document.getElementById("song-artist");
const songSlider = document.getElementById("song-slider");
const playButton = document.getElementById("play-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");

const songs = [
  {
    title: "The Vampire Masquerade",
    artist: "Peter Gundry",
    audio: "audio1.mp3",
    cover: "cover1.jpg",
  }
];

const audio = document.createElement("audio");
let currentSongIndex = 0;

prevButton.addEventListener("click", function() {
    if (currentSongIndex == 0) return;
    currentSongIndex--;
    updateSong();
});

nextButton.addEventListener("click", function() {
    if (currentSongIndex == songs.length - 1) return;
    currentSongIndex++;
    updateSong();
});

playButton.addEventListener("click", function() {
    if (!audio.paused) {
        audio.pause();
    } else {
        audio.play();
    }
});

function updateSong() {
    const currentSong = songs[currentSongIndex];
    songImage.src = currentSong.cover;
    songTitle.textContent = currentSong.title;
    songArtist.textContent = currentSong.artist;
    audio.src = currentSong.audio;
    audio.onloadedmetadata = function() {
        songSlider.value = 0;
        songSlider.max = audio.duration;
    };
}

songSlider.addEventListener("change", function() {
    audio.currentTime = songSlider.value;
});

function moveSlider() {
    songSlider.value = audio.currentTime;
}

setInterval(moveSlider, 1000);

updateSong();