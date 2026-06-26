const songImage = document.getElementById("song-image");
const songTitle = document.getElementById("song-name");
const songArtist = document.getElementById("song-artist");
const songSlider = document.getElementById("song-slider");
const playButton = document.getElementById("play-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const songList = document.getElementById("song-list");
const tabButtons = document.querySelectorAll(".tab-button");

const playlists = {
    jazz: [
        { title: "Blue in Green", artist: "Miles Davis", audio: "jazz1.mp3", cover: "jazz1.jpg" },
        { title: "Take Five", artist: "Dave Brubeck", audio: "jazz2.mp3", cover: "jazz2.jpg" },
        { title: "Autumn Leaves", artist: "Bill Evans", audio: "jazz3.mp3", cover: "jazz3.jpg" },
    ],
    classical: [
        { title: "Moonlight Sonata", artist: "Beethoven", audio: "classical1.mp3", cover: "classical1.jpg" },
        { title: "Clair de Lune", artist: "Debussy", audio: "classical2.mp3", cover: "classical2.jpg" },
        { title: "Four Seasons", artist: "Vivaldi", audio: "classical3.mp3", cover: "classical3.jpg" },
    ]
};

const audio = document.createElement("audio");
let currentPlaylist = "jazz";
let songs = playlists[currentPlaylist];
let currentSongIndex = 0;

// Switch playlist when tab is clicked
tabButtons.forEach(button => {
    button.addEventListener("click", function() {
        tabButtons.forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");

        currentPlaylist = this.dataset.playlist;
        songs = playlists[currentPlaylist];
        currentSongIndex = 0;
        updateSong();
        renderSongList();
    });
});

// Render song list in sidebar
function renderSongList() {
    songList.innerHTML = "";
    songs.forEach(function(song, index) {
        const li = document.createElement("li");
        li.textContent = `${song.title} — ${song.artist}`;
        li.classList.add("song-item");
        if (index === currentSongIndex) li.classList.add("active");

        li.addEventListener("click", function() {
            currentSongIndex = index;
            updateSong();
            audio.play();
            renderSongList();
        });

        songList.appendChild(li);
    });
}

prevButton.addEventListener("click", function() {
    if (currentSongIndex == 0) return;
    currentSongIndex--;
    updateSong();
    renderSongList();
});

nextButton.addEventListener("click", function() {
    if (currentSongIndex == songs.length - 1) return;
    currentSongIndex++;
    updateSong();
    renderSongList();
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
renderSongList();