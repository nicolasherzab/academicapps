import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload,
  BarChart2,
  Brain,
  Download,
  AlertTriangle,
  RefreshCw,
  Database,
  Copy,
  FileCode,
  Layers,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Target,
  DollarSign,
  Package,
  Cpu,
  MessageSquare,
  Shield,
  HelpCircle,
  ChevronRight,
  Code2,
  Briefcase,
} from 'lucide-react';
import {
  ECONOMIC_SECTORS,
  getSampleDataset,
  parseUploadedFile,
  diagnoseDataset,
  imputeAndCleanDataset,
  evaluateOptimalK,
  executeClusteringPipeline,
  CleaningReport,
  ClusteringResult,
  EvaluationMetrics,
  ImputationStrategy,
} from './utils/mlClustering';
import {
  generateStandaloneHTMLReport,
  StrategyResponse,
} from './utils/htmlExporter';
import {
  PYTHON_APP_CODE,
  PYTHON_REQUIREMENTS,
} from './utils/pythonCodeExport';

export default function App() {
  // Navigation / Phase tabs
  const [activeTab, setActiveTab] = useState<'app' | 'python_code'>('app');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Phase 1: Data & Sector
  const [sector, setSector] = useState<string>(ECONOMIC_SECTORS[0]);
  const [rawDataset, setRawDataset] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState<string>('Dataset Demo (Retail)');
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);

  // Phase 2: EDA & Imputation
  const [cleaningReport, setCleaningReport] = useState<CleaningReport | null>(null);
  const [imputationMethod, setImputationMethod] = useState<ImputationStrategy>('mean');
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [cleanedData, setCleanedData] = useState<Record<string, any>[]>([]);
  const [selectedEdaVar, setSelectedEdaVar] = useState<string>('');

  // Phase 3: Clustering
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [algorithm, setAlgorithm] = useState<'K-Means' | 'K-Medoids (PAM)'>('K-Means');
  const [distanceMetric, setDistanceMetric] = useState<'Euclidiana' | 'Manhattan (L1)'>('Euclidiana');
  const [scalingMethod, setScalingMethod] = useState<'StandardScaler (Z-Score)' | 'MinMaxScaler' | 'Sin Escalado'>('StandardScaler (Z-Score)');
  const [evalMetrics, setEvalMetrics] = useState<EvaluationMetrics | null>(null);
  const [isEvaluatingK, setIsEvaluatingK] = useState<boolean>(false);
  const [kSelectionMethod, setKSelectionMethod] = useState<'elbow' | 'silhouette' | 'business'>('silhouette');
  const [selectedK, setSelectedK] = useState<number>(3);
  const [businessRationale, setBusinessRationale] = useState<string>('Estructura organizativa de 3 células comerciales para atención diferenciada.');
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);

  // Phase 4: Gemini AI Strategy
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [strategyResponse, setStrategyResponse] = useState<StrategyResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Code Tab UI
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Initialize with realistic retail dataset
  useEffect(() => {
    const defaultData = getSampleDataset('Retail & Comercio Minorista');
    setRawDataset(defaultData);
    const diagnosis = diagnoseDataset(defaultData);
    setCleaningReport(diagnosis);

    // Initial clean data
    const { cleanedData: initialCleaned } = imputeAndCleanDataset(defaultData, diagnosis, 'mean', true);
    setCleanedData(initialCleaned);

    const numericCols = diagnosis.columns.filter((c) => c.type === 'numeric').map((c) => c.name);
    setSelectedFeatures(numericCols.slice(0, 5));
    if (numericCols.length > 0) {
      setSelectedEdaVar(numericCols[0]);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoadingFile(true);
      const parsed = await parseUploadedFile(file);
      if (parsed.length === 0) {
        alert('El archivo no contiene filas válidas.');
        return;
      }
      setFileName(file.name);
      setRawDataset(parsed);
      const diagnosis = diagnoseDataset(parsed);
      setCleaningReport(diagnosis);

      const { cleanedData: initialCleaned } = imputeAndCleanDataset(parsed, diagnosis, imputationMethod, removeDuplicates);
      setCleanedData(initialCleaned);

      const numCols = diagnosis.columns.filter((c) => c.type === 'numeric').map((c) => c.name);
      setSelectedFeatures(numCols.slice(0, 5));
      if (numCols.length > 0) setSelectedEdaVar(numCols[0]);

      // Reset downstream outputs
      setEvalMetrics(null);
      setClusteringResult(null);
      setStrategyResponse(null);
      setCurrentStep(1);
    } catch (err: any) {
      alert(`Error al procesar el archivo: ${err.message || 'Formato inválido'}`);
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Load sample dataset by sector
  const handleLoadSample = (chosenSector: string) => {
    setSector(chosenSector);
    const data = getSampleDataset(chosenSector);
    setRawDataset(data);
    setFileName(`Dataset Demo (${chosenSector.split('&')[0].trim()})`);
    const diagnosis = diagnoseDataset(data);
    setCleaningReport(diagnosis);

    const { cleanedData: clean } = imputeAndCleanDataset(data, diagnosis, imputationMethod, removeDuplicates);
    setCleanedData(clean);

    const numCols = diagnosis.columns.filter((c) => c.type === 'numeric').map((c) => c.name);
    setSelectedFeatures(numCols.slice(0, 5));
    if (numCols.length > 0) setSelectedEdaVar(numCols[0]);

    setEvalMetrics(null);
    setClusteringResult(null);
    setStrategyResponse(null);
  };

  // Trigger imputation
  const handleApplyCleaning = () => {
    if (!cleaningReport) return;
    const { cleanedData: clean } = imputeAndCleanDataset(rawDataset, cleaningReport, imputationMethod, removeDuplicates);
    setCleanedData(clean);
    // Refresh diagnosis for cleaned data
    const updatedDiag = diagnoseDataset(clean);
    setCleaningReport(updatedDiag);
    setEvalMetrics(null);
    setClusteringResult(null);
    setStrategyResponse(null);
  };

  // Compute Optimal K
  const handleComputeOptimalK = () => {
    if (selectedFeatures.length < 2 || cleanedData.length === 0) return;
    setIsEvaluatingK(true);
    setTimeout(() => {
      try {
        const rawMatrix = cleanedData.map((row) =>
          selectedFeatures.map((f) => {
            const v = Number(row[f]);
            return isNaN(v) ? 0 : v;
          })
        );
        const { scaleMatrix } = require('./utils/mlClustering');
        const { scaled } = scaleMatrix(rawMatrix, scalingMethod);
        const metrics = evaluateOptimalK(scaled, algorithm, distanceMetric);
        setEvalMetrics(metrics);

        if (kSelectionMethod === 'silhouette') {
          setSelectedK(metrics.recommendedKBySilhouette);
        } else if (kSelectionMethod === 'elbow') {
          setSelectedK(metrics.recommendedKByElbow);
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        setIsEvaluatingK(false);
      }
    }, 150);
  };

  // Run Clustering
  const handleExecuteClustering = () => {
    if (selectedFeatures.length < 2 || cleanedData.length === 0) return;
    const result = executeClusteringPipeline(
      cleanedData,
      selectedFeatures,
      selectedK,
      algorithm,
      distanceMetric,
      scalingMethod
    );
    setClusteringResult(result);
    setStrategyResponse(null);
    setCurrentStep(4);
  };

  // Call Gemini for Profile and 5 Pillars
  const handleGenerateGeminiStrategy = async () => {
    if (!clusteringResult) return;
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const response = await fetch('/api/gemini/profile-and-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector,
          algorithm: clusteringResult.algorithm,
          distanceMetric: clusteringResult.distanceMetric,
          featuresUsed: clusteringResult.featuresUsed,
          totalRows: cleanedData.length,
          clusters: clusteringResult.centroids.map((c) => ({
            clusterId: c.clusterId,
            size: c.size,
            percentage: c.percentage,
            centroidFeatures: c.unscaledCentroid,
            deviationsFromMeanPct: Object.fromEntries(
              Object.entries(c.deviationsFromMean).map(([k, v]) => [k, `${v.diffPct}%`])
            ),
          })),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Fallo en la llamada a Gemini');
      }

      const data: StrategyResponse = await response.json();
      setStrategyResponse(data);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Error al comunicarse con la API de Google Gemini.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Export HTML Report
  const handleDownloadHTML = () => {
    if (!clusteringResult || !cleaningReport) return;
    const html = generateStandaloneHTMLReport({
      sector,
      cleaningReport,
      imputationStrategy: imputationMethod,
      clusteringResult,
      strategyResponse,
      businessRationale,
      selectionMethod: kSelectionMethod,
    });

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ClustIQ_Dossier_${sector.replace(/[^a-zA-Z0-9]/g, '_')}_k${clusteringResult.k}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy Python Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_APP_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Download app.py
  const handleDownloadPython = () => {
    const blob = new Blob([PYTHON_APP_CODE], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'app.py';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Descriptive stats of the selected EDA variable
  const selectedEdaStats = useMemo(() => {
    if (!cleaningReport || !selectedEdaVar) return null;
    return cleaningReport.columns.find((c) => c.name === selectedEdaVar);
  }, [cleaningReport, selectedEdaVar]);

  // Histogram bins for EDA
  const histogramBins = useMemo(() => {
    if (!selectedEdaStats || selectedEdaStats.min === undefined || selectedEdaStats.max === undefined) return [];
    const vals = cleanedData.map((r) => Number(r[selectedEdaVar])).filter((v) => !isNaN(v));
    if (vals.length === 0) return [];

    const min = selectedEdaStats.min;
    const max = selectedEdaStats.max;
    const binCount = 10;
    const step = (max - min) / binCount || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * step).toFixed(0)} - ${(min + (i + 1) * step).toFixed(0)}`,
      count: 0,
    }));

    vals.forEach((v) => {
      let bIdx = Math.floor((v - min) / step);
      if (bIdx >= binCount) bIdx = binCount - 1;
      if (bIdx < 0) bIdx = 0;
      bins[bIdx].count++;
    });

    const maxCount = Math.max(...bins.map((b) => b.count), 1);
    return bins.map((b) => ({ ...b, heightPct: (b.count / maxCount) * 100 }));
  }, [cleanedData, selectedEdaStats, selectedEdaVar]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">ClustIQ</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-medium">
                ML &amp; Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Data Science • Clustering No Supervisado • Estrategia de 5 Pilares
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('app')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'app'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Aplicación Interactiva (Live)
          </button>
          <button
            onClick={() => setActiveTab('python_code')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'python_code'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Código Python Streamlit (app.py)
          </button>
        </div>
      </header>

      {/* Main Container */}
      {activeTab === 'app' ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          {/* Workflow Stepper */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between overflow-x-auto pb-2 sm:pb-0 gap-2">
              {[
                { step: 1, title: 'Fase 1: Ingestión', desc: 'Carga & Sector' },
                { step: 2, title: 'Fase 2: Preproceso', desc: 'Limpieza & EDA' },
                { step: 3, title: 'Fase 3: Clustering', desc: 'K-Means & Centroides' },
                { step: 4, title: 'Fase 4: Gemini IA', desc: '5 Pilares de Negocio' },
                { step: 5, title: 'Fase 5: Exportación', desc: 'Dossier HTML' },
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={() => setCurrentStep(item.step)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all flex-shrink-0 text-left ${
                    currentStep === item.step
                      ? 'bg-indigo-600/20 border border-indigo-500/50 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      currentStep === item.step
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                        : currentStep > item.step
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {currentStep > item.step ? '✓' : item.step}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{item.title}</div>
                    <div className="text-[10px] text-slate-400">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1: INGESTIÓN Y EXPLORACIÓN */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Sector Selector & Upload */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Upload className="w-5 h-5 text-indigo-400" />
                        1. Carga de Archivos Multiformato
                      </h2>
                      <p className="text-xs text-slate-400">
                        Formatos soportados: <strong>CSV, TXT, XLS y XLSX</strong>.
                      </p>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                      Archivo actual: <strong>{fileName}</strong>
                    </span>
                  </div>

                  {/* Drop area */}
                  <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40 group">
                    <input
                      type="file"
                      accept=".csv,.txt,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isLoadingFile}
                    />
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      {isLoadingFile ? 'Procesando archivo...' : 'Arrastra o haz clic para subir tu dataset'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Soporta hojas de cálculo de Excel (.xlsx, .xls) y archivos de texto (.csv, .txt)</p>
                  </label>

                  {/* Quick sample datasets */}
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-400" />
                      O prueba con un dataset de negocio precargado:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleLoadSample('Retail & Comercio Minorista')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-900/40 text-slate-200 hover:text-indigo-300 border border-slate-700 transition"
                      >
                        🛍️ Retail (RFM &amp; Ticket)
                      </button>
                      <button
                        onClick={() => handleLoadSample('SaaS, Software & Tecnología B2B')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-900/40 text-slate-200 hover:text-indigo-300 border border-slate-700 transition"
                      >
                        💻 SaaS (MRR &amp; Adopción)
                      </button>
                      <button
                        onClick={() => handleLoadSample('Banca, Finanzas & Seguros')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-900/40 text-slate-200 hover:text-indigo-300 border border-slate-700 transition"
                      >
                        💳 Banca (Consumo &amp; Score)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sector Económico (Req 2) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-400" />
                        2. Sector Económico
                      </h2>
                      <p className="text-xs text-slate-400">
                        La IA utilizará este sector para asignar nombres comerciales y formular los 5 pilares estratégicos.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-300">Selecciona el Sector de tu Negocio:</label>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        {ECONOMIC_SECTORS.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed">
                      💡 <strong>Contexto empresarial:</strong> El modelo de Gemini ajustará el benchmarking y las recomendaciones operativas al ecosistema de <strong>{sector}</strong>.
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                  >
                    Continuar al Diagnóstico y Preprocesamiento
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dataframe Head (Req 2) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    Vista Previa del Dataframe (Primeras 5 Filas - Head)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Total registros cargados: <strong>{rawDataset.length}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                        {rawDataset[0] &&
                          Object.keys(rawDataset[0]).map((col) => (
                            <th key={col} className="p-3 font-semibold whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {rawDataset.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {Object.keys(row).map((k) => (
                            <td key={k} className="p-3 text-slate-200 whitespace-nowrap">
                              {row[k] === null || row[k] === undefined ? (
                                <span className="text-amber-400 font-sans italic bg-amber-500/10 px-1.5 py-0.5 rounded">
                                  NaN
                                </span>
                              ) : typeof row[k] === 'number' ? (
                                row[k].toLocaleString()
                              ) : (
                                String(row[k])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen de Tipos de Variables (Req 3) */}
              {cleaningReport && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    3. Resumen y Clasificación de Variables (Dtypes)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {cleaningReport.columns.map((col) => (
                      <div
                        key={col.name}
                        className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs text-white truncate max-w-[150px]">
                              {col.name}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                col.type === 'numeric'
                                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                  : col.type === 'categorical'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  : col.type === 'id'
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              {col.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Valores únicos: <strong className="text-slate-200">{col.distinctCount}</strong>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Nulos:</span>
                          <span className={col.nullCount > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                            {col.nullCount} ({col.nullPercentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREPROCESAMIENTO Y EDA */}
          {currentStep === 2 && cleaningReport && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Diagnóstico de Calidad (Req 4) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
                  <span className="text-xs text-slate-400 uppercase font-medium">Total de Registros</span>
                  <span className="text-2xl font-black text-white mt-1">
                    {cleaningReport.totalRows.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">{cleaningReport.totalColumns} variables analizadas</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
                  <span className="text-xs text-slate-400 uppercase font-medium">Filas Duplicadas</span>
                  <span
                    className={`text-2xl font-black mt-1 ${
                      cleaningReport.duplicateRows > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {cleaningReport.duplicateRows}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">Identificadas por firma de fila</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
                  <span className="text-xs text-slate-400 uppercase font-medium">Celdas Faltantes (Nulos)</span>
                  <span
                    className={`text-2xl font-black mt-1 ${
                      cleaningReport.totalMissingCells > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {cleaningReport.totalMissingCells}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    {cleaningReport.missingPercentage}% del total de celdas
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
                  <span className="text-xs text-slate-400 uppercase font-medium">Atípicos / Outliers (IQR)</span>
                  <span
                    className={`text-2xl font-black mt-1 ${
                      cleaningReport.totalOutliers > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {cleaningReport.totalOutliers}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">Detección Q1 - 1.5*IQR | Q3 + 1.5*IQR</span>
                </div>
              </div>

              {/* Imputación Automatizada (Req 5) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-md font-bold text-white flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-indigo-400" />
                      5. Estrategia de Imputación y Limpieza Automatizada
                    </h3>
                    <p className="text-xs text-slate-400">
                      Selecciona la regla estadística para reemplazar valores faltantes antes de alimentar los algoritmos de clustering.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Método para Variables Numéricas:
                    </label>
                    <select
                      value={imputationMethod}
                      onChange={(e) => setImputationMethod(e.target.value as ImputationStrategy)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="mean">Media Aritmética (Recomendado para distribuciones simétricas)</option>
                      <option value="median">Mediana (Robusto frente a valores atípicos)</option>
                      <option value="mode">Moda (Frecuencia más repetida)</option>
                      <option value="drop">Eliminar filas con nulos (Listwise Deletion)</option>
                      <option value="constant">Valor Constante (Cero / Cero Absoluto)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="remDup"
                      checked={removeDuplicates}
                      onChange={(e) => setRemoveDuplicates(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                    />
                    <label htmlFor="remDup" className="text-xs text-slate-300 cursor-pointer font-medium">
                      Eliminar automáticamente filas duplicadas ({cleaningReport.duplicateRows} encontradas)
                    </label>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleApplyCleaning}
                      className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Ejecutar Limpieza e Imputación
                    </button>
                  </div>
                </div>
              </div>

              {/* Análisis Descriptivo Visual (Req 6) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-md font-bold text-white flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-cyan-400" />
                      6. Análisis Descriptivo Visual y Reglas de Negocio
                    </h3>
                    <p className="text-xs text-slate-400">
                      Explora distribuciones, valores extremos, rangos mínimos/máximos y patrones de correlación.
                    </p>
                  </div>

                  {/* Selector de variable para histograma */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Variable analizada:</span>
                    <select
                      value={selectedEdaVar}
                      onChange={(e) => setSelectedEdaVar(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {cleaningReport.columns
                        .filter((c) => c.type === 'numeric')
                        .map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Selected variable metrics card */}
                {selectedEdaStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Mínimo</div>
                      <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
                        {selectedEdaStats.min?.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Media (Promedio)</div>
                      <div className="text-sm font-bold text-indigo-400 mt-1 font-mono">
                        {selectedEdaStats.mean?.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Mediana (Q50)</div>
                      <div className="text-sm font-bold text-cyan-400 mt-1 font-mono">
                        {selectedEdaStats.median?.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Máximo</div>
                      <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
                        {selectedEdaStats.max?.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Desv. Estándar (σ)</div>
                      <div className="text-sm font-bold text-slate-300 mt-1 font-mono">
                        {selectedEdaStats.std?.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Outliers Detectados</div>
                      <div className="text-sm font-bold text-rose-400 mt-1 font-mono">
                        {selectedEdaStats.outliersIqrCount}
                      </div>
                    </div>
                  </div>
                )}

                {/* Histogram Visualizer */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                  <div className="text-xs font-semibold text-slate-300 mb-4 flex items-center justify-between">
                    <span>Histograma de Frecuencias: {selectedEdaVar}</span>
                    <span className="text-[10px] text-slate-500">10 intervalos calculados dinámicamente</span>
                  </div>

                  <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
                    {histogramBins.map((bin, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                          {bin.range}: <strong>{bin.count}</strong> registros
                        </div>
                        <div
                          style={{ height: `${Math.max(bin.heightPct, 4)}%` }}
                          className="w-full bg-indigo-500 group-hover:bg-cyan-400 rounded-t transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1">
                    <span>Mín: {selectedEdaStats?.min?.toLocaleString()}</span>
                    <span>Mediana: {selectedEdaStats?.median?.toLocaleString()}</span>
                    <span>Máx: {selectedEdaStats?.max?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                  >
                    Avanzar a la Fase de Clustering
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SEGMENTACIÓN (CLUSTERING) */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Algoritmo y Variables */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  8 y 9. Configuración del Algoritmo de Clustering y Distancia
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Algoritmo y Distancia (Req 9) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">Algoritmo &amp; Métrica:</label>
                    <select
                      value={`${algorithm}|${distanceMetric}`}
                      onChange={(e) => {
                        const [alg, dist] = e.target.value.split('|');
                        setAlgorithm(alg as any);
                        setDistanceMetric(dist as any);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="K-Means|Euclidiana">K-Means Clásico (Distancia Euclidiana L2)</option>
                      <option value="K-Medoids (PAM)|Manhattan (L1)">K-Medoids / PAM (Distancia Manhattan L1 - Robusto)</option>
                      <option value="K-Medoids (PAM)|Euclidiana">K-Medoids / PAM (Distancia Euclidiana)</option>
                    </select>
                    <span className="text-[11px] text-slate-400">
                      PAM utiliza puntos reales como centroides y reduce la sensibilidad a outliers.
                    </span>
                  </div>

                  {/* Escalado */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">Normalización / Escalado:</label>
                    <select
                      value={scalingMethod}
                      onChange={(e) => setScalingMethod(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="StandardScaler (Z-Score)">StandardScaler (Z-Score: Media 0, Varianza 1)</option>
                      <option value="MinMaxScaler">MinMaxScaler (Rango 0 a 1)</option>
                      <option value="Sin Escalado">Sin Escalado (Unidades naturales)</option>
                    </select>
                    <span className="text-[11px] text-slate-400">
                      El escalado evita que magnitudes numéricas grandes dominen las distancias.
                    </span>
                  </div>

                  {/* Feature selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">Variables Activas ({selectedFeatures.length}):</label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                      {cleaningReport?.columns
                        .filter((c) => c.type === 'numeric')
                        .map((c) => {
                          const isChecked = selectedFeatures.includes(c.name);
                          return (
                            <button
                              key={c.name}
                              onClick={() => {
                                if (isChecked) {
                                  if (selectedFeatures.length > 2) {
                                    setSelectedFeatures(selectedFeatures.filter((f) => f !== c.name));
                                  }
                                } else {
                                  setSelectedFeatures([...selectedFeatures, c.name]);
                                }
                              }}
                              className={`text-[10px] px-2 py-1 rounded-lg font-medium transition ${
                                isChecked
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {c.name} {isChecked ? '✓' : '+'}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Evaluar K Óptimo Button */}
                <div className="pt-2 flex justify-start">
                  <button
                    onClick={handleComputeOptimalK}
                    disabled={isEvaluatingK}
                    className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center gap-2 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isEvaluatingK ? 'Evaluando k=2..8...' : 'Calcular Método del Codo y Silueta (k=2..8)'}
                  </button>
                </div>
              </div>

              {/* Evaluación de K Óptimo (Req 7) */}
              {evalMetrics && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-md font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        7. Definición del Número Óptimo de Clusters (k)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Comparación cuantitativa entre la inercia (Elbow) y la separación de grupos (Silhouette).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-medium">
                        Codo sugerido: <strong>k={evalMetrics.recommendedKByElbow}</strong>
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium">
                        Silueta sugerida: <strong>k={evalMetrics.recommendedKBySilhouette}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Comparison Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Elbow Chart */}
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                        <span>Método del Codo (Inercia WCSS)</span>
                        <span className="text-[10px] text-slate-500">Menor = mayor cohesión interna</span>
                      </div>
                      <div className="h-32 flex items-end gap-2 pt-4 px-2 border-b border-slate-800">
                        {evalMetrics.kValues.map((k, i) => {
                          const maxW = Math.max(...evalMetrics.wcssList);
                          const hPct = (evalMetrics.wcssList[i] / maxW) * 100;
                          return (
                            <div key={k} className="flex-1 flex flex-col items-center justify-end group">
                              <div className="text-[9px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {evalMetrics.wcssList[i]}
                              </div>
                              <div
                                style={{ height: `${Math.max(hPct, 8)}%` }}
                                className={`w-full rounded-t transition-all ${
                                  k === evalMetrics.recommendedKByElbow
                                    ? 'bg-indigo-500'
                                    : 'bg-slate-700 group-hover:bg-indigo-400'
                                }`}
                              />
                              <div className="text-[10px] font-bold text-slate-400 mt-1">k={k}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Silhouette Chart */}
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                        <span>Coeficiente de Silueta (-1 a +1)</span>
                        <span className="text-[10px] text-slate-500">Mayor = mejor separación inter-cluster</span>
                      </div>
                      <div className="h-32 flex items-end gap-2 pt-4 px-2 border-b border-slate-800">
                        {evalMetrics.kValues.map((k, i) => {
                          const maxS = Math.max(...evalMetrics.silhouetteList, 0.01);
                          const hPct = Math.max((evalMetrics.silhouetteList[i] / maxS) * 100, 5);
                          return (
                            <div key={k} className="flex-1 flex flex-col items-center justify-end group">
                              <div className="text-[9px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {evalMetrics.silhouetteList[i]}
                              </div>
                              <div
                                style={{ height: `${hPct}%` }}
                                className={`w-full rounded-t transition-all ${
                                  k === evalMetrics.recommendedKBySilhouette
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-700 group-hover:bg-emerald-400'
                                }`}
                              />
                              <div className="text-[10px] font-bold text-slate-400 mt-1">k={k}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* K Selection Mechanism (Elbow, Silueta o Criterio de Negocio) */}
                  <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-3">
                    <span className="text-xs font-semibold text-slate-200">
                      Selecciona el criterio para fijar el número definitivo de clusters (k):
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                          kSelectionMethod === 'silhouette'
                            ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="kMethod"
                          checked={kSelectionMethod === 'silhouette'}
                          onChange={() => {
                            setKSelectionMethod('silhouette');
                            setSelectedK(evalMetrics.recommendedKBySilhouette);
                          }}
                          className="mt-0.5 text-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-bold">1. Máxima Silueta ({evalMetrics.recommendedKBySilhouette})</div>
                          <div className="text-[10px] opacity-80">Óptima separación matemática entre grupos.</div>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                          kSelectionMethod === 'elbow'
                            ? 'bg-indigo-950/30 border-indigo-500/60 text-indigo-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="kMethod"
                          checked={kSelectionMethod === 'elbow'}
                          onChange={() => {
                            setKSelectionMethod('elbow');
                            setSelectedK(evalMetrics.recommendedKByElbow);
                          }}
                          className="mt-0.5 text-indigo-500"
                        />
                        <div>
                          <div className="text-xs font-bold">2. Método del Codo ({evalMetrics.recommendedKByElbow})</div>
                          <div className="text-[10px] opacity-80">Punto de mayor inflexión de inercia WCSS.</div>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                          kSelectionMethod === 'business'
                            ? 'bg-cyan-950/30 border-cyan-500/60 text-cyan-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="kMethod"
                          checked={kSelectionMethod === 'business'}
                          onChange={() => setKSelectionMethod('business')}
                          className="mt-0.5 text-cyan-500"
                        />
                        <div>
                          <div className="text-xs font-bold">3. Criterio de Negocio Manual</div>
                          <div className="text-[10px] opacity-80">Elegir k y fundamentar con regla estratégica.</div>
                        </div>
                      </label>
                    </div>

                    {kSelectionMethod === 'business' && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">k deseado (2 a 8):</label>
                          <input
                            type="number"
                            min={2}
                            max={8}
                            value={selectedK}
                            onChange={(e) => setSelectedK(Math.max(2, Math.min(8, Number(e.target.value))))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Justificación de Negocio / Regla Operativa:
                          </label>
                          <input
                            type="text"
                            value={businessRationale}
                            onChange={(e) => setBusinessRationale(e.target.value)}
                            placeholder="Ej. La empresa cuenta con 3 equipos comerciales especializados..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Run button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleExecuteClustering}
                      className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition"
                    >
                      <Brain className="w-4 h-4" />
                      Entrenar Modelo ({algorithm} con k={selectedK})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: RESULTADOS, CENTROIDES Y ESTRATEGIA GEMINI */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {!clusteringResult ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Modelo aún no ejecutado</h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    Regresa a la Fase 3 para seleccionar las variables y correr el algoritmo de segmentación.
                  </p>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="mt-2 py-2 px-4 rounded-xl bg-indigo-600 text-xs font-semibold text-white"
                  >
                    Ir a la Fase 3
                  </button>
                </div>
              ) : (
                <>
                  {/* Model Summary banner */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                            {clusteringResult.algorithm}
                          </span>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">
                            Métrica: {clusteringResult.distanceMetric}
                          </span>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">
                            k = {clusteringResult.k} clusters
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-white mt-1.5">
                          Segmentación Completada • Sector: {sector}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGenerateGeminiStrategy}
                          disabled={isGeneratingAi}
                          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4 text-cyan-300" />
                          {isGeneratingAi ? 'Gemini Analizando Centroides...' : 'Generar Estrategia con Google Gemini'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Centroids Table (Req 10) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-md font-bold text-white flex items-center gap-2">
                          <Target className="w-4 h-4 text-cyan-400" />
                          10. Características Matemáticas de los Centroides (Valores Absolutos y Desviación vs Media)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Comportamiento de cada segmento en escala natural de negocio y diferencia relativa porcentual respecto a la población total.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                            <th className="p-3 font-semibold">Cluster</th>
                            <th className="p-3 font-semibold">Población (n / %)</th>
                            {clusteringResult.featuresUsed.map((feat) => (
                              <th key={feat} className="p-3 font-semibold text-right">
                                {feat}
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  μ={clusteringResult.globalMeans[feat]}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono">
                          {clusteringResult.centroids.map((c) => (
                            <tr key={c.clusterId} className="hover:bg-slate-800/30">
                              <td className="p-3 font-bold text-indigo-300 font-sans">Cluster #{c.clusterId}</td>
                              <td className="p-3 font-sans text-slate-300">
                                {c.size} ({c.percentage}%)
                              </td>
                              {clusteringResult.featuresUsed.map((feat) => {
                                const val = c.unscaledCentroid[feat];
                                const dev = c.deviationsFromMean[feat];
                                return (
                                  <td key={feat} className="p-3 text-right">
                                    <div className="font-semibold text-slate-100">{val?.toLocaleString()}</div>
                                    <div
                                      className={`text-[10px] ${
                                        dev?.diffPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                      }`}
                                    >
                                      {dev?.diffPct >= 0 ? `+${dev.diffPct}%` : `${dev.diffPct}%`}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PCA 2D Scatter Plot */}
                  {clusteringResult.pcaCoords && clusteringResult.pcaCoords.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-md font-bold text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-400" />
                            Visualización de Clusters en Espacio Reducido (PCA 2D)
                          </h3>
                          <p className="text-xs text-slate-400">
                            Proyección de las variables en los dos componentes principales más informativos.
                          </p>
                        </div>
                      </div>

                      <div className="h-64 bg-slate-950 rounded-xl border border-slate-800 p-4 relative overflow-hidden flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 500 240">
                          {/* Grid lines */}
                          <line x1="0" y1="120" x2="500" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                          <line x1="250" y1="0" x2="250" y2="240" stroke="#1e293b" strokeDasharray="3 3" />

                          {/* Scatter dots */}
                          {clusteringResult.pcaCoords.map((pt, i) => {
                            // Map coords into 500x240 viewBox
                            const cx = Math.max(10, Math.min(490, 250 + pt.x * 25));
                            const cy = Math.max(10, Math.min(230, 120 - pt.y * 25));
                            const clusterColors = [
                              '#6366f1',
                              '#10b981',
                              '#f59e0b',
                              '#ec4899',
                              '#06b6d4',
                              '#8b5cf6',
                              '#f97316',
                              '#14b8a6',
                            ];
                            const color = clusterColors[pt.cluster % clusterColors.length];
                            return (
                              <circle
                                key={i}
                                cx={cx}
                                cy={cy}
                                r="3.5"
                                fill={color}
                                opacity="0.75"
                                className="transition-all hover:r-6 hover:opacity-100"
                              />
                            );
                          })}
                        </svg>

                        {/* Legend */}
                        <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2 flex flex-col gap-1 text-[10px]">
                          {clusteringResult.centroids.map((c) => {
                            const clusterColors = [
                              '#6366f1',
                              '#10b981',
                              '#f59e0b',
                              '#ec4899',
                              '#06b6d4',
                              '#8b5cf6',
                              '#f97316',
                              '#14b8a6',
                            ];
                            return (
                              <div key={c.clusterId} className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: clusterColors[(c.clusterId - 1) % clusterColors.length] }}
                                />
                                <span className="text-slate-300">Cluster {c.clusterId}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Profiling & 5 Strategic Pillars (Req 11, 12) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-md font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-400" />
                          11 y 12. Perfilamiento con Google Gemini y Estrategia en 5 Pilares
                        </h3>
                        <p className="text-xs text-slate-400">
                          Nombres comerciales adaptados al sector <strong>{sector}</strong> y plan de acción táctico.
                        </p>
                      </div>

                      {!strategyResponse && (
                        <button
                          onClick={handleGenerateGeminiStrategy}
                          disabled={isGeneratingAi}
                          className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition disabled:opacity-50"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          {isGeneratingAi ? 'Procesando con Gemini...' : 'Activar Inteligencia Artificial'}
                        </button>
                      )}
                    </div>

                    {aiError && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{aiError}</span>
                      </div>
                    )}

                    {isGeneratingAi && (
                      <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-semibold text-indigo-300">
                          Gemini 3.8 Flash está evaluando las diferencias de centroides y elaborando los 5 pilares estratégicos...
                        </span>
                      </div>
                    )}

                    {strategyResponse && (
                      <div className="flex flex-col gap-6">
                        {/* Executive Summary */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30">
                          <h4 className="text-xs font-bold uppercase text-indigo-300 tracking-wider mb-2 flex items-center gap-1.5">
                            <Brain className="w-3.5 h-3.5" />
                            Resumen Ejecutivo para el Comité de Dirección
                          </h4>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {strategyResponse.executiveSummary}
                          </p>
                        </div>

                        {/* Cluster Strategic Cards */}
                        <div className="flex flex-col gap-5">
                          {strategyResponse.clusterStrategies.map((cs) => {
                            const centroidMatch = clusteringResult.centroids.find((c) => c.clusterId === cs.clusterId);
                            return (
                              <div
                                key={cs.clusterId}
                                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg hover:border-slate-700 transition"
                              >
                                <div className="flex items-start justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white">
                                        Cluster {cs.clusterId}
                                      </span>
                                      <h4 className="text-base font-bold text-white">{cs.commercialName}</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                                      {cs.archetypeDescription}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase ${
                                        cs.priority.toLowerCase().includes('alta') ||
                                        cs.priority.toLowerCase().includes('crítica')
                                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      }`}
                                    >
                                      Prioridad: {cs.priority}
                                    </span>
                                    {centroidMatch && (
                                      <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
                                        👥 {centroidMatch.size} ({centroidMatch.percentage}%)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 5 Strategic Pillars Grid (Req 12) */}
                                <div>
                                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                                    Propuesta Estratégica Integral (5 Pilares de Negocio)
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-1.5">
                                      <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5" />
                                        1. Producto
                                      </div>
                                      <p className="text-xs text-slate-300 leading-relaxed">{cs.pillars.producto}</p>
                                    </div>

                                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-1.5">
                                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        2. Precio &amp; Pricing
                                      </div>
                                      <p className="text-xs text-slate-300 leading-relaxed">{cs.pillars.precio}</p>
                                    </div>

                                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-1.5">
                                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                        <Cpu className="w-3.5 h-3.5" />
                                        3. Innovación
                                      </div>
                                      <p className="text-xs text-slate-300 leading-relaxed">{cs.pillars.innovacion}</p>
                                    </div>

                                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-1.5">
                                      <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        4. Comunicación
                                      </div>
                                      <p className="text-xs text-slate-300 leading-relaxed">{cs.pillars.comunicacion}</p>
                                    </div>

                                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-1.5">
                                      <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5" />
                                        5. Rentabilidad
                                      </div>
                                      <p className="text-xs text-slate-300 leading-relaxed">{cs.pillars.rentabilidad}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* KPI and Quick Win */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                                  <div className="flex items-center gap-2 bg-indigo-950/40 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>
                                      <strong>KPI Principal:</strong> {cs.primaryKpi}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 bg-emerald-950/40 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>
                                      <strong>Quick Win (30 días):</strong> {cs.quickWin}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 5 BUTTON */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setCurrentStep(5)}
                      className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition"
                    >
                      Ir a la Fase 5: Exportación de Reporte HTML
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 5: EXPORTACIÓN (Req 13) */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                  <Download className="w-8 h-8 text-white" />
                </div>

                <div className="max-w-xl">
                  <h2 className="text-xl font-bold text-white">
                    13. Exportación de Dossier Ejecutivo en HTML Interactivo
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Genera un documento HTML autónomo y profesional que consolida todo el Análisis Exploratorio (EDA),
                    la auditoría de limpieza e imputación, la matriz de centroides matemáticos y las estrategias de los 5 pilares
                    generadas por Google Gemini.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    onClick={handleDownloadHTML}
                    disabled={!clusteringResult}
                    className="py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Dossier HTML Interactivo (.html)
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left max-w-xl w-full text-xs text-slate-300">
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Características del archivo exportado:
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                    <li>Autocontenido: No requiere servidor ni dependencias externas.</li>
                    <li>Listo para compartir por email o Slack con comités directivos.</li>
                    <li>Optimizado para impresión directa y exportación a PDF (Ctrl + P).</li>
                    <li>Incluye badges de prioridad, KPIs y Quick Wins por segmento.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: PYTHON STREAMLIT CODE & INSTRUCTIONS */
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 animate-fadeIn">
          {/* Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Script Completo Python (Streamlit + Gemini SDK)</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Implementación modular en Python comentada paso a paso que cumple exactamente los 13 requerimientos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedCode ? '¡Copiado!' : 'Copiar app.py'}
              </button>
              <button
                onClick={handleDownloadPython}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar app.py
              </button>
            </div>
          </div>

          {/* Execution guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-indigo-400 mb-1">1. Instalar Dependencias</div>
              <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto border border-slate-800">
pip install -r requirements.txt
              </pre>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-cyan-400 mb-1">2. Configurar Gemini API Key</div>
              <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto border border-slate-800">
export GEMINI_API_KEY="tu_clave"
              </pre>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">3. Ejecutar Streamlit</div>
              <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto border border-slate-800">
streamlit run app.py
              </pre>
            </div>
          </div>

          {/* requirements.txt box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <span>📄 requirements.txt</span>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto border border-slate-800">
              {PYTHON_REQUIREMENTS}
            </pre>
          </div>

          {/* app.py code view */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
              <span>🐍 app.py (Código Fuente Completo)</span>
              <span className="text-[11px] text-slate-500">Python 3.10+ / Streamlit / Scikit-Learn</span>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-200 font-mono overflow-x-auto max-h-[600px] border border-slate-800 leading-relaxed">
              {PYTHON_APP_CODE}
            </pre>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-4 text-center text-xs text-slate-400">
        ClustIQ • Arquitectura de Machine Learning &amp; Estrategia Empresarial impulsada por Google Gemini AI
      </footer>
    </div>
  );
}
