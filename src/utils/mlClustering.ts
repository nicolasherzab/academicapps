import * as XLSX from 'xlsx';

export interface ColumnDiagnosis {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'id';
  total: number;
  nullCount: number;
  nullPercentage: number;
  distinctCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  q25?: number;
  q75?: number;
  outliersIqrCount?: number;
}

export interface CleaningReport {
  totalRows: number;
  totalColumns: number;
  duplicateRows: number;
  totalMissingCells: number;
  missingPercentage: number;
  columns: ColumnDiagnosis[];
  hasOutliers: boolean;
  totalOutliers: number;
}

export interface ClusterCentroid {
  clusterId: number;
  size: number;
  percentage: number;
  unscaledCentroid: Record<string, number>;
  scaledCentroid: Record<string, number>;
  deviationsFromMean: Record<string, { diffVal: number; diffPct: number; isHigher: boolean }>;
}

export interface ClusteringResult {
  labels: number[];
  k: number;
  algorithm: 'K-Means' | 'K-Medoids (PAM)';
  distanceMetric: 'Euclidiana' | 'Manhattan (L1)';
  scalingUsed: 'StandardScaler (Z-Score)' | 'MinMaxScaler' | 'Sin Escalado';
  centroids: ClusterCentroid[];
  wcss: number;
  silhouetteScore: number;
  featuresUsed: string[];
  globalMeans: Record<string, number>;
  pcaCoords?: Array<{ x: number; y: number; cluster: number }>;
}

export interface EvaluationMetrics {
  kValues: number[];
  wcssList: number[];
  silhouetteList: number[];
  recommendedKByElbow: number;
  recommendedKBySilhouette: number;
}

export const ECONOMIC_SECTORS = [
  'Retail & Comercio Minorista',
  'Banca, Finanzas & Seguros',
  'SaaS, Software & Tecnología B2B',
  'Telecomunicaciones & Conectividad',
  'Bienes de Consumo Masivo (CPG / FMCG)',
  'Salud, Farma & Biotecnología',
  'Turismo, Hospitalidad & Viajes',
  'Manufactura, Logística & Cadena de Suministro',
  'Educación & EdTech',
  'Energía, Utilities & Servicios Públicos',
  'Inmobiliario & Real Estate',
  'Automotriz & Movilidad',
];

// Sample Datasets generator
export function getSampleDataset(sector: string): Record<string, any>[] {
  if (sector.includes('SaaS')) {
    return generateSaaSDataset();
  } else if (sector.includes('Banca') || sector.includes('Finanzas')) {
    return generateBankingDataset();
  } else {
    return generateRetailDataset();
  }
}

function generateRetailDataset(): Record<string, any>[] {
  const records: Record<string, any>[] = [];
  const count = 350;

  // 3 archetypes simulated: VIP (20%), Regular/Frequent (45%), Bargain/Occasional (35%)
  for (let i = 1; i <= count; i++) {
    const roll = Math.random();
    let recency: number;
    let frequency: number;
    let annualSpend: number;
    let avgTicket: number;
    let returnRate: number;
    let discountUsage: number;

    if (roll < 0.22) {
      // VIP
      recency = Math.round(5 + Math.random() * 25);
      frequency = Math.round(20 + Math.random() * 30);
      avgTicket = Math.round(140 + Math.random() * 120);
      annualSpend = Math.round(frequency * avgTicket * (0.9 + Math.random() * 0.2));
      returnRate = Number((2 + Math.random() * 6).toFixed(1));
      discountUsage = Number((5 + Math.random() * 15).toFixed(1));
    } else if (roll < 0.65) {
      // Frequent Mid-Tier
      recency = Math.round(20 + Math.random() * 50);
      frequency = Math.round(8 + Math.random() * 14);
      avgTicket = Math.round(60 + Math.random() * 50);
      annualSpend = Math.round(frequency * avgTicket * (0.9 + Math.random() * 0.2));
      returnRate = Number((5 + Math.random() * 8).toFixed(1));
      discountUsage = Number((15 + Math.random() * 25).toFixed(1));
    } else {
      // Occasional / Discount Hunters
      recency = Math.round(60 + Math.random() * 160);
      frequency = Math.round(1 + Math.random() * 5);
      avgTicket = Math.round(25 + Math.random() * 35);
      annualSpend = Math.round(frequency * avgTicket);
      returnRate = Number((8 + Math.random() * 14).toFixed(1));
      discountUsage = Number((40 + Math.random() * 45).toFixed(1));
    }

    // Add some random nulls in 3% of rows for demonstration of Phase 2 cleaning
    const hasNull = Math.random() < 0.03;

    records.push({
      ID_Cliente: `CLI-${1000 + i}`,
      Recencia_Dias: recency,
      Frecuencia_Anual: frequency,
      Gasto_Total_USD: annualSpend,
      Ticket_Promedio_USD: hasNull ? null : avgTicket,
      Tasa_Devolucion_Pct: returnRate,
      Uso_Descuentos_Pct: discountUsage,
      Canal_Preferido: roll < 0.22 ? 'Omnicanal' : roll < 0.65 ? 'Online' : 'Tienda Física',
    });
  }

  // Inject 2 intentional duplicates for cleaning diagnostic test
  records.push({ ...records[0] });
  records.push({ ...records[5] });

  return records;
}

