# 🎙️ VisionVoice v2

VisionVoice v2 é uma aplicação de **acessibilidade** que transforma imagens em **narrativas de áudio naturais** usando serviços de IA da AWS. O sistema analisa imagens com **Amazon Rekognition**, traduz labels com **Amazon Translate**, melhora as descrições com **IA (Groq)**, e sintetiza voz humana com **Amazon Polly**.

---

## 📌 Visão Geral

O VisionVoice permite que usuários enviem uma imagem e recebam:

✅ **Descrição detalhada** do conteúdo visual  
✅ **Análise de pessoas** (idade, gênero, emoção, acessórios como óculos/barba)  
✅ **Detecção de animais** (tipo, raça quando aplicável)  
✅ **Reconhecimento de celebridades** (quando confiança ≥ 95%)  
✅ **Áudio narrado** com voz natural em português brasileiro  

Tudo isso em um **frontend moderno** com suporte a múltiplas vozes da AWS Polly.

---

## 🎯 Objetivo

Fornecer **acessibilidade digital** para pessoas com deficiência visual, permitindo que elas "vejam" imagens através de descrições faladas naturalmente.

---

## ⚙️ Funcionalidades

### 🖼️ Análise de Imagens
- Upload de imagens (JPG, PNG, GIF, até 5MB)
- Detecção de objetos, cenas e atividades
- Reconhecimento de texto em imagens (OCR)

### 🧑 Reconhecimento Facial
- Detecção de pessoas na imagem
- Análise de atributos (idade, gênero, emoção)
- Identificação de acessórios (óculos, barba)
- Detecção de expressões (sorriso, olhos abertos/fechados)

### 🐶 Detecção de Animais
- Identificação do tipo de animal
- Reconhecimento de raças específicas (cães, gatos)
- Detecção de filhotes vs adultos

### 🌟 Reconhecimento de Celebridades
- Identificação de personalidades públicas
- Apenas quando confiança ≥ 95% (evita falsos positivos)

### 🌐 Tradução Inteligente
- Tradução de labels do inglês para português
- Dicionário local com 600+ termos (cobertura de 95%)
- Fallback para Amazon Translate quando necessário

### 🤖 Melhoria de Descrições com IA
- Integração com **Groq API (Llama 3.3)**
- Elimina redundâncias ("celular" ao invés de "eletrônico, telefone, celular")
- Organiza informações de forma natural
- Reduz tamanho das descrições em ~60%

### 🔊 Síntese de Voz
- Geração de áudio com AWS Polly
- 3 vozes disponíveis (Camila, Vitoria, Ricardo)
- Voz neural para maior naturalidade
- Áudio em formato MP3

### 💻 Interface Moderna
- Design responsivo (desktop e mobile)
- Preview de imagem em tempo real
- Player de áudio integrado
- Feedback visual durante processamento
- Animações suaves

---

## 🧰 Tecnologias Utilizadas

### Backend
- **Node.js** (v18+) - Runtime JavaScript
- **Express** - Framework web
- **Multer** - Upload de arquivos
- **AWS SDK v3:**
  - `@aws-sdk/client-rekognition` - Análise de imagens
  - `@aws-sdk/client-polly` - Síntese de voz
  - `@aws-sdk/client-translate` - Tradução
- **Groq SDK** - IA para melhorar descrições
- **dotenv** - Gerenciamento de variáveis de ambiente

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização moderna
  - Gradientes personalizados
  - Animações e transições
  - Design responsivo
- **JavaScript (ES6+)** - Lógica do cliente
  - Fetch API
  - Async/Await
  - FileReader API
  - Audio API

### DevOps
- **Git** - Controle de versão
- **GitHub** - Repositório remoto
- **npm** - Gerenciamento de pacotes

---

## 🏗️ Arquitetura do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Upload   │  │  Preview   │  │   Player   │             │
│  │   Imagem   │  │   Visual   │  │   Áudio    │             │
│  └─────┬──────┘  └────────────┘  └─────▲──────┘             │
│        │                                 │                    │
└────────┼─────────────────────────────────┼────────────────────┘
         │                                 │
         │ HTTP POST                       │ Audio MP3
         ▼                                 │
