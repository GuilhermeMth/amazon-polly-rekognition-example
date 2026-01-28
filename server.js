// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { RekognitionClient, DetectLabelsCommand, DetectFacesCommand } = require('@aws-sdk/client-rekognition');
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const cors = require('cors');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Verificar se as credenciais foram carregadas
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ ERRO: Credenciais AWS não encontradas no arquivo .env');
    process.exit(1);
}

console.log('🔑 Credenciais carregadas:');
console.log('   Access Key ID:', process.env.AWS_ACCESS_KEY_ID.substring(0, 10) + '...');
console.log('   Region:', process.env.AWS_REGION || 'us-east-1');

// Configurar AWS
const awsConfig = {
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
    },
    region: (process.env.AWS_REGION || 'us-east-1').trim()
};

const rekognitionClient = new RekognitionClient(awsConfig);
const pollyClient = new PollyClient(awsConfig);

// Função para traduzir texto do inglês para português
async function translateText(text) {
    try {
        const result = await translate(text, { from: 'en', to: 'pt' });
        return result.text;
    } catch (error) {
        console.log('Erro na tradução, usando texto original:', error.message);
        return text;
    }
}

// Função para analisar a imagem
async function analyzeImage(imageBytes) {
    // 1. Detectar labels
    const detectLabelsCommand = new DetectLabelsCommand({
        Image: { Bytes: imageBytes },
        MaxLabels: 10,
        MinConfidence: 70
    });
    const labelsData = await rekognitionClient.send(detectLabelsCommand);

    // 2. Detectar rostos
    let facesData;
    try {
        const detectFacesCommand = new DetectFacesCommand({
            Image: { Bytes: imageBytes },
            Attributes: ['ALL']
        });
        facesData = await rekognitionClient.send(detectFacesCommand);
    } catch (err) {
        facesData = { FaceDetails: [] };
    }

    // 3. Montar descrição em inglês (simples)
    let description = [];

    // Pessoas
    if (facesData.FaceDetails.length > 0) {
        const face = facesData.FaceDetails[0];
        const gender = face.Gender?.Value === 'Male' ? 'a man' : 'a woman';
        const ageRange = face.AgeRange ? `around ${face.AgeRange.Low} to ${face.AgeRange.High} years old` : '';
        const emotion = face.Emotions?.sort((a, b) => b.Confidence - a.Confidence)[0]?.Type.toLowerCase();
        
        description.push(`The image shows ${gender} ${ageRange} ${emotion ? 'looking ' + emotion : ''}`);
    }

    // Objetos principais (top 3)
    const mainLabels = labelsData.Labels.slice(0, 3).map(l => l.Name).join(', ');
    if (mainLabels) {
        description.push(`The scene contains ${mainLabels}`);
    }

    const englishDescription = description.join('. ') + '.';
    
    // 4. Traduzir para português
    const portugueseDescription = await translateText(englishDescription);
    
    return portugueseDescription;
}

// Endpoint para processar imagem
app.post('/api/process-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhuma imagem enviada' });
        }

        const voiceId = req.body.voiceId || 'Camila';
        const imageBytes = req.file.buffer;

        console.log('📸 Analisando imagem...');
        const description = await analyzeImage(imageBytes);
        console.log('📝 Descrição:', description);

        console.log('🔊 Gerando áudio...');
        const synthesizeSpeechCommand = new SynthesizeSpeechCommand({
            Text: description,
            OutputFormat: 'mp3',
            VoiceId: voiceId,
            LanguageCode: 'pt-BR'
        });
        const pollyData = await pollyClient.send(synthesizeSpeechCommand);

        // Convert stream to buffer for v3
        const audioChunks = [];
        for await (const chunk of pollyData.AudioStream) {
            audioChunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(audioChunks);
        const audioBase64 = audioBuffer.toString('base64');

        res.json({
            success: true,
            description: description,
            audio: `data:audio/mpeg;base64,${audioBase64}`
        });

        console.log('✅ Concluído!');

    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Servir o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});