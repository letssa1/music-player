const songImage = document.getElementById("song-image");
const songTitle = document.getElementById("song-name");
const songArtist = document.getElementById("song-artist");
const songSlider = document.getElementById("song-slider");
const playButton = document.getElementById("play-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const songList = document.getElementById("song-list");
const playlistTabs = document.getElementById("playlist-tabs");
const fileInput = document.getElementById("file-input");
const newPlaylistBtn = document.getElementById("new-playlist-btn");
const newPlaylistForm = document.getElementById("new-playlist-form");
const playlistNameInput = document.getElementById("playlist-name-input");
const confirmPlaylistBtn = document.getElementById("confirm-playlist-btn");
const cancelPlaylistBtn = document.getElementById("cancel-playlist-btn");

const audio = document.createElement("audio");
let currentPlaylist = null;
let songs = [];
let currentSongIndex = 0;
let playlists = [];
let db;

const DEFAULT_PLAYLISTS = ["Jazz", "Classical"];

// ── IndexedDB ────────────────────────────────────────────────────
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("MusicPlayerDB", 2);

        request.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("songs")) {
                db.createObjectStore("songs", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("playlists")) {
                db.createObjectStore("playlists", { keyPath: "name" });
            }
        };

        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

function saveSongToDB(songObj) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("songs", "readwrite");
        tx.objectStore("songs").put(songObj);
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
    });
}

function getSongsForPlaylist(playlist) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("songs", "readonly");
        const store = tx.objectStore("songs");
        const results = [];
        const request = store.openCursor();
        request.onsuccess = function(e) {
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.playlist === playlist) results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

function deleteSongFromDB(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("songs", "readwrite");
        tx.objectStore("songs").delete(id);
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
    });
}

function savePlaylistToDB(name) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("playlists", "readwrite");
        tx.objectStore("playlists").put({ name });
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
    });
}

function getAllPlaylists() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("playlists", "readonly");
        const store = tx.objectStore("playlists");
        const request = store.getAll();
        request.onsuccess = (e) => resolve(e.target.result.map(p => p.name));
        request.onerror = (e) => reject(e.target.error);
    });
}

function deletePlaylistFromDB(name) {
    return new Promise(async (resolve, reject) => {
        const songsToDelete = await getSongsForPlaylist(name);
        for (const song of songsToDelete) {
            await deleteSongFromDB(song.id);
        }
        const tx = db.transaction("playlists", "readwrite");
        tx.objectStore("playlists").delete(name);
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
    });
}

// ── Render tabs ──────────────────────────────────────────────────
function renderTabs() {
    playlistTabs.innerHTML = "";
    playlists.forEach(name => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("tab-wrapper");

        const btn = document.createElement("button");
        btn.classList.add("tab-button");
        btn.textContent = name;
        if (name === currentPlaylist) btn.classList.add("active");
        btn.addEventListener("click", async function() {
            currentPlaylist = name;
            renderTabs();
            await loadPlaylist(name);
        });

        const del = document.createElement("button");
        del.classList.add("tab-delete");
        del.textContent = "✕";
        del.title = "Delete playlist";

        if (DEFAULT_PLAYLISTS.includes(name)) {
            del.disabled = true;
            del.style.visibility = "hidden";
        }

        del.addEventListener("click", async function(e) {
            e.stopPropagation();
            if (!confirm(`Delete "${name}" and all its songs?`)) return;
            await deletePlaylistFromDB(name);
            playlists = playlists.filter(p => p !== name);
            if (currentPlaylist === name) {
                currentPlaylist = playlists[0] || null;
            }
            renderTabs();
            if (currentPlaylist) {
                await loadPlaylist(currentPlaylist);
            } else {
                songs = [];
                renderSongList();
                songTitle.textContent = "No playlists";
                songArtist.textContent = "—";
                audio.src = "";
            }
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(del);
        playlistTabs.appendChild(wrapper);
    });
}

// ── New playlist form ────────────────────────────────────────────
newPlaylistBtn.addEventListener("click", function() {
    newPlaylistForm.classList.remove("hidden");
    playlistNameInput.focus();
});

cancelPlaylistBtn.addEventListener("click", function() {
    newPlaylistForm.classList.add("hidden");
    playlistNameInput.value = "";
});

confirmPlaylistBtn.addEventListener("click", createPlaylist);

playlistNameInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") createPlaylist();
    if (e.key === "Escape") cancelPlaylistBtn.click();
});

