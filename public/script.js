let uploadedFile = null;

// Elementos
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

// Upload
uploadZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

uploadZone.addEventListener('dragover', e => { 
    e.preventDefault(); 
    uploadZone.classList.add('dragover'); 
});

uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));

uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if(file && file.type.startsWith('image/')) handleFile(file);
});

function handleFile(file) {
    if(file.size > 5*1024*1024) return showError('Imagem muito grande! Máx: 5MB');
    
    uploadedFile = file;
    uploadZone.querySelector('.upload-text').textContent = file.name;
    uploadZone.querySelector('.upload-icon').textContent = '✓';
    processBtn.disabled = false;
    hideError();
}

// Processar imagem
processBtn.addEventListener('click', async () => {
    if(!uploadedFile) return;
    
    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('voice', document.getElementById('voice').value);
    
    showLoading();
    hideError();
    previewSection.classList.remove('active');
    
    try {
        const res = await fetch('/analisar', { 
            method: 'POST', 
            body: formData 
        });
        
        const data = await res.json();
        
        if(!res.ok) throw new Error(data.error || 'Erro no servidor');
        if(!data.descricao || !data.audioBase64) throw new Error('Resposta inválida do servidor');
        
        // Preview
        imagePreview.src = URL.createObjectURL(uploadedFile);
        resultText.textContent = data.descricao;
        audioPlayer.src = `data:audio/mp3;base64,${data.audioBase64}`;
        
        previewSection.classList.add('active');
        playButton.textContent = '▶';
        audioStatus.textContent = 'Pronto para reproduzir';
        
        hideLoading();
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch(err) {
        hideLoading();
        showError(`Erro: ${err.message}`); // FIX: adicionado parêntese faltando
    }
});

// Player
playButton.addEventListener('click', () => {
    if(audioPlayer.paused){
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

// Utils
function showLoading(){ 
    loading.classList.add('active'); 
    processBtn.disabled = true; 
}

function hideLoading(){ 
    loading.classList.remove('active'); 
    processBtn.disabled = false; 
}

function showError(msg){ 
    error.textContent = msg; 
    error.classList.add('active'); 
}

function hideError(){ 
    error.classList.remove('active'); 
}