function generateSaaSDataset(): Record<string, any>[] {
  const records: Record<string, any>[] = [];
  const count = 300;

  for (let i = 1; i <= count; i++) {
    const roll = Math.random();
    let mrr: number;
    let activeUsers: number;
    let supportTickets: number;
    let nps: number;
    let tenureMonths: number;
    let featureAdoption: number;

    if (roll < 0.25) {
      // Enterprise Power Users
      mrr = Math.round(2500 + Math.random() * 3500);
      activeUsers = Math.round(80 + Math.random() * 120);
      supportTickets = Math.round(2 + Math.random() * 5);
      nps = Math.round(8 + Math.random() * 2);
      tenureMonths = Math.round(18 + Math.random() * 24);
      featureAdoption = Number((75 + Math.random() * 22).toFixed(1));
    } else if (roll < 0.6) {
      // Mid-Market Steady
      mrr = Math.round(800 + Math.random() * 1200);
      activeUsers = Math.round(20 + Math.random() * 40);
      supportTickets = Math.round(4 + Math.random() * 8);
      nps = Math.round(6 + Math.random() * 3);
      tenureMonths = Math.round(8 + Math.random() * 16);
      featureAdoption = Number((45 + Math.random() * 25).toFixed(1));
    } else {
      // Early Stage or At-Risk
      mrr = Math.round(150 + Math.random() * 450);
      activeUsers = Math.round(3 + Math.random() * 12);
      supportTickets = Math.round(6 + Math.random() * 12);
      nps = Math.round(2 + Math.random() * 5);
      tenureMonths = Math.round(1 + Math.random() * 8);
      featureAdoption = Number((15 + Math.random() * 25).toFixed(1));
    }

    records.push({
      ID_Cuenta: `ACC-${2000 + i}`,
      MRR_USD: mrr,
      Usuarios_Activos: activeUsers,
      Tickets_Soporte: supportTickets,
      NPS_Score: nps,
      Antiguedad_Meses: tenureMonths,
      Adopcion_Features_Pct: featureAdoption,
      Tier_Suscripcion: roll < 0.25 ? 'Enterprise' : roll < 0.6 ? 'Professional' : 'Starter',
    });
  }
  return records;
}

