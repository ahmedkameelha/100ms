let hmsManager, hmsStore, hmsActions;

if (!window.HMSReactiveStore) throw new Error('HMSReactiveStore not loaded');

const {
  selectPeers,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsConnectedToRoom
} = window.HMSReactiveStore;

const videoGrid = document.getElementById('video-grid');
const statusContainer = document.getElementById('status-container');
const statusEl = document.getElementById('status');
const joinBtn = document.getElementById('join-btn');

joinBtn.addEventListener('click', initHMS);

async function initHMS() {
  try {
    joinBtn.style.display = 'none';
    statusEl.innerText = 'Connecting...';

    // Resume AudioContext for autoplay
    if (window.AudioContext && !window.audioContext) {
      window.audioContext = new AudioContext();
      if (window.audioContext.state === 'suspended') await window.audioContext.resume();
    }

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    const userName = params.get('userName') || 'Guest';
    if (!roomId) throw new Error('Room ID missing!');

    hmsManager = new window.HMSReactiveStore();
    hmsManager.triggerOnSubscribe();
    hmsStore = hmsManager.getStore();
    hmsActions = hmsManager.getHMSActions();

    const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode: roomId });
    await hmsActions.join({ userName, authToken });

    hmsStore.subscribe(renderPeers, selectPeers);
    hmsStore.subscribe(updateMicButton, selectIsLocalAudioEnabled);
    hmsStore.subscribe(updateCamButton, selectIsLocalVideoEnabled);
    hmsStore.subscribe(onConnectionUpdate, selectIsConnectedToRoom);

  } catch (err) {
    console.error(err);
    statusEl.innerText = `Error: ${err.message}`;
    joinBtn.style.display = 'block';
  }
}

function onConnectionUpdate(isConnected) {
  statusContainer.style.display = isConnected ? 'none' : 'flex';
}

function renderPeers(peersData) {
  videoGrid.innerHTML = '';
  const peers = peersData ? (Array.isArray(peersData) ? peersData : Object.values(peersData)) : [];
  document.getElementById('participant-count').innerText = peers.length;

  peers.forEach(peer => {
    const tile = document.createElement('div');
    tile.className = 'video-tile';
    if (peer?.isLocal) tile.classList.add('local');

    const videoEl = document.createElement('video');
    videoEl.autoplay = true;
    videoEl.muted = peer?.isLocal;
    videoEl.playsInline = true;

    const avatarEl = document.createElement('div');
    avatarEl.className = 'avatar-placeholder';
    const displayName = peer?.name || '?';
    avatarEl.innerText = displayName.charAt(0).toUpperCase();

    tile.appendChild(videoEl);
    tile.appendChild(avatarEl);

    if (peer?.videoTrack) {
      hmsActions.attachVideo(peer.videoTrack, videoEl)
        .then(() => { avatarEl.style.display = 'none'; videoEl.style.display = 'block'; })
        .catch(() => { avatarEl.style.display = 'flex'; videoEl.style.display = 'none'; });
    } else {
      avatarEl.style.display = 'flex';
      videoEl.style.display = 'none';
    }

    const overlay = document.createElement('div');
    overlay.className = 'tile-overlay';
    const nameSpan = document.createElement('span');
    nameSpan.innerText = peer?.isLocal ? 'You' : displayName;
    overlay.appendChild(nameSpan);

    if (!peer?.isLocal && (!peer?.audioTrack || !peer.audioTrack.enabled)) {
      const muteIcon = document.createElement('div');
      muteIcon.className = 'mute-icon';
      muteIcon.innerHTML = `<i class="fa-solid fa-microphone-slash"></i>`;
      overlay.appendChild(muteIcon);
    }

    tile.appendChild(overlay);
    videoGrid.appendChild(tile);
  });
}

function updateMicButton(isEnabled) {
  const micBtn = document.getElementById('mic-btn');
  micBtn.classList.toggle('toggled-off', !isEnabled);
  micBtn.querySelector('i').className = isEnabled ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash';
}

function updateCamButton(isEnabled) {
  const camBtn = document.getElementById('cam-btn');
  camBtn.classList.toggle('toggled-off', !isEnabled);
  camBtn.querySelector('i').className = isEnabled ? 'fa-solid fa-video' : 'fa-solid fa-video-slash';
}

document.getElementById('mic-btn').addEventListener('click', () => {
  const current = hmsStore.getState(selectIsLocalAudioEnabled);
  hmsActions.setLocalAudioEnabled(!current);
});

document.getElementById('cam-btn').addEventListener('click', async () => {
  const current = hmsStore.getState(selectIsLocalVideoEnabled);
  await hmsActions.setLocalVideoEnabled(!current);
});

document.getElementById('end-call-btn').addEventListener('click', async () => {
  await hmsActions.leave();
  statusContainer.style.display = 'flex';
  statusEl.innerText = 'You have left the room.';
  joinBtn.style.display = 'block';
});
