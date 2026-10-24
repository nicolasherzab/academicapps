import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google Gemini SDK with official User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Gemini Profiling & 5-Pillar Strategy Endpoint
app.post('/api/gemini/profile-and-strategy', async (req, res) => {
  try {
    const { sector, algorithm, distanceMetric, featuresUsed, clusters, totalRows } = req.body;

    if (!clusters || !Array.isArray(clusters) || clusters.length === 0) {
      return res.status(400).json({ error: 'No se recibieron datos de clusters válidos' });
    }

    const systemInstruction = `Eres un Chief Data & Strategy Officer y Consultor de Negocios Senior de clase mundial.
Tu especialidad es la traducción de modelos matemáticos no supervisados (Clustering, K-Means, K-Medoids) en estrategias comerciales y operativas hiper-personalizadas y de alto impacto.
Analizas los centroides de cada cluster, su tamaño y sus desviaciones relativas respecto al promedio global de los datos, interpretándolos en el contexto del Sector Económico seleccionado.

Tus directrices:
1. Para cada cluster, define un Nombre Comercial / Perfil de Negocio original, memorable y estrictamente adaptado al sector económico (ej. si es Retail: "Compradores Premium Omnicanal", "Cazadores Tácticos de Liquidación"; si es SaaS: "Power Users en Escala", "Cuentas en Riesgo de Desconexión").
2. Genera un Perfil / Arquetipo descriptivo (Persona) que resuma las motivaciones, hábitos y comportamiento inferido de ese grupo a partir de sus números.
3. Propón una estrategia exhaustiva y accionable dividida obligatoriamente en 5 Pilares de Negocio:
   - Producto: Qué oferta, bundles, características, empaque o catálogo se adapta a su perfil.
   - Precio: Estrategia de pricing (descuentos, tarifa plana, valor agregado, crédito, precio dinámico).
   - Innovación: Nuevas tecnologías, automatización, digitalización, experiencias o autoservicio.
   - Comunicación: Tono de voz, mensajes clave, canales de contacto y momentos de interacción óptimos.
   - Rentabilidad: Cómo maximizar su Customer Lifetime Value (LTV), reducir churn/abandono y optimizar el margen o CAC.
4. Identifica el KPI Principal de seguimiento y el Nivel de Prioridad Estratégica (Alta, Media, Crítica).
5. Mantén un tono profesional, ejecutivo, convincente y con rigor cuantitativo-estratégico.`;

    const userPrompt = `Analiza los siguientes resultados de segmentación no supervisada y genera los perfiles y estrategias por cluster:

SECTOR ECONÓMICO: ${sector || 'Comercio y Servicios'}
ALGORITMO UTILIZADO: ${algorithm || 'K-Means'} (${distanceMetric || 'Distancia Euclidiana'})
TOTAL DE REGISTROS: ${totalRows || 'N/A'}
VARIABLES ANALIZADAS: ${Array.isArray(featuresUsed) ? featuresUsed.join(', ') : 'Variables del dataset'}

DATOS DE LOS CENTROIDES POR CLUSTER:
${JSON.stringify(clusters, null, 2)}

Genera una respuesta en formato JSON estructurado con el nombre comercial, arquetipo y la estrategia de los 5 pilares para cada cluster.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: 'Resumen ejecutivo global de la segmentación y hallazgos clave para el comité directivo.',
            },
            clusterStrategies: {
              type: Type.ARRAY,
              description: 'Lista de estrategias individuales para cada cluster.',
              items: {
                type: Type.OBJECT,
                properties: {
                  clusterId: { type: Type.INTEGER },
                  commercialName: {
                    type: Type.STRING,
                    description: 'Nombre comercial creativo y adaptado al sector económico.',
                  },
                  archetypeDescription: {
                    type: Type.STRING,
                    description: 'Descripción del perfil / Buyer Persona y comportamiento del segmento.',
                  },
                  priority: {
                    type: Type.STRING,
                    description: 'Prioridad de intervención: Alta, Media, Crítica o Mantener.',
                  },
                  primaryKpi: {
                    type: Type.STRING,
                    description: 'Métrica principal o KPI clave a monitorear.',
                  },
                  pillars: {
                    type: Type.OBJECT,
                    description: 'Los 5 pilares estratégicos de negocio.',
                    properties: {
                      producto: {
                        type: Type.STRING,
                        description: 'Estrategia de Producto y portafolio recomendada.',
                      },
                      precio: {
                        type: Type.STRING,
                        description: 'Estrategia de Pricing, empaquetamiento y descuentos.',
                      },
                      innovacion: {
                        type: Type.STRING,
                        description: 'Estrategia de Innovación tecnológica, canales o servicios.',
                      },
                      comunicacion: {
                        type: Type.STRING,
                        description: 'Estrategia de Comunicación, canales preferentes y tono.',
                      },
                      rentabilidad: {
                        type: Type.STRING,
                        description: 'Estrategia de Rentabilidad, LTV, retención y mitigación de costes.',
                      },
                    },
                    required: ['producto', 'precio', 'innovacion', 'comunicacion', 'rentabilidad'],
                  },
                  quickWin: {
                    type: Type.STRING,
                    description: 'Acción rápida de impacto inmediato (Quick Win) a ejecutar en los primeros 30 días.',
                  },
                },
                required: [
                  'clusterId',
                  'commercialName',
                  'archetypeDescription',
                  'priority',
                  'primaryKpi',
                  'pillars',
                  'quickWin',
                ],
              },
            },
          },
          required: ['executiveSummary', 'clusterStrategies'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating strategy with Gemini:', error);
    return res.status(500).json({
      error: 'Error procesando la estrategia con Gemini AI',
      details: error.message || String(error),
    });
  }
});

// Production or Vite development middleware setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`ClustIQ analytical server listening on port ${port}`);
  });
}

startServer();