function generateBankingDataset(): Record<string, any>[] {
  const records: Record<string, any>[] = [];
  const count = 320;

  for (let i = 1; i <= count; i++) {
    const roll = Math.random();
    let monthlyIncome: number;
    let avgBalance: number;
    let cardSpend: number;
    let creditScore: number;
    let digitalTx: number;
    let productsHeld: number;

    if (roll < 0.3) {
      // Affluent Investors
      monthlyIncome = Math.round(6000 + Math.random() * 8000);
      avgBalance = Math.round(25000 + Math.random() * 50000);
      cardSpend = Math.round(2500 + Math.random() * 3500);
      creditScore = Math.round(760 + Math.random() * 80);
      digitalTx = Math.round(35 + Math.random() * 40);
      productsHeld = Math.round(4 + Math.random() * 3);
    } else if (roll < 0.65) {
      // Digital Mass Market
      monthlyIncome = Math.round(2200 + Math.random() * 2800);
      avgBalance = Math.round(3000 + Math.random() * 6000);
      cardSpend = Math.round(900 + Math.random() * 1100);
      creditScore = Math.round(680 + Math.random() * 60);
      digitalTx = Math.round(25 + Math.random() * 30);
      productsHeld = Math.round(2 + Math.random() * 2);
    } else {
      // Credit Reliant / Low Balance
      monthlyIncome = Math.round(1200 + Math.random() * 1000);
      avgBalance = Math.round(400 + Math.random() * 900);
      cardSpend = Math.round(600 + Math.random() * 800);
      creditScore = Math.round(540 + Math.random() * 100);
      digitalTx = Math.round(10 + Math.random() * 15);
      productsHeld = 1;
    }

    records.push({
      ID_Cliente: `BNK-${5000 + i}`,
      Ingreso_Mensual_USD: monthlyIncome,
      Saldo_Promedio_USD: avgBalance,
      Gasto_Tarjeta_Mes: cardSpend,
      Score_Crediticio: creditScore,
      Tx_Digitales_Mes: digitalTx,
      Productos_Bancarios: productsHeld,
      Segmento_Riesgo: roll < 0.3 ? 'Bajo' : roll < 0.65 ? 'Medio' : 'Alto',
    });
  }
  return records;
}

// File parser for CSV, TXT, XLS, XLSX
export async function parseUploadedFile(file: File): Promise<Record<string, any>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
  return jsonData;
}

// Data Diagnosis
export function diagnoseDataset(data: Record<string, any>[]): CleaningReport {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      duplicateRows: 0,
      totalMissingCells: 0,
      missingPercentage: 0,
      columns: [],
      hasOutliers: false,
      totalOutliers: 0,
    };
  }

  const totalRows = data.length;
  const colNames = Object.keys(data[0] || {});
  const totalColumns = colNames.length;

  // Duplicates check via string hash
  const seenRows = new Set<string>();
  let duplicateRows = 0;
  for (const row of data) {
    const serialized = JSON.stringify(row);
    if (seenRows.has(serialized)) {
      duplicateRows++;
    } else {
      seenRows.add(serialized);
    }
  }

  let totalMissingCells = 0;
  let totalOutliers = 0;

  const columns: ColumnDiagnosis[] = colNames.map((col) => {
    let nullCount = 0;
    const values: any[] = [];
    const numValues: number[] = [];

    for (const row of data) {
      const val = row[col];
      if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
        nullCount++;
      } else {
        values.push(val);
        const parsed = Number(val);
        if (!isNaN(parsed) && typeof val !== 'boolean') {
          numValues.push(parsed);
        }
      }
    }

    totalMissingCells += nullCount;
    const nullPercentage = Number(((nullCount / totalRows) * 100).toFixed(2));
    const distinctCount = new Set(values).size;

    // Determine type
    let type: 'numeric' | 'categorical' | 'date' | 'id' = 'categorical';
    const isMostlyNumeric = numValues.length > 0 && numValues.length >= values.length * 0.85;

    if (isMostlyNumeric) {
      if (col.toLowerCase().includes('id') || col.toLowerCase().includes('codigo') || col.toLowerCase().includes('uuid')) {
        type = 'id';
      } else {
        type = 'numeric';
      }
    } else if (values.some((v) => v instanceof Date || (!isNaN(Date.parse(v)) && String(v).includes('-')))) {
      type = 'date';
    } else if (col.toLowerCase().includes('id') || distinctCount === totalRows) {
      type = 'id';
    } else {
      type = 'categorical';
    }

    let min: number | undefined;
    let max: number | undefined;
    let mean: number | undefined;
    let median: number | undefined;
    let std: number | undefined;
    let q25: number | undefined;
    let q75: number | undefined;
    let outliersIqrCount: number | undefined;

    if (type === 'numeric' && numValues.length > 0) {
      numValues.sort((a, b) => a - b);
      min = numValues[0];
      max = numValues[numValues.length - 1];
      const sum = numValues.reduce((acc, curr) => acc + curr, 0);
      mean = Number((sum / numValues.length).toFixed(2));

      median = getPercentile(numValues, 50);
      q25 = getPercentile(numValues, 25);
      q75 = getPercentile(numValues, 75);

      const variance = numValues.reduce((acc, curr) => acc + Math.pow(curr - (mean || 0), 2), 0) / numValues.length;
      std = Number(Math.sqrt(variance).toFixed(2));

      const iqr = (q75 || 0) - (q25 || 0);
      const lowerBound = (q25 || 0) - 1.5 * iqr;
      const upperBound = (q75 || 0) + 1.5 * iqr;

      const outliers = numValues.filter((v) => v < lowerBound || v > upperBound);
      outliersIqrCount = outliers.length;
      totalOutliers += outliers.length;
    }

    return {
      name: col,
      type,
      total: totalRows,
      nullCount,
      nullPercentage,
      distinctCount,
      min,
      max,
      mean,
      median,
      std,
      q25,
      q75,
      outliersIqrCount,
    };
  });

  const totalCells = totalRows * totalColumns;
  const missingPercentage = totalCells > 0 ? Number(((totalMissingCells / totalCells) * 100).toFixed(2)) : 0;

  return {
    totalRows,
    totalColumns,
    duplicateRows,
    totalMissingCells,
    missingPercentage,
    columns,
    hasOutliers: totalOutliers > 0,
    totalOutliers,
  };
}

function getPercentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return Number((sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight).toFixed(2));
}

// Data Imputation Engine
export type ImputationStrategy = 'mean' | 'median' | 'mode' | 'drop' | 'constant';

export function imputeAndCleanDataset(
  data: Record<string, any>[],
  diagnosis: CleaningReport,
  strategy: ImputationStrategy,
  removeDuplicates: boolean
): { cleanedData: Record<string, any>[]; affectedRows: number; duplicatesRemoved: number } {
  let workingData = [...data];
  let duplicatesRemoved = 0;

  if (removeDuplicates) {
    const seen = new Set<string>();
    const unique: Record<string, any>[] = [];
    for (const row of workingData) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(row);
      } else {
        duplicatesRemoved++;
      }
    }
    workingData = unique;
  }

  if (strategy === 'drop') {
    const beforeCount = workingData.length;
    workingData = workingData.filter((row) => {
      return Object.values(row).every((val) => val !== null && val !== undefined && val !== '' && !Number.isNaN(val));
    });
    return {
      cleanedData: workingData,
      affectedRows: beforeCount - workingData.length,
      duplicatesRemoved,
    };
  }

  // Calculate replacement values per column
  const replacements: Record<string, any> = {};
  for (const col of diagnosis.columns) {
    if (col.nullCount > 0) {
      if (col.type === 'numeric') {
        if (strategy === 'mean') {
          replacements[col.name] = col.mean ?? 0;
        } else if (strategy === 'median') {
          replacements[col.name] = col.median ?? 0;
        } else if (strategy === 'constant') {
          replacements[col.name] = 0;
        } else {
          // Mode
          replacements[col.name] = calculateMode(workingData.map((r) => r[col.name])) ?? 0;
        }
      } else {
        // Categorical or Date
        replacements[col.name] = strategy === 'constant' ? 'Desconocido' : calculateMode(workingData.map((r) => r[col.name])) ?? 'N/A';
      }
    }
  }

  let affectedRows = 0;
  const cleanedData = workingData.map((row) => {
    let modified = false;
    const newRow = { ...row };
    for (const [col, replacement] of Object.entries(replacements)) {
      const v = newRow[col];
      if (v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v))) {
        newRow[col] = replacement;
        modified = true;
      }
    }
    if (modified) affectedRows++;
    return newRow;
  });

  return { cleanedData, affectedRows, duplicatesRemoved };
}

