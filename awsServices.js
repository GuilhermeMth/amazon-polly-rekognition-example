
const {
  RekognitionClient,
  DetectLabelsCommand,
  DetectFacesCommand,
  RecognizeCelebritiesCommand,
} = require("@aws-sdk/client-rekognition");

const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");


const REGION = process.env.AWS_REGION || "us-east-2";

const awsConfig = {
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};


const rekClient = new RekognitionClient(awsConfig);
const pollyClient = new PollyClient(awsConfig);


async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}


async function detectLabels(imageBytes) {
  console.log("🔍 Detectando labels...");
  
  const command = new DetectLabelsCommand({
    Image: { Bytes: imageBytes },
    MaxLabels: 50,
    MinConfidence: 60,
  });
  
  const response = await rekClient.send(command);
  return response.Labels || [];
}


async function detectFaces(imageBytes) {
  console.log("👤 Detectando faces...");
  
  try {
    const command = new DetectFacesCommand({ 
      Image: { Bytes: imageBytes }, 
      Attributes: ["ALL"] 
    });
    
    const response = await rekClient.send(command);
    return response.FaceDetails || [];
    
  } catch (err) {
    console.log("⚠️ Erro ao detectar faces:", err.message);
    return [];
  }
}


async function recognizeCelebrities(imageBytes) {
  console.log("⭐ Detectando celebridades...");
  
  try {
    const command = new RecognizeCelebritiesCommand({ 
      Image: { Bytes: imageBytes } 
    });
    
    const response = await rekClient.send(command);
    
    // Log de debug
    if (response.CelebrityFaces && response.CelebrityFaces.length > 0) {
      response.CelebrityFaces.forEach(c => {
        console.log(`⭐ Celebridade: ${c.Name} (${c.MatchConfidence.toFixed(1)}% confiança)`);
      });
    }
    
    return response.CelebrityFaces || [];
    
  } catch (err) {
    console.log("⚠️ Erro ao detectar celebridades:", err.message);
    return [];
  }
}


async function synthesizeSpeech(texto, voiceId = "Camila") {
  console.log("🔊 Gerando áudio com Polly...");
  
  const command = new SynthesizeSpeechCommand({ 
    Text: texto, 
    OutputFormat: "mp3", 
    VoiceId: voiceId, 
    LanguageCode: "pt-BR",
    Engine: "neural" 
  });
  
  const response = await pollyClient.send(command);
  const audioBuffer = await streamToBuffer(response.AudioStream);
  const audioBase64 = audioBuffer.toString("base64");
  
  return {
    audioBuffer,
    audioBase64,
    audioDataUrl: `data:audio/mpeg;base64,${audioBase64}`,
  };
}



module.exports = {
 
  rekClient,
  pollyClient,
  
  REGION,
  
  streamToBuffer,
  
  detectLabels,
  detectFaces,
  recognizeCelebrities,
  
   synthesizeSpeech,
};
