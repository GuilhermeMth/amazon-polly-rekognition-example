require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");


const {
  REGION,
  detectLabels,
  detectFaces,
  recognizeCelebrities,
  synthesizeSpeech,
} = require("./awsServices");


const { gerarDescricaoComIA } = require("./descriptionService");


const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});


async function processarImagem(req, res) {
  console.log("🎯 Função processarImagem chamada!");
  
  
  try {
  
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Imagem muito grande. Máximo 5MB." });
    }

    const imageBytes = req.file.buffer;
    const voiceId = req.body.voice || req.body.voiceId || "Camila";

    console.log("\n📸 Processando imagem...");
    console.log(`📦 Tamanho: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`🎤 Voz: ${voiceId}`);

   
    const labels = await detectLabels(imageBytes);
    const faces = await detectFaces(imageBytes);
    const celebrities = await recognizeCelebrities(imageBytes);

   
    const descricao = await gerarDescricaoComIA(labels, faces, celebrities);

    
    const { audioBuffer, audioBase64, audioDataUrl } = await synthesizeSpeech(descricao, voiceId);

    console.log("✅ Processo concluído com sucesso!\n");

    
    res.json({
      descricao,
      audioBase64,
      audio: audioDataUrl,
      audioBase64,
      audio: audioDataUrl,
      metadata: {
        tamanhoImagem: req.file.size,
        tamanhoAudio: audioBuffer.length,
        voz: voiceId,
        labelsDetectados: labels.length,
        facesDetectadas: faces.length,
      }
    });

  } catch (err) {
    console.error("❌ Erro no processamento:", err);
    res.status(500).json({ 
      error: "Erro ao processar imagem", 
      detalhes: err.message 
    });
  }
}


app.post("/analisar", upload.single("image"), processarImagem);


app.post("/api/process-image", upload.single("image"), processarImagem);


app.get("/api/ia-status", (req, res) => {
  res.json({
    iaAtivada: !!process.env.GROQ_API_KEY,
    modelo: "llama-3.3-70b-versatile",
    provider: "Groq",
    funcoes: "Tradução + Reformulação",
    status: process.env.GROQ_API_KEY ? "🟢 Ativo" : "🔴 Desativado",
    descricao: process.env.GROQ_API_KEY 
      ? "IA ativa - Groq faz tradução e reformulação" 
      : "IA desativada - Configure GROQ_API_KEY",
    otimizacao: "Removido AWS Translate e dicionário"
  });
});


app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    versao: "2.0 - Otimizado com Groq"
  });
});


app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`\n🚀 Servidor VisionVoice v2.0 (OTIMIZADO)`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`\n📊 Configuração:`);
  console.log(`   🌎 AWS Região: ${REGION}`);
  console.log(`   🤖 IA (Groq): ${process.env.GROQ_API_KEY ? '🟢 Ativo' : '🔴 Desativado'}`);
  console.log(`   ⚡ Otimização: Groq faz tradução + reformulação`);
  console.log(`\n✅ Melhorias v2.0:`);
  console.log(`   ❌ Removido: AWS Translate`);
  console.log(`   ❌ Removido: Dicionário de 646 palavras`);
  console.log(`   ✅ Groq faz tudo em uma chamada`);
  console.log(`   ✅ Código mais simples (-40% linhas)`);
  console.log(`   ✅ Resultado melhor`);
  console.log(`\n📍 Rotas:`);
  console.log(`   POST /analisar`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/ia-status\n`);
});