function calculateMode(arr: any[]): any {
  const valid = arr.filter((x) => x !== null && x !== undefined && x !== '');
  if (valid.length === 0) return null;
  const freq: Record<string, number> = {};
  let maxCount = 0;
  let modeVal = valid[0];
  for (const item of valid) {
    const key = String(item);
    freq[key] = (freq[key] || 0) + 1;
    if (freq[key] > maxCount) {
      maxCount = freq[key];
      modeVal = item;
    }
  }
  return modeVal;
}

// Scaling
export function scaleMatrix(
  matrix: number[][],
  scalingType: 'StandardScaler (Z-Score)' | 'MinMaxScaler' | 'Sin Escalado'
): { scaled: number[][]; means: number[]; stds: number[]; mins: number[]; maxs: number[] } {
  if (matrix.length === 0) {
    return { scaled: [], means: [], stds: [], mins: [], maxs: [] };
  }

  const numRows = matrix.length;
  const numCols = matrix[0].length;
  const means: number[] = new Array(numCols).fill(0);
  const stds: number[] = new Array(numCols).fill(0);
  const mins: number[] = new Array(numCols).fill(Infinity);
  const maxs: number[] = new Array(numCols).fill(-Infinity);

  for (let c = 0; c < numCols; c++) {
    let sum = 0;
    for (let r = 0; r < numRows; r++) {
      const val = matrix[r][c];
      sum += val;
      if (val < mins[c]) mins[c] = val;
      if (val > maxs[c]) maxs[c] = val;
    }
    means[c] = sum / numRows;

    let varSum = 0;
    for (let r = 0; r < numRows; r++) {
      varSum += Math.pow(matrix[r][c] - means[c], 2);
    }
    stds[c] = Math.sqrt(varSum / numRows) || 1; // avoid division by zero
  }

  const scaled: number[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: number[] = [];
    for (let c = 0; c < numCols; c++) {
      const val = matrix[r][c];
      if (scalingType === 'StandardScaler (Z-Score)') {
        row.push((val - means[c]) / stds[c]);
      } else if (scalingType === 'MinMaxScaler') {
        const range = maxs[c] - mins[c] || 1;
        row.push((val - mins[c]) / range);
      } else {
        row.push(val);
      }
    }
    scaled.push(row);
  }

  return { scaled, means, stds, mins, maxs };
}

// Distance metrics
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function manhattanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

// K-Means with K-Means++ initialization
export function runKMeans(
  data: number[][],
  k: number,
  maxIterations = 100
): { labels: number[]; centroids: number[][]; wcss: number } {
  const n = data.length;
  const d = data[0].length;

  if (k <= 0 || n < k) {
    throw new Error('El número de clusters k no es válido para el tamaño de datos.');
  }

  // K-Means++ init
  const centroids: number[][] = [];
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push([...data[firstIdx]]);

  for (let c = 1; c < k; c++) {
    const distSq: number[] = [];
    let sumDistSq = 0;
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = euclideanDistance(data[i], centroid);
        if (dist < minDist) minDist = dist;
      }
      const d2 = minDist * minDist;
      distSq.push(d2);
      sumDistSq += d2;
    }

    let r = Math.random() * sumDistSq;
    let chosenIdx = 0;
    for (let i = 0; i < n; i++) {
      r -= distSq[i];
      if (r <= 0) {
        chosenIdx = i;
        break;
      }
    }
    centroids.push([...data[chosenIdx]]);
  }

  let labels = new Array(n).fill(0);
  let iteration = 0;
  let changed = true;

  while (changed && iteration < maxIterations) {
    changed = false;
    iteration++;

    // Assignment step
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const dist = euclideanDistance(data[i], centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }
      if (labels[i] !== bestCluster) {
        labels[i] = bestCluster;
        changed = true;
      }
    }

    // Update step
    const counts = new Array(k).fill(0);
    const newCentroids = Array.from({ length: k }, () => new Array(d).fill(0));

    for (let i = 0; i < n; i++) {
      const c = labels[i];
      counts[c]++;
      for (let j = 0; j < d; j++) {
        newCentroids[c][j] += data[i][j];
      }
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < d; j++) {
          centroids[c][j] = newCentroids[c][j] / counts[c];
        }
      } else {
        // Re-seed empty cluster with random point
        const randIdx = Math.floor(Math.random() * n);
        centroids[c] = [...data[randIdx]];
      }
    }
  }

  // Calculate WCSS (Inertia)
  let wcss = 0;
  for (let i = 0; i < n; i++) {
    const c = labels[i];
    const dist = euclideanDistance(data[i], centroids[c]);
    wcss += dist * dist;
  }

  return { labels, centroids, wcss };
}