┌──────────────────────────────────────────┼────────────────────┐
│                    BACKEND (Express)     │                    │
│                                          │                    │
│  ┌───────────────────────────────────────┴─────────┐         │
│  │            Processamento de Imagem              │         │
│  └───┬──────────┬──────────┬──────────┬────────────┘         │
│      │          │          │          │                      │
│      ▼          ▼          ▼          ▼                      │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌──────────┐                │
│  │ Rekog │ │Transl.│ │ Groq  │ │  Polly   │                │
│  │nition │ │       │ │  AI   │ │          │                │
│  └───┬───┘ └───┬───┘ └───┬───┘ └────┬─────┘                │
└──────┼─────────┼─────────┼──────────┼────────────────────────┘
       │         │         │          │
       ▼         ▼         ▼          ▼
   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
   │  AWS  │ │  AWS  │ │ Groq  │ │  AWS  │
   │  API  │ │  API  │ │  API  │ │  API  │
   └───────┘ └───────┘ └───────┘ └───────┘
```

### Fluxo de Processamento

1. **Upload:** Usuário envia imagem (máx 5MB)
2. **Validação:** Backend valida formato e tamanho
3. **Rekognition:** Detecta objetos, pessoas, emoções, celebridades
4. **Tradução:** Labels são traduzidos (dicionário local + Translate)
5. **IA (Groq):** Descrição é melhorada e humanizada
6. **Polly:** Texto é convertido em áudio MP3
7. **Resposta:** Frontend recebe descrição + áudio em base64
8. **Apresentação:** Exibe texto e reproduz áudio

---

## 🚀 Guia de Instalação e Execução

### ✔️ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** v18 ou superior ([Download](https://nodejs.org/))
- **npm** (vem com Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Conta AWS** com credenciais configuradas
- **Conta Groq** (grátis) para a IA ([Console](https://console.groq.com))

---

### 📥 1. Clonar o Repositório

```bash
git clone https://github.com/Vini1227/VisionVoicev2.git
cd VisionVoicev2
```

---

### 📦 2. Instalar Dependências

```bash
npm install
```

**Pacotes instalados:**
- express
- multer
- cors
- dotenv
- @aws-sdk/client-rekognition
- @aws-sdk/client-polly
- @aws-sdk/client-translate
- groq-sdk

---

### 🔑 3. Configurar Variáveis de Ambiente

#### 3.1. Criar arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env`:

```bash
touch .env
```

#### 3.2. Adicionar credenciais

Abra o `.env` e adicione suas chaves:

```bash
# ========== AWS CREDENTIALS ==========
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui

# ========== GROQ API (IA) ==========
GROQ_API_KEY=gsk_sua_chave_groq_aqui

# ========== SERVIDOR ==========
PORT=3000
```

#### 3.3. Obter as credenciais

**AWS:**
1. Acesse o [Console AWS](https://console.aws.amazon.com/)
2. Vá em **IAM** → **Usuários** → **Criar usuário**
3. Anexe as políticas:
   - `AmazonRekognitionFullAccess`
   - `AmazonPollyFullAccess`
   - `TranslateFullAccess`
4. Crie as chaves de acesso
5. Copie `Access Key ID` e `Secret Access Key`

**Groq (100% gratuito):**
1. Acesse [console.groq.com](https://console.groq.com)
2. Crie uma conta (pode usar Google)
3. Vá em **API Keys**
4. Clique em **Create API Key**
5. Copie a chave (começa com `gsk_`)

⚠️ **IMPORTANTE:** Nunca commit o arquivo `.env` no Git! Ele já está no `.gitignore`.

---

### ▶️ 4. Executar o Servidor

```bash
node server.js
```

**Saída esperada:**

```
🚀 Servidor rodando em http://localhost:3000
🌎 Região AWS: us-east-1
📚 Dicionário: 646 palavras
🌐 Backup: Amazon Translate (quando disponível)
💾 Cache ativo
✅ Cobertura: ~95% das labels do Rekognition
🤖 IA (Groq): 🟢 Ativo

📍 Rotas disponíveis:
   POST /analisar - Processar imagem
   POST /api/process-image - Processar imagem (alternativa)
   GET  /api/health - Status do servidor
   GET  /api/cache-status - Status do cache
   GET  /api/ia-status - Status da IA
```

---

### 🌐 5. Acessar a Aplicação

Abra seu navegador e acesse:

```
http://localhost:3000
```

---

## 🧪 Como Usar

### Passo a Passo

1. **Abra a aplicação** no navegador
2. **Clique ou arraste** uma imagem para a área de upload
3. **Selecione a voz** desejada (Camila, Vitoria ou Ricardo)
4. **Clique em "Analisar Imagem"**
5. **Aguarde** o processamento (geralmente 2-4 segundos)
6. **Veja a descrição** gerada automaticamente
7. **Reproduza o áudio** clicando no botão play
