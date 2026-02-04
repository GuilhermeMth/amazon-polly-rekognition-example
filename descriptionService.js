const Groq = require('groq-sdk');


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});


function prepararDadosFaces(faces) {
  if (!faces || faces.length === 0) return null;
  
  return faces.map((face, index) => {
    const genero = face.Gender?.Value === "Female" ? "Mulher" : "Homem";
    const idade = face.AgeRange 
      ? `${face.AgeRange.Low}-${face.AgeRange.High} anos`
      : "idade desconhecida";
    
    const emocao = face.Emotions?.length
      ? face.Emotions.reduce((a, b) => (b.Confidence > a.Confidence ? b : a)).Type
      : null;
    
    const caracteristicas = [];
    if (face.Smile?.Value && face.Smile.Confidence >= 80) caracteristicas.push("sorrindo");
    if (face.Eyeglasses?.Value && face.Eyeglasses.Confidence >= 80) caracteristicas.push("usando óculos");
    if (face.Beard?.Value && face.Beard.Confidence >= 80) caracteristicas.push("com barba");
    
    return {
      index: index + 1,
      genero,
      idade,
      emocao,
      caracteristicas
    };
  });
}


function prepararDadosLabels(labels) {
  if (!labels || labels.length === 0) return [];
  
  return labels
    .filter(l => l.Confidence >= 70)
    .sort((a, b) => b.Confidence - a.Confidence)
    .slice(0, 20) 
    .map(l => ({
      nome: l.Name,
      confianca: l.Confidence.toFixed(0)
    }));
}


function prepararDadosCelebridades(celebrities) {
  if (!celebrities || celebrities.length === 0) return null;
  
  return celebrities
    .filter(c => c.MatchConfidence >= 95)
    .map(c => ({
      nome: c.Name,
      confianca: c.MatchConfidence.toFixed(0)
    }));
}


async function gerarDescricaoComIA(labels, faces, celebrities) {
  if (!process.env.GROQ_API_KEY) {
    console.log("⚠️ GROQ_API_KEY não configurada");
    return "Não foi possível gerar descrição. Configure GROQ_API_KEY.";
  }

  try {
    console.log("🤖 Gerando descrição com IA (Groq)...");
    
   
    const dadosFaces = prepararDadosFaces(faces);
    const dadosLabels = prepararDadosLabels(labels);
    const dadosCelebridades = prepararDadosCelebridades(celebrities);
    
    
    let tipoImagem = "objetos/cena";
    if (dadosFaces && dadosFaces.length > 0) {
      tipoImagem = "pessoas";
    } else if (dadosLabels.some(l => 
      ["Dog", "Cat", "Bird", "Horse", "Animal", "Pet"].includes(l.nome)
    )) {
      tipoImagem = "animal";
    }
    
    
    const prompt = `Você é um assistente de acessibilidade que descreve imagens para pessoas com deficiência visual.

**DADOS DETECTADOS NA IMAGEM:**

${dadosFaces ? `PESSOAS DETECTADAS (${dadosFaces.length}):
${dadosFaces.map(f => `- Pessoa ${f.index}: ${f.genero}, ${f.idade}, emoção: ${f.emocao || 'neutra'}${f.caracteristicas.length > 0 ? `, ${f.caracteristicas.join(', ')}` : ''}`).join('\n')}
` : ''}
${dadosCelebridades ? `CELEBRIDADES (confiança ≥95%):
${dadosCelebridades.map(c => `- ${c.nome} (${c.confianca}% confiança)`).join('\n')}
` : ''}
OBJETOS/CENAS DETECTADOS (top 20):
${dadosLabels.map(l => `- ${l.nome} (${l.confianca}%)`).join('\n')}

**TIPO DE IMAGEM:** ${tipoImagem}

**TAREFA:**
Crie UMA descrição em português brasileiro (1-3 frases) seguindo estas regras:

1. **Foco no principal:**
   - Se tem PESSOAS: descreva as pessoas primeiro, depois o contexto
   - Se tem ANIMAL: descreva o animal primeiro, depois o ambiente
   - Se só tem OBJETOS: descreva a cena principal

2. **Seja natural e conciso:**
   - Elimine redundâncias (ex: se tem "Dog" e "Golden Retriever", use só "golden retriever")
   - Una informações relacionadas (ex: "mulher de 25-35 anos, sorrindo" ao invés de "mulher. ela tem 25-35 anos. ela está sorrindo")
   - Use linguagem acessível (evite termos técnicos como "Photography", "Portrait")

3. **Priorize informações úteis:**
   - Idade e gênero de pessoas
   - Emoções visíveis (só se confiança alta)
   - Raça de animais (se detectada)
   - Contexto relevante (indoor/outdoor, objetos importantes)

4. **Ignore labels genéricos quando há específicos:**
   - Ignore: Person, Human, Face, Photography, Portrait, Adult, Female, Male
   - Use só se não houver info específica de faces

5. **Formato da resposta:**
   - 1-3 frases no máximo
   - Português brasileiro natural
   - Sem jargão técnico
   - Sem explicações extras

**EXEMPLOS:**

Entrada: Dog (95%), Golden Retriever (92%), Outdoor (88%), Grass (85%)
Saída: Um golden retriever ao ar livre em um gramado.

Entrada: Pessoa: Mulher, 30-40 anos, feliz, sorrindo | Labels: Phone (90%), Electronics (85%)
Saída: Uma mulher de 30 a 40 anos, sorrindo, segurando um celular.

Entrada: Cat (94%), Kitten (88%), Indoor (92%), Furniture (85%), Couch (82%)
Saída: Um gatinho filhote dentro de casa, em um sofá.

**IMPORTANTE:** Retorne APENAS a descrição final, sem explicações.

DESCRIÇÃO:`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 250,
      top_p: 0.9,
    });

    const descricao = completion.choices[0]?.message?.content?.trim() || "A imagem mostra uma cena.";
    
    console.log("✅ Descrição gerada:", descricao);
    console.log(`⚡ Tokens usados: ${completion.usage?.total_tokens || 'N/A'}`);
    
    return descricao;

  } catch (err) {
    console.error("❌ Erro ao gerar descrição com IA:", err.message);
    
   
    if (faces && faces.length > 0) {
      return `A imagem mostra ${faces.length} pessoa(s).`;
    } else if (labels && labels.length > 0) {
      return "A imagem mostra uma cena com objetos diversos.";
    }
    
    return "A imagem mostra uma cena.";
  }
}


module.exports = {
  gerarDescricaoComIA,
  prepararDadosFaces,
  prepararDadosLabels,
  prepararDadosCelebridades,
};