// K-Medoids (PAM - Partitioning Around Medoids)
export function runKMedoids(
  data: number[][],
  k: number,
  metric: 'Euclidiana' | 'Manhattan (L1)',
  maxIterations = 50
): { labels: number[]; centroids: number[][]; wcss: number } {
  const n = data.length;
  const d = data[0].length;
  const distFn = metric === 'Manhattan (L1)' ? manhattanDistance : euclideanDistance;

  // Initialize k medoids randomly
  const medoidIndices = new Set<number>();
  while (medoidIndices.size < k) {
    medoidIndices.add(Math.floor(Math.random() * n));
  }
  let currentMedoids = Array.from(medoidIndices);

  let labels = new Array(n).fill(0);
  let iteration = 0;
  let changed = true;

  while (changed && iteration < maxIterations) {
    changed = false;
    iteration++;

    // Assignment
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestMedoid = 0;
      for (let m = 0; m < k; m++) {
        const dist = distFn(data[i], data[currentMedoids[m]]);
        if (dist < minDist) {
          minDist = dist;
          bestMedoid = m;
        }
      }
      if (labels[i] !== bestMedoid) {
        labels[i] = bestMedoid;
      }
    }

    // Update medoids: choose point in cluster that minimizes sum of distances to other cluster members
    const newMedoids = [...currentMedoids];
    for (let m = 0; m < k; m++) {
      const clusterPoints: number[] = [];
      for (let i = 0; i < n; i++) {
        if (labels[i] === m) clusterPoints.push(i);
      }

      if (clusterPoints.length === 0) continue;

      let bestCost = Infinity;
      let bestCandidate = clusterPoints[0];

      for (const candidate of clusterPoints) {
        let cost = 0;
        for (const other of clusterPoints) {
          cost += distFn(data[candidate], data[other]);
        }
        if (cost < bestCost) {
          bestCost = cost;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate !== currentMedoids[m]) {
        newMedoids[m] = bestCandidate;
        changed = true;
      }
    }
    currentMedoids = newMedoids;
  }

  const centroids = currentMedoids.map((idx) => [...data[idx]]);

  let wcss = 0;
  for (let i = 0; i < n; i++) {
    const c = labels[i];
    const dist = euclideanDistance(data[i], centroids[c]);
    wcss += dist * dist;
  }

  return { labels, centroids, wcss };
}

// Silhouette Score Calculation
export function calculateSilhouetteScore(data: number[][], labels: number[], k: number): number {
  const n = data.length;
  if (k <= 1 || n < k) return 0;

  // Subsample if > 600 points for real-time responsiveness
  const sampleIndices: number[] = [];
  const maxSamples = 600;
  const step = Math.max(1, Math.floor(n / maxSamples));
  for (let i = 0; i < n; i += step) {
    sampleIndices.push(i);
  }

  let totalSilhouette = 0;

  for (const i of sampleIndices) {
    const clusterI = labels[i];

    // Compute a(i): average distance to points in same cluster
    let aSum = 0;
    let aCount = 0;
    const clusterDistances: Record<number, { sum: number; count: number }> = {};

    for (let c = 0; c < k; c++) {
      if (c !== clusterI) {
        clusterDistances[c] = { sum: 0, count: 0 };
      }
    }

    for (const j of sampleIndices) {
      if (i === j) continue;
      const d = euclideanDistance(data[i], data[j]);
      if (labels[j] === clusterI) {
        aSum += d;
        aCount++;
      } else {
        const c = labels[j];
        if (clusterDistances[c]) {
          clusterDistances[c].sum += d;
          clusterDistances[c].count++;
        }
      }
    }

    const a = aCount > 0 ? aSum / aCount : 0;

    // Compute b(i): minimum average distance to any other cluster
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c !== clusterI && clusterDistances[c] && clusterDistances[c].count > 0) {
        const avgOther = clusterDistances[c].sum / clusterDistances[c].count;
        if (avgOther < b) b = avgOther;
      }
    }

    if (b === Infinity) b = 0;

    const denom = Math.max(a, b);
    const s = denom > 0 ? (b - a) / denom : 0;
    totalSilhouette += s;
  }

  return Number((totalSilhouette / sampleIndices.length).toFixed(3));
}

