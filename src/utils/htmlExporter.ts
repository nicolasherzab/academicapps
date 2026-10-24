import { CleaningReport, ClusteringResult } from './mlClustering';

export interface StrategyResponse {
  executiveSummary: string;
  clusterStrategies: Array<{
    clusterId: number;
    commercialName: string;
    archetypeDescription: string;
    priority: string;
    primaryKpi: string;
    pillars: {
      producto: string;
      precio: string;
      innovacion: string;
      comunicacion: string;
      rentabilidad: string;
    };
    quickWin: string;
  }>;
}

export function generateStandaloneHTMLReport(params: {
  sector: string;
  cleaningReport: CleaningReport;
  imputationStrategy: string;
  clusteringResult: ClusteringResult;
  strategyResponse?: StrategyResponse | null;
  businessRationale?: string;
  selectionMethod: 'elbow' | 'silhouette' | 'business';
}): string {
  const { sector, cleaningReport, imputationStrategy, clusteringResult, strategyResponse, businessRationale, selectionMethod } = params;
  const executionDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clusterCardsHTML = clusteringResult.centroids.map((centroid) => {
    const aiStrat = strategyResponse?.clusterStrategies.find((s) => s.clusterId === centroid.clusterId);
    const commercialName = aiStrat?.commercialName || `Segmento Estratégico #${centroid.clusterId}`;
    const archetype = aiStrat?.archetypeDescription || 'Perfil analítico derivado de los centroides matemáticos del cluster.';
    const priority = aiStrat?.priority || 'Media';
    const primaryKpi = aiStrat?.primaryKpi || 'LTV & Retención';
    const quickWin = aiStrat?.quickWin || 'Prueba A/B en canales prioritarios.';

    const priorityBadgeColor =
      priority.toLowerCase().includes('crítica') || priority.toLowerCase().includes('alta')
        ? 'background: #fee2e2; color: #991b1b; border: 1px solid #f87171;'
        : 'background: #ecfdf5; color: #065f46; border: 1px solid #34d399;';

    // Centroid features list
    const featuresRows = Object.entries(centroid.unscaledCentroid).map(([feat, val]) => {
      const dev = centroid.deviationsFromMean[feat];
      const diffFormatted = dev ? (dev.diffPct >= 0 ? `+${dev.diffPct}%` : `${dev.diffPct}%`) : '0%';
      const badgeClass = dev?.diffPct >= 0 ? 'color: #059669; font-weight: 600;' : 'color: #dc2626; font-weight: 600;';
      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${feat}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace;">${val.toLocaleString()}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; ${badgeClass}">${diffFormatted}</td>
        </tr>
      `;
    }).join('');

    // Pillars HTML
    const pillarsHTML = aiStrat?.pillars
      ? `
      <div style="margin-top: 20px;">
        <h4 style="color: #0f172a; font-size: 15px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-left: 4px solid #6366f1; padding-left: 8px;">
          Plan Estratégico Integral (5 Pilares de Negocio)
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #4338ca; margin-bottom: 4px; font-size: 13px;">📦 1. PRODUCTO</div>
            <div style="font-size: 13px; color: #334155; line-height: 1.5;">${aiStrat.pillars.producto}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #047857; margin-bottom: 4px; font-size: 13px;">🏷️ 2. PRECIO & PRICING</div>
            <div style="font-size: 13px; color: #334155; line-height: 1.5;">${aiStrat.pillars.precio}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #b45309; margin-bottom: 4px; font-size: 13px;">💡 3. INNOVACIÓN & DIGITAL</div>
            <div style="font-size: 13px; color: #334155; line-height: 1.5;">${aiStrat.pillars.innovacion}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #1d4ed8; margin-bottom: 4px; font-size: 13px;">📢 4. COMUNICACIÓN & CANALES</div>
            <div style="font-size: 13px; color: #334155; line-height: 1.5;">${aiStrat.pillars.comunicacion}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #7e22ce; margin-bottom: 4px; font-size: 13px;">💰 5. RENTABILIDAD & LTV</div>
            <div style="font-size: 13px; color: #334155; line-height: 1.5;">${aiStrat.pillars.rentabilidad}</div>
          </div>
        </div>
      </div>
      <div style="margin-top: 14px; background: #eef2ff; border-left: 4px solid #4f46e5; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #312e81;">
        <strong>🚀 Quick Win Inmediato (30 días):</strong> ${quickWin}
      </div>
      `
      : `
      <div style="padding: 16px; background: #f1f5f9; border-radius: 8px; font-size: 13px; color: #64748b; font-style: italic;">
        Perfilamiento con IA pendiente de generación para este cluster.
      </div>
      `;

    return `
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="background: #3b82f6; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 12px;">
                Cluster ${centroid.clusterId}
              </span>
              <h3 style="margin: 0; font-size: 20px; color: #0f172a; font-weight: 700;">${commercialName}</h3>
            </div>
            <p style="margin: 6px 0 0 0; color: #475569; font-size: 14px; max-width: 750px;">${archetype}</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; ${priorityBadgeColor}">
              Prioridad: ${priority}
            </span>
            <span style="background: #f1f5f9; color: #1e293b; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              👥 ${centroid.size} registros (${centroid.percentage}%)
            </span>
            <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              🎯 KPI: ${primaryKpi}
            </span>
          </div>
        </div>

        <!-- Centroid Details -->
        <div style="margin-top: 16px;">
          <h4 style="color: #334155; font-size: 14px; margin-bottom: 8px;">Centroide Matemático vs Media Global</h4>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
              <thead>
                <tr style="background: #f8fafc; color: #475569;">
                  <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0;">Variable</th>
                  <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0; text-align: right;">Valor Promedio Cluster</th>
                  <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0; text-align: right;">Desviación vs Población</th>
                </tr>
              </thead>
              <tbody>
                ${featuresRows}
              </tbody>
            </table>
          </div>
        </div>

        ${pillarsHTML}
      </div>
    `;
  }).join('');

  // Column summaries for EDA section
  const edaRows = cleaningReport.columns.map((col) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">${col.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; font-size: 11px;">
        <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${col.type}</span>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">${col.nullCount} (${col.nullPercentage}%)</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace;">${col.min !== undefined ? col.min.toLocaleString() : '-'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace;">${col.mean !== undefined ? col.mean.toLocaleString() : '-'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace;">${col.max !== undefined ? col.max.toLocaleString() : '-'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; color: ${col.outliersIqrCount ? '#dc2626' : '#16a34a'};">${col.outliersIqrCount ?? 0}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dossier Estratégico de Segmentación - ${sector}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 30px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 1140px;
      margin: 0 auto;
    }
    .header-card {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      color: #ffffff;
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.25);
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    .kpi-card {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      padding: 16px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 32px 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
    }
    .btn-print {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-print:hover {
      background: #4338ca;
    }
    @media print {
      body { background: white; padding: 0; }
      .btn-print { display: none; }
      .header-card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
      <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
    </div>

    <!-- Header Banner -->
    <div class="header-card">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
            CLUSTIQ STRATEGIC REPORT • GOOGLE GEMINI AI
          </span>
          <h1 style="margin: 10px 0 4px 0; font-size: 28px; font-weight: 800;">Dossier de Segmentación Estratégica</h1>
          <p style="margin: 0; opacity: 0.85; font-size: 15px;">Sector Económico: <strong>${sector}</strong> • Generado el ${executionDate}</p>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase;">Registros Analizados</div>
          <div style="font-size: 26px; font-weight: 800; margin-top: 4px;">${cleaningReport.totalRows.toLocaleString()}</div>
        </div>
        <div class="kpi-card">
          <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase;">Clusters (k)</div>
          <div style="font-size: 26px; font-weight: 800; margin-top: 4px;">k = ${clusteringResult.k}</div>
          <div style="font-size: 11px; opacity: 0.8;">Criterio: ${selectionMethod.toUpperCase()}</div>
        </div>
        <div class="kpi-card">
          <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase;">Algoritmo & Distancia</div>
          <div style="font-size: 16px; font-weight: 700; margin-top: 6px;">${clusteringResult.algorithm}</div>
          <div style="font-size: 11px; opacity: 0.8;">${clusteringResult.distanceMetric}</div>
        </div>
        <div class="kpi-card">
          <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase;">Calidad de Silueta</div>
          <div style="font-size: 26px; font-weight: 800; margin-top: 4px;">${clusteringResult.silhouetteScore}</div>
          <div style="font-size: 11px; opacity: 0.8;">Inercia WCSS: ${clusteringResult.wcss.toLocaleString()}</div>
        </div>
      </div>
    </div>

    ${strategyResponse?.executiveSummary ? `
    <!-- Executive Summary from Gemini -->
    <div class="card" style="border-left: 6px solid #4f46e5; background: #ffffff;">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
        💡 Resumen Ejecutivo del Comité de Dirección (Google Gemini AI)
      </h2>
      <p style="font-size: 14.5px; line-height: 1.7; color: #334155; margin: 0;">
        ${strategyResponse.executiveSummary}
      </p>
      ${businessRationale ? `
      <div style="margin-top: 14px; padding: 10px 14px; background: #f8fafc; border-radius: 6px; font-size: 13px; color: #475569;">
        <strong>Justificación de Criterio de Negocio:</strong> ${businessRationale}
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Strategic Pillars & Personas per Cluster -->
    <div class="section-title">🎯 Perfiles Comerciales y Planes de Acción por Cluster</div>
    ${clusterCardsHTML}

    <!-- EDA and Preprocessing Audit -->
    <div class="section-title">📊 Auditoría de Preprocesamiento y Análisis Descriptivo (EDA)</div>
    <div class="card">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px;">
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b;">Imputación Aplicada</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; text-transform: capitalize;">${imputationStrategy}</div>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b;">Filas Duplicadas Removidas</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${cleaningReport.duplicateRows}</div>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b;">Celdas Nulas Diagnosticadas</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${cleaningReport.totalMissingCells} (${cleaningReport.missingPercentage}%)</div>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b;">Escalado de Datos</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${clusteringResult.scalingUsed}</div>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155;">
              <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1;">Columna</th>
              <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1;">Tipo</th>
              <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: right;">Valores Nulos</th>
              <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: right;">Mín</th>
              <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: right;">Media</th>
              <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: right;">Máx</th>
              <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: right;">Outliers (IQR)</th>
            </tr>
          </thead>
          <tbody>
            ${edaRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
      Reporte exportado automáticamente por ClustIQ • Powered by scikit-learn & Google Gemini AI (AI Studio)
    </div>
  </div>
</body>
</html>`;
}
