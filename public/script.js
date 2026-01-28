// Frontend JavaScript - Simples e limpo
let uploadedFile = null;

// Elementos do DOM
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const resultText = document.getElementById('resultText');
const playButton = document.getElementById('playButton');
const audioPlayer = document.getElementById('audioPlayer');
const audioStatus = document.getElementById('audioStatus');

// Upload handlers
uploadZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    }
});

function handleFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        showError('Imagem muito grande! Máximo: 5MB');
        return;
    }
    
    uploadedFile = file;
    uploadZone.querySelector('.upload-text').textContent = file.name;
    uploadZone.querySelector('.upload-icon').textContent = '✓';
    processBtn.disabled = false;
    hideError();
}

// Processar imagem
processBtn.addEventListener('click', async () => {
    if (!uploadedFile) return;
    
    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('voiceId', document.getElementById('voice').value);
    
    showLoading();
    hideError();
    previewSection.classList.remove('active');
    
    try {
        const response = await fetch('/api/process-image', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        // Exibir resultados
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            resultText.textContent = data.description;
            audioPlayer.src = data.audio;
            previewSection.classList.add('active');
            playButton.textContent = '▶';
            audioStatus.textContent = 'Pronto para reproduzir';
            
            hideLoading();
            
            setTimeout(() => {
                previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        };
        reader.readAsDataURL(uploadedFile);
        
    } catch (err) {
        hideLoading();
        showError(`Erro: ${err.message}`);
    }
});

// Player de áudio
playButton.addEventListener('click', () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playButton.textContent = '⏸';
        audioStatus.textContent = 'Reproduzindo...';
    } else {
        audioPlayer.pause();
        playButton.textContent = '▶';
        audioStatus.textContent = 'Pausado';
    }
});

audioPlayer.addEventListener('ended', () => {
    playButton.textContent = '▶';
    audioStatus.textContent = 'Finalizado';
});

// Utilitários
function showLoading() {
    loading.classList.add('active');
    processBtn.disabled = true;
}

function hideLoading() {
    loading.classList.remove('active');
    processBtn.disabled = false;
}

function showError(message) {
    error.textContent = message;
    error.classList.add('active');
}

function hideError() {
    error.classList.remove('active');
}