// Evaluate optimal k from k=2 to k=8
export function evaluateOptimalK(
  scaledData: number[][],
  algorithm: 'K-Means' | 'K-Medoids (PAM)',
  metric: 'Euclidiana' | 'Manhattan (L1)'
): EvaluationMetrics {
  const kValues: number[] = [2, 3, 4, 5, 6, 7, 8];
  const wcssList: number[] = [];
  const silhouetteList: number[] = [];

  for (const k of kValues) {
    let res;
    if (algorithm === 'K-Means') {
      res = runKMeans(scaledData, k, 60);
    } else {
      res = runKMedoids(scaledData, k, metric, 35);
    }
    wcssList.push(Math.round(res.wcss));

    const sil = calculateSilhouetteScore(scaledData, res.labels, k);
    silhouetteList.push(sil);
  }

  // Recommended K by Silhouette (maximum silhouette)
  let maxSil = -Infinity;
  let recommendedKBySilhouette = 3;
  for (let i = 0; i < silhouetteList.length; i++) {
    if (silhouetteList[i] > maxSil) {
      maxSil = silhouetteList[i];
      recommendedKBySilhouette = kValues[i];
    }
  }

  // Recommended K by Elbow (maximum second derivative / angle change)
  let bestElbowK = 3;
  let maxDropDiff = -Infinity;
  for (let i = 1; i < wcssList.length - 1; i++) {
    const dropPrev = wcssList[i - 1] - wcssList[i];
    const dropNext = wcssList[i] - wcssList[i + 1];
    const diff = dropPrev - dropNext;
    if (diff > maxDropDiff) {
      maxDropDiff = diff;
      bestElbowK = kValues[i];
    }
  }

  return {
    kValues,
    wcssList,
    silhouetteList,
    recommendedKByElbow: bestElbowK,
    recommendedKBySilhouette,
  };
}

// 2D PCA Dimensionality reduction for visualization
export function computePCA2D(data: number[][], labels: number[]): Array<{ x: number; y: number; cluster: number }> {
  const n = data.length;
  const d = data[0].length;
  if (d === 0 || n === 0) return [];

  if (d <= 2) {
    return data.map((row, i) => ({
      x: Number((row[0] || 0).toFixed(2)),
      y: Number((row[1] || 0).toFixed(2)),
      cluster: labels[i],
    }));
  }

  // Center data
  const colMeans: number[] = new Array(d).fill(0);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < d; c++) {
      colMeans[c] += data[r][c];
    }
  }
  for (let c = 0; c < d; c++) colMeans[c] /= n;

  const centered: number[][] = data.map((row) => row.map((val, c) => val - colMeans[c]));

  // Power iteration for first 2 principal components
  function getTopEigenvector(matrix: number[][], deflateVec?: number[]): number[] {
    let v: number[] = Array.from({ length: d }, () => Math.random() - 0.5);
    // Normalize
    let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    v = v.map((x) => x / norm);

    for (let iter = 0; iter < 25; iter++) {
      // Multiply by Covariance = X^T * (X * v) / n
      const Xv: number[] = new Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        let dot = 0;
        for (let j = 0; j < d; j++) dot += centered[i][j] * v[j];
        Xv[i] = dot;
      }

      let newV: number[] = new Array(d).fill(0);
      for (let j = 0; j < d; j++) {
        let dot = 0;
        for (let i = 0; i < n; i++) dot += centered[i][j] * Xv[i];
        newV[j] = dot / n;
      }

      if (deflateVec) {
        // Orthogonalize against deflateVec
        let dotDeflate = 0;
        for (let j = 0; j < d; j++) dotDeflate += newV[j] * deflateVec[j];
        for (let j = 0; j < d; j++) newV[j] -= dotDeflate * deflateVec[j];
      }

      norm = Math.sqrt(newV.reduce((s, x) => s + x * x, 0)) || 1;
      v = newV.map((x) => x / norm);
    }
    return v;
  }

  const pc1 = getTopEigenvector(centered);
  const pc2 = getTopEigenvector(centered, pc1);

  return centered.map((row, i) => {
    let x = 0;
    let y = 0;
    for (let c = 0; c < d; c++) {
      x += row[c] * pc1[c];
      y += row[c] * pc2[c];
    }
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      cluster: labels[i],
    };
  });
}

