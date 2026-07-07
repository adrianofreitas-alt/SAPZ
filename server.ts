import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory store for collaborative sharing
// Maps shareCode -> planData
interface SharedPlan {
  id: string;
  title: string;
  course: string;
  subject: string;
  workload: number;
  competencies: string[];
  skills: string[];
  bases: string[];
  chronogram: any[];
  students: any[];
  updatedAt: string;
}
const sharedPlans = new Map<string, SharedPlan>();

// Lazy init of Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint: Generate Technical Syllabus and Competencies Plan
app.post("/api/generate-plan", async (req, res) => {
  try {
    const { course, subject, workload, focus, calendarInfo } = req.body;
    
    if (!course || !subject) {
      res.status(400).json({ error: "Curso e Unidade Curricular são obrigatórios." });
      return;
    }

    const prompt = `Você é um especialista em educação profissional e técnica (Ensino Técnico no Brasil, como SENAI, Paula Souza, Institutos Federais).
Elabore um plano de ensino personalizado por COMPETÊNCIAS para o seguinte curso e disciplina:
- Curso Técnico: ${course}
- Unidade Curricular / Disciplina: ${subject}
- Carga Horária total: ${workload || 80} horas
- Foco específico ou observações adicionais: ${focus || "Geral do catálogo nacional de cursos técnicos"}
- Informações do calendário (opcional): ${calendarInfo || "Calendário padrão técnico"}

Retorne a resposta estritamente no formato JSON estruturado abaixo. Não inclua Markdown ou explicações fora do JSON.
JSON Schema esperado:
{
  "objetivoGeral": "texto curto descrevendo o objetivo geral da disciplina",
  "competencias": [
    "Competência 1 com foco técnico-profissional",
    "Competência 2..."
  ],
  "habilidades": [
    "Habilidade técnica 1 correspondente",
    "Habilidade técnica 2..."
  ],
  "basesTecnologicas": [
    "Base tecnológica / Conteúdo programático essencial 1",
    "Base tecnológica 2..."
  ],
  "cronograma": [
    {
      "aula": 1,
      "competenciaRelacionada": "Competência 1",
      "conteudo": "Introdução ao tema x e ambientação",
      "metodologia": "Aula expositiva dialogada e desafios práticos",
      "duracaoHoras": 4
    }
  ],
  "criteriosAvaliacao": [
    "Critério 1 (ex: Demonstra autonomia na resolução de problemas...)",
    "Critério 2..."
  ]
}

Gere um cronograma que faça sentido para cobrir aproximadamente ${workload || 80} horas de curso (dividindo em aulas de 3 a 4 horas cada, totalizando entre 15 e 25 aulas). Garanta que os conteúdos sejam específicos e práticos do ensino técnico brasileiro.`;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta vazia da IA.");
    }

    const planData = JSON.parse(text);
    res.json(planData);
  } catch (error: any) {
    console.error("Erro ao gerar plano:", error);
    res.status(500).json({ error: error.message || "Erro interno ao gerar o plano com IA." });
  }
});

// Endpoint: Extract Student Names from Text/Document
app.post("/api/extract-students", async (req, res) => {
  try {
    const { rawText, fileName } = req.body;
    if (!rawText) {
      res.status(400).json({ error: "Texto do documento não fornecido." });
      return;
    }

    const prompt = `Você é uma IA assistente de secretaria escolar.
Abaixo está o conteúdo extraído de um documento/lista de alunos (pode ser lista de chamadas, arquivo de matrícula, PDF de diário de classe, etc.) com o nome do arquivo "${fileName || "documento.txt"}".
Sua tarefa é extrair estritamente a lista de Nomes Completos de Alunos encontrados neste texto, limpando números de matrícula, cabeçalhos, rodapés, CPFs ou outras informações.
Ordene os alunos em ordem alfabética.

Texto do documento:
"""
${rawText}
"""

Retorne a resposta estritamente no formato JSON estruturado abaixo. Não inclua Markdown ou textos fora do JSON.
JSON Schema esperado:
{
  "students": [
    {
      "name": "Nome Completo do Aluno 1"
    },
    {
      "name": "Nome Completo do Aluno 2"
    }
  ]
}`;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta vazia da IA.");
    }

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Erro ao extrair alunos:", error);
    res.status(500).json({ error: error.message || "Erro interno ao extrair alunos com IA." });
  }
});

// Endpoint: Share / Sync a Plan (Collaborative)
app.post("/api/share-plan", (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !plan.id) {
      res.status(400).json({ error: "Plano inválido para compartilhamento." });
      return;
    }

    // Save to our in-memory shared store using the plan's ID or a unique share code
    const shareCode = plan.id;
    sharedPlans.set(shareCode, {
      ...plan,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, shareCode, message: "Sincronizado com sucesso na nuvem." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao salvar compartilhamento." });
  }
});

// Endpoint: Retrieve Shared Plan
app.get("/api/share-plan/:code", (req, res) => {
  try {
    const { code } = req.params;
    const plan = sharedPlans.get(code);
    if (!plan) {
      res.status(404).json({ error: "Plano compartilhado não encontrado ou expirado." });
      return;
    }
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao buscar plano compartilhado." });
  }
});

// Vite Middleware for Dev and Static Assets for Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