async function createPlaylist() {
    const name = playlistNameInput.value.trim();
    if (!name) return;
    if (playlists.includes(name)) {
        alert("A playlist with that name already exists.");
        return;
    }
    await savePlaylistToDB(name);
    playlists.push(name);
    currentPlaylist = name;
    newPlaylistForm.classList.add("hidden");
    playlistNameInput.value = "";
    renderTabs();
    await loadPlaylist(name);
}

// ── Load playlist ────────────────────────────────────────────────
async function loadPlaylist(playlist) {
    songs = await getSongsForPlaylist(playlist);
    currentSongIndex = 0;
    renderSongList();
    if (songs.length > 0) {
        updateSong();
    } else {
        songTitle.textContent = "No songs yet";
        songArtist.textContent = "—";
        songImage.src = "";
        audio.src = "";
    }
}

// ── Render song list ─────────────────────────────────────────────
function renderSongList() {
    songList.innerHTML = "";
    songs.forEach(function(song, index) {
        const li = document.createElement("li");
        li.classList.add("song-item");
        if (index === currentSongIndex) li.classList.add("active");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = song.title;
        nameSpan.classList.add("song-item-title");

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", async function(e) {
            e.stopPropagation();
            await deleteSongFromDB(song.id);
            await loadPlaylist(currentPlaylist);
        });

        li.appendChild(nameSpan);
        li.appendChild(deleteBtn);
        li.addEventListener("click", function() {
            currentSongIndex = index;
            updateSong();
            audio.play();
            renderSongList();
        });

        songList.appendChild(li);
    });
}

// ── Update player ────────────────────────────────────────────────
function updateSong() {
    if (songs.length === 0) return;
    const currentSong = songs[currentSongIndex];
    songTitle.textContent = currentSong.title;
    songArtist.textContent = currentSong.artist || "Unknown Artist";
    songImage.src = currentSong.cover || "";
    const url = URL.createObjectURL(currentSong.blob);
    audio.src = url;
    audio.onloadedmetadata = function() {
        songSlider.value = 0;
        songSlider.max = audio.duration;
    };
}

// ── File upload ──────────────────────────────────────────────────
fileInput.addEventListener("change", async function() {
    if (!currentPlaylist) return;
    const files = Array.from(this.files);
    for (const file of files) {
        const title = file.name.replace(/\.[^/.]+$/, "");
        const id = `${currentPlaylist}/${file.name}/${Date.now()}`;
        await saveSongToDB({ id, title, artist: "Unknown Artist", playlist: currentPlaylist, blob: file, cover: "" });
    }
    fileInput.value = "";
    await loadPlaylist(currentPlaylist);
});

// ── Playback controls ────────────────────────────────────────────
prevButton.addEventListener("click", function() {
    if (currentSongIndex === 0) return;
    currentSongIndex--;
    updateSong();
    renderSongList();
});

nextButton.addEventListener("click", function() {
    if (currentSongIndex === songs.length - 1) return;
    currentSongIndex++;
    updateSong();
    renderSongList();
});

playButton.addEventListener("click", function() {
    if (!audio.paused) {
        audio.pause();
        playButton.textContent = "Play";
    } else {
        audio.play();
        playButton.textContent = "Pause";
    }
});

audio.addEventListener("ended", function() {
    playButton.textContent = "Play";
    if (currentSongIndex < songs.length - 1) {
        currentSongIndex++;
        updateSong();
        audio.play();
        renderSongList();
    }
});

songSlider.addEventListener("change", function() {
    audio.currentTime = songSlider.value;
});

setInterval(function() {
    if (!isNaN(audio.duration)) songSlider.value = audio.currentTime;
}, 1000);

// ── Init ─────────────────────────────────────────────────────────
openDB().then(async function(database) {
    db = database;
    playlists = await getAllPlaylists();

    const DEFAULT_PLAYLISTS = ["Jazz", "Classical"];
    for (const name of DEFAULT_PLAYLISTS) {
        if (!playlists.includes(name)) {
            await savePlaylistToDB(name);
            playlists.unshift(name);
        }
    }

    currentPlaylist = playlists[0];
    renderTabs();
    await loadPlaylist(currentPlaylist);
});

// Register service worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}