// Master execution pipeline
export function executeClusteringPipeline(
  cleanedData: Record<string, any>[],
  features: string[],
  k: number,
  algorithm: 'K-Means' | 'K-Medoids (PAM)',
  distanceMetric: 'Euclidiana' | 'Manhattan (L1)',
  scalingType: 'StandardScaler (Z-Score)' | 'MinMaxScaler' | 'Sin Escalado'
): ClusteringResult {
  // Extract matrix of raw numbers
  const rawMatrix: number[][] = cleanedData.map((row) => {
    return features.map((f) => {
      const val = Number(row[f]);
      return isNaN(val) ? 0 : val;
    });
  });

  const { scaled, means, stds, mins, maxs } = scaleMatrix(rawMatrix, scalingType);

  let clusterRes;
  if (algorithm === 'K-Means') {
    clusterRes = runKMeans(scaled, k, 100);
  } else {
    clusterRes = runKMedoids(scaled, k, distanceMetric, 60);
  }

  const { labels, centroids: scaledCentroids, wcss } = clusterRes;
  const silhouetteScore = calculateSilhouetteScore(scaled, labels, k);

  // Global unscaled means
  const globalMeans: Record<string, number> = {};
  features.forEach((f, idx) => {
    globalMeans[f] = Number(means[idx].toFixed(2));
  });

  // Calculate actual unscaled centroids and relative deviations
  const centroids: ClusterCentroid[] = [];
  const totalRows = cleanedData.length;

  for (let c = 0; c < k; c++) {
    const clusterRows: number[][] = [];
    for (let i = 0; i < totalRows; i++) {
      if (labels[i] === c) {
        clusterRows.push(rawMatrix[i]);
      }
    }

    const size = clusterRows.length;
    const percentage = Number(((size / totalRows) * 100).toFixed(1));

    const unscaledCentroid: Record<string, number> = {};
    const scaledCentroidObj: Record<string, number> = {};
    const deviationsFromMean: Record<string, { diffVal: number; diffPct: number; isHigher: boolean }> = {};

    features.forEach((feat, featIdx) => {
      let featureSum = 0;
      for (const row of clusterRows) {
        featureSum += row[featIdx];
      }
      const meanVal = size > 0 ? featureSum / size : globalMeans[feat];
      unscaledCentroid[feat] = Number(meanVal.toFixed(2));
      scaledCentroidObj[feat] = Number(scaledCentroids[c][featIdx].toFixed(2));

      const gMean = globalMeans[feat] || 0.0001;
      const diffVal = Number((unscaledCentroid[feat] - gMean).toFixed(2));
      const diffPct = Number(((diffVal / Math.abs(gMean)) * 100).toFixed(1));

      deviationsFromMean[feat] = {
        diffVal,
        diffPct,
        isHigher: diffVal >= 0,
      };
    });

    centroids.push({
      clusterId: c + 1,
      size,
      percentage,
      unscaledCentroid,
      scaledCentroid: scaledCentroidObj,
      deviationsFromMean,
    });
  }

  // Compute 2D PCA representation
  const pcaCoords = computePCA2D(scaled, labels);

  return {
    labels,
    k,
    algorithm,
    distanceMetric,
    scalingUsed: scalingType,
    centroids,
    wcss,
    silhouetteScore,
    featuresUsed: features,
    globalMeans,
    pcaCoords,
  };
}
