export const PYTHON_APP_CODE = `"""
========================================================================================
CLUSTIQ: SEGMENTACIÓN AVANZADA (CLUSTERING) & PERFILAMIENTO ESTRATÉGICO CON GEMINI AI
Desarrollado con Streamlit, Scikit-Learn, Plotly y Google Gemini SDK (@google/genai)
========================================================================================
Cumple secuencialmente con los 13 requerimientos:
- Fase 1: Carga multiformato (CSV, TXT, XLS, XLSX), Sector Económico, Dtypes
- Fase 2: Diagnóstico de calidad, Imputación automatizada, Visualizaciones descriptivas
- Fase 3: Selección de K óptimo (Elbow, Silueta, Criterio de Negocio), K-Means / K-Medoids, Centroides
- Fase 4: Integración Gemini API para Nombres Comerciales y Estrategia 5 Pilares
- Fase 5: Consolidación y exportación de Reporte HTML interactivo autocontenido
"""

import os
import io
import json
import base64
import numpy as np
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA

# Verificación de librerías opcionales para K-Medoids/PAM
try:
    from sklearn_extra.cluster import KMedoids
    HAS_KMEDOIDS = True
except ImportError:
    HAS_KMEDOIDS = False

# Importación del SDK moderno de Google Gemini
try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

# --------------------------------------------------------------------------------------
# CONFIGURACIÓN GENERAL DE LA PÁGINA (STREAMLIT UX/UI)
# --------------------------------------------------------------------------------------
st.set_page_config(
    page_title="ClustIQ | ML Clustering & Gemini Strategy",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilos CSS personalizados para apariencia ejecutiva
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        color: #1e1b4b;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #4b5563;
        margin-bottom: 1.5rem;
    }
    .stMetric {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px;
    }
    .pillar-box {
        background-color: #f8fafc;
        border-left: 4px solid #4f46e5;
        padding: 12px;
        border-radius: 0 8px 8px 0;
        margin-bottom: 10px;
    }
</style>
""", unsafe_allow_html=True)

# --------------------------------------------------------------------------------------
# SYSTEM PROMPT PARA GOOGLE GEMINI (PERFILAMIENTO Y ESTRATEGIA DE 5 PILARES)
# --------------------------------------------------------------------------------------
GEMINI_SYSTEM_PROMPT = """Eres un Chief Strategy & Data Officer de renombre mundial.
Tu misión es interpretar los centroides matemáticos de un modelo de Clustering no supervisado (K-Means / K-Medoids)
y convertirlos en perfiles comerciales memorables y planes de acción estratégicos hiper-personalizados.

Directrices obligatorias:
1. Adapta rigurosamente el vocabulario y tono al Sector Económico seleccionado por el usuario.
2. Para cada cluster, define:
   - Nombre Comercial / Perfil: Creativo, evocador y profesional (ej. 'Compradores VIP Omnicanal', 'Cazadores Ocasionales de Rebajas').
   - Arquetipo (Buyer Persona): Descripción sintetizada del comportamiento y hábitos inferidos a partir de los centroides.
   - Nivel de Prioridad: Crítica, Alta, Media o Mantener.
   - KPI Principal de Control: Métrica clave (ej. Churn rate, LTV, AOV, Frecuencia).
3. Plan Estratégico Integral en 5 Pilares:
   - Pilar 1: Producto (Catálogo, empaquetado, bundles, características recomendadas).
   - Pilar 2: Precio (Estrategia de pricing, promociones, políticas de descuento, esquemas de valor).
   - Pilar 3: Innovación (Adopción digital, nuevos canales, automatización, experiencias interactivas).
   - Pilar 4: Comunicación (Tono de voz, canales prioritarios de contacto, momentos clave de interacción).
   - Pilar 5: Rentabilidad (Estrategias de retención, mitigación de deserción, incremento del margen o LTV).
4. Quick Win Inmediato: Una acción concreta y ejecutable en los primeros 30 días.
5. Responde estrictamente en formato JSON válido con la estructura solicitada.
"""

# --------------------------------------------------------------------------------------
# FUNCIONES AUXILIARES: CARGA Y PREPROCESAMIENTO
# --------------------------------------------------------------------------------------
@st.cache_data
def load_data(file) -> pd.DataFrame:
    """Carga archivos CSV, TXT, XLS y XLSX en un DataFrame de pandas."""
    name = file.name.lower()
    if name.endswith(".csv"):
        try:
            return pd.read_csv(file)
        except Exception:
            file.seek(0)
            return pd.read_csv(file, sep=";")
    elif name.endswith(".txt"):
        try:
            return pd.read_csv(file, delimiter="\\t")
        except Exception:
            file.seek(0)
            return pd.read_csv(file, delimiter=",")
    elif name.endswith((".xls", ".xlsx")):
        return pd.read_excel(file)
    else:
        st.error("Formato no soportado.")
        return pd.DataFrame()

def generate_sample_dataset() -> pd.DataFrame:
    """Genera dataset sintético de Retail/Clientes para demostración inmediata."""
    np.random.seed(42)
    n = 350
    recency = np.concatenate([np.random.randint(5, 25, 75), np.random.randint(20, 60, 150), np.random.randint(60, 180, 125)])
    frequency = np.concatenate([np.random.randint(15, 40, 75), np.random.randint(6, 15, 150), np.random.randint(1, 5, 125)])
    avg_ticket = np.concatenate([np.random.normal(180, 40, 75), np.random.normal(70, 20, 150), np.random.normal(30, 10, 125)])
    annual_spend = frequency * avg_ticket * np.random.uniform(0.9, 1.1, n)
    returns_pct = np.concatenate([np.random.uniform(2, 6, 75), np.random.uniform(4, 9, 150), np.random.uniform(8, 18, 125)])
    discount_pct = np.concatenate([np.random.uniform(5, 15, 75), np.random.uniform(15, 30, 150), np.random.uniform(35, 60, 125)])

    df = pd.DataFrame({
        "ID_Cliente": [f"CLI-{1000+i}" for i in range(n)],
        "Recencia_Dias": np.maximum(1, recency),
        "Frecuencia_Anual": np.maximum(1, frequency),
        "Gasto_Total_USD": np.round(annual_spend, 2),
        "Ticket_Promedio_USD": np.round(avg_ticket, 2),
        "Tasa_Devolucion_Pct": np.round(returns_pct, 1),
        "Uso_Descuentos_Pct": np.round(discount_pct, 1)
    })
    # Inyectar algunos nulos y duplicados deliberados para ilustrar Fase 2
    df.loc[10:14, "Ticket_Promedio_USD"] = np.nan
    df = pd.concat([df, df.iloc[[0, 5]]], ignore_index=True)
    return df

# --------------------------------------------------------------------------------------
# BARRA LATERAL (SIDEBAR): CONFIGURACIONES Y PARÁMETROS
# --------------------------------------------------------------------------------------
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80", use_container_width=True)
    st.title("ClustIQ Navigator")
    st.markdown("Plataforma End-to-End de Clustering y Estrategia con Gemini AI.")

    # Selección de Sector Económico (Req 2)
    sectores = [
        "Retail & Comercio Minorista",
        "Banca, Finanzas & Seguros",
        "SaaS, Software & Tecnología B2B",
        "Telecomunicaciones & Conectividad",
        "Bienes de Consumo Masivo (CPG / FMCG)",
        "Salud, Farma & Biotecnología",
        "Turismo, Hospitalidad & Viajes",
        "Manufactura & Logística",
        "Educación & EdTech"
    ]
    sector_seleccionado = st.selectbox("1. Sector Económico:", sectores)

    # API Key de Gemini
    api_key_env = os.environ.get("GEMINI_API_KEY", "")
    gemini_api_key = st.text_input("2. Google Gemini API Key:", value=api_key_env, type="password", help="Configura tu clave de Google AI Studio para activar los pasos 11 y 12.")

    st.markdown("---")
    st.subheader("Configuración de Algoritmo")
    algoritmo = st.radio("Algoritmo de Segmentación:", ["K-Means (Euclidiana)", "K-Medoids / PAM (Manhattan)"])
    tipo_escalado = st.selectbox("Escalado de Variables:", ["StandardScaler (Z-Score)", "MinMaxScaler", "Sin Escalado"])

# --------------------------------------------------------------------------------------
# ENCABEZADO PRINCIPAL
# --------------------------------------------------------------------------------------
st.markdown('<div class="main-header">🎯 ClustIQ: Segmentación Analítica & Perfilamiento con IA</div>', unsafe_allow_html=True)
st.markdown(f'<div class="sub-header">Flujo de Machine Learning para toma de decisiones en el sector <strong>{sector_seleccionado}</strong></div>', unsafe_allow_html=True)

# --------------------------------------------------------------------------------------
# FASE 1: CARGA Y EXPLORACIÓN (Req 1, 2, 3)
# --------------------------------------------------------------------------------------
st.header("📂 Fase 1: Carga y Exploración de Datos")

col_upload, col_demo = st.columns([3, 1])
with col_upload:
    uploaded_file = st.file_uploader("Sube un archivo de datos (CSV, TXT, XLS, XLSX):", type=["csv", "txt", "xls", "xlsx"])
with col_demo:
    usar_demo = st.button("Usar Dataset Demo (Retail)")

if uploaded_file is not None:
    df_raw = load_data(uploaded_file)
elif usar_demo or "df_raw" not in st.session_state:
    df_raw = generate_sample_dataset()
    st.session_state["df_raw"] = df_raw
else:
    df_raw = st.session_state["df_raw"]

if df_raw.empty:
    st.warning("Por favor carga un archivo para continuar.")
    st.stop()

# Mostrar Primeras 5 Filas (Head) (Req 2)
st.subheader("1.1 Vista Previa de Datos (Primeras 5 Filas)")
st.dataframe(df_raw.head(5), use_container_width=True)

# Resumen de Tipos de Variables (Req 3)
st.subheader("1.2 Resumen de Tipos de Variables")
col_t1, col_t2 = st.columns([2, 1])
with col_t1:
    resumen_tipos = pd.DataFrame({
        "Columna": df_raw.columns,
        "Tipo de Dato": [str(t) for t in df_raw.dtypes],
        "No Nulos": df_raw.notnull().sum(),
        "Nulos": df_raw.isnull().sum(),
        "Valores Únicos": df_raw.nunique()
    })
    st.dataframe(resumen_tipos, use_container_width=True)
with col_t2:
    tipo_conteo = df_raw.dtypes.value_counts().reset_index()
    tipo_conteo.columns = ["Tipo", "Cantidad"]
    fig_types = px.pie(tipo_conteo, names="Tipo", values="Cantidad", title="Distribución de Tipos de Datos", hole=0.4)
    st.plotly_chart(fig_types, use_container_width=True)

# --------------------------------------------------------------------------------------
# FASE 2: PREPROCESAMIENTO Y ANÁLISIS DESCRIPTIVO (Req 4, 5, 6)
# --------------------------------------------------------------------------------------
st.markdown("---")
st.header("🧹 Fase 2: Preprocesamiento y Análisis Descriptivo (EDA)")

# Diagnóstico de calidad (Req 4)
total_filas = len(df_raw)
duplicados = df_raw.duplicated().sum()
nulos_totales = df_raw.isnull().sum().sum()

# Identificación de outliers vía IQR
cols_numericas = df_raw.select_dtypes(include=[np.number]).columns.tolist()
# Excluir posibles columnas de ID numéricas si existen
cols_numericas = [c for c in cols_numericas if "id" not in c.lower() and "codigo" not in c.lower()]

outliers_por_col = {}
for col in cols_numericas:
    q25 = df_raw[col].quantile(0.25)
    q75 = df_raw[col].quantile(0.75)
    iqr = q75 - q25
    inf = q25 - 1.5 * iqr
    sup = q75 + 1.5 * iqr
    conteo_out = ((df_raw[col] < inf) | (df_raw[col] > sup)).sum()
    outliers_por_col[col] = conteo_out

outliers_totales = sum(outliers_por_col.values())

m1, m2, m3, m4 = st.columns(4)
m1.metric("Total Registros", f"{total_filas:,}")
m2.metric("Filas Duplicadas", f"{duplicados}")
m3.metric("Celdas Faltantes (Nulos)", f"{nulos_totales}")
m4.metric("Atípicos (Outliers IQR)", f"{outliers_totales}")

# Opciones de Imputación Automatizada (Req 5)
st.subheader("2.1 Tratamiento de Nulos y Duplicados")
c_imp1, c_imp2, c_imp3 = st.columns(3)
with c_imp1:
    estrategia_imputacion = st.selectbox(
        "Método de Imputación de Nulos:",
        ["Media (Promedio)", "Mediana", "Moda", "Eliminar filas con nulos", "Valor Cero (0)"]
    )
with c_imp2:
    eliminar_dups = st.checkbox("Eliminar filas duplicadas automáticamente", value=True)
with c_imp3:
    st.write("")
    aplicar_limpieza = st.button("Aplicar Preprocesamiento y Limpieza", type="primary")

df_limpio = df_raw.copy()
if eliminar_dups:
    df_limpio = df_limpio.drop_duplicates()

if estrategia_imputacion == "Eliminar filas con nulos":
    df_limpio = df_limpio.dropna()
elif estrategia_imputacion == "Media (Promedio)":
    for c in cols_numericas:
        df_limpio[c] = df_limpio[c].fillna(df_limpio[c].mean())
elif estrategia_imputacion == "Mediana":
    for c in cols_numericas:
        df_limpio[c] = df_limpio[c].fillna(df_limpio[c].median())
elif estrategia_imputacion == "Moda":
    for c in df_limpio.columns:
        if not df_limpio[c].mode().empty:
            df_limpio[c] = df_limpio[c].fillna(df_limpio[c].mode()[0])
elif estrategia_imputacion == "Valor Cero (0)":
    df_limpio[cols_numericas] = df_limpio[cols_numericas].fillna(0)

st.success(f"Dataset preprocesado con éxito: {len(df_limpio)} filas válidas.")

# Análisis Descriptivo Visual (Req 6)
st.subheader("2.2 Análisis Descriptivo Visual y Reglas de Negocio")
tab_dist, tab_corr, tab_box = st.tabs(["Distribuciones (Histogramas)", "Matriz de Correlación", "Outliers (Boxplots)"])

with tab_dist:
    var_dist = st.selectbox("Selecciona variable para histograma:", cols_numericas)
    fig_hist = px.histogram(
        df_limpio,
        x=var_dist,
        marginal="box",
        title=f"Distribución de {var_dist} (Mín: {df_limpio[var_dist].min():.1f}, Media: {df_limpio[var_dist].mean():.1f}, Máx: {df_limpio[var_dist].max():.1f})",
        color_discrete_sequence=["#4f46e5"]
    )
    st.plotly_chart(fig_hist, use_container_width=True)

with tab_corr:
    if len(cols_numericas) > 1:
        corr_matrix = df_limpio[cols_numericas].corr()
        fig_corr = px.imshow(
            corr_matrix,
            text_auto=".2f",
            aspect="auto",
            color_continuous_scale="RdBu_r",
            title="Matriz de Correlación de Pearson"
        )
        st.plotly_chart(fig_corr, use_container_width=True)

with tab_box:
    fig_box = go.Figure()
    for col in cols_numericas:
        fig_box.add_trace(go.Box(y=df_limpio[col], name=col))
    fig_box.update_layout(title="Identificación Visual de Rangos y Valores Extremos")
    st.plotly_chart(fig_box, use_container_width=True)

# --------------------------------------------------------------------------------------
# FASE 3: SEGMENTACIÓN (CLUSTERING) (Req 7, 8, 9, 10)
# --------------------------------------------------------------------------------------
st.markdown("---")
st.header("🧮 Fase 3: Segmentación No Supervisada (Clustering)")

# Selección de características numéricas para clustering
features_clustering = st.multiselect(
    "Selecciona las variables numéricas a incluir en el modelo:",
    cols_numericas,
    default=cols_numericas[:min(5, len(cols_numericas))]
)

if len(features_clustering) < 2:
    st.warning("Selecciona al menos 2 variables numéricas para entrenar el modelo.")
    st.stop()

# Matriz y escalado
X_raw = df_limpio[features_clustering].values

if tipo_escalado == "StandardScaler (Z-Score)":
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_raw)
elif tipo_escalado == "MinMaxScaler":
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X_raw)
else:
    scaler = None
    X_scaled = X_raw

# Evaluación de K óptimo (Req 7)
st.subheader("3.1 Evaluación del Número Óptimo de Clusters (k)")

k_range = list(range(2, 9))
wcss_list = []
sil_list = []

for k_val in k_range:
    km = KMeans(n_clusters=k_val, init="k-means++", random_state=42, n_init=10)
    km.fit(X_scaled)
    wcss_list.append(km.inertia_)
    sil_list.append(silhouette_score(X_scaled, km.labels_))

col_k1, col_k2 = st.columns(2)
with col_k1:
    fig_elbow = go.Figure()
    fig_elbow.add_trace(go.Scatter(x=k_range, y=wcss_list, mode="lines+markers", line=dict(color="#4f46e5", width=3)))
    fig_elbow.update_layout(title="Método del Codo (Elbow Method / WCSS)", xaxis_title="Número de Clusters (k)", yaxis_title="Inercia (WCSS)")
    st.plotly_chart(fig_elbow, use_container_width=True)

with col_k2:
    fig_sil = go.Figure()
    fig_sil.add_trace(go.Bar(x=k_range, y=sil_list, marker_color="#059669"))
    fig_sil.update_layout(title="Coeficiente de Silueta por k", xaxis_title="Número de Clusters (k)", yaxis_title="Silhouette Score")
    st.plotly_chart(fig_sil, use_container_width=True)

# Mecanismo de selección de K (Elbow, Silueta o Criterio de Negocio)
mejor_k_sil = k_range[np.argmax(sil_list)]
st.markdown("##### Selección de k final:")
metodo_k = st.radio(
    "Fuente de definición de k:",
    ["Sugerido por Coeficiente de Silueta (Matemático)", "Sugerido por Método del Codo", "Criterio de Negocio Manual (Estratégico)"],
    horizontal=True
)

if metodo_k.startswith("Sugerido por Coeficiente"):
    k_elegido = mejor_k_sil
    justificacion_negocio = f"Optimización matemática por máximo Silhouette Score ({max(sil_list):.3f})."
elif metodo_k.startswith("Sugerido por Método"):
    k_elegido = 3
    justificacion_negocio = "Identificación visual del punto de inflexión de inercia (Elbow)."
else:
    c_k1, c_k2 = st.columns([1, 3])
    with c_k1:
        k_elegido = st.slider("Define k manualmente:", min_value=2, max_value=8, value=3)
    with c_k2:
        justificacion_negocio = st.text_input(
            "Justificación Estratégica / Regla de Negocio:",
            value="Estructura operativa de equipos comerciales dividida en 3 segmentos de clientes."
        )

# Ejecución del Modelo Seleccionado (Req 8, 9)
if "PAM" in algoritmo and HAS_KMEDOIDS:
    modelo = KMedoids(n_clusters=k_elegido, metric="manhattan", random_state=42)
else:
    modelo = KMeans(n_clusters=k_elegido, init="k-means++", random_state=42, n_init=10)

labels = modelo.fit_predict(X_scaled)
df_limpio["Cluster"] = labels + 1

# Proyección PCA 2D para visualización del clustering
pca = PCA(n_components=2)
coords_pca = pca.fit_transform(X_scaled)
df_limpio["PC1"] = coords_pca[:, 0]
df_limpio["PC2"] = coords_pca[:, 1]

fig_clusters = px.scatter(
    df_limpio,
    x="PC1",
    y="PC2",
    color=df_limpio["Cluster"].astype(str),
    title=f"Visualización de Clusters en Espacio Reducido PCA (k={k_elegido})",
    color_discrete_sequence=px.colors.qualitative.Bold
)
st.plotly_chart(fig_clusters, use_container_width=True)

# Extracción de Centroides (Req 10)
st.subheader("3.2 Matriz y Características Matemáticas de los Centroides")

# Centroides en escala original de negocio
centroides_originales = df_limpio.groupby("Cluster")[features_clustering].mean()
media_global = df_limpio[features_clustering].mean()

# Desviaciones porcentuales relativas
desv_pct = ((centroides_originales - media_global) / media_global) * 100

col_c1, col_c2 = st.columns(2)
with col_c1:
    st.markdown("**Valores Promedio por Cluster (Centroides):**")
    st.dataframe(centroides_originales.round(2), use_container_width=True)
with col_c2:
    st.markdown("**Diferencia Relativa vs Media Global (%):**")
    st.dataframe(desv_pct.round(1).astype(str) + "%", use_container_width=True)

# Preparación de datos JSON para Gemini
resumen_clusters_para_ia = []
conteo_clusters = df_limpio["Cluster"].value_counts().to_dict()

for c_id in sorted(df_limpio["Cluster"].unique()):
    size = conteo_clusters[c_id]
    pct = round((size / len(df_limpio)) * 100, 1)
    c_features = {}
    for feat in features_clustering:
        c_val = round(float(centroides_originales.loc[c_id, feat]), 2)
        g_val = round(float(media_global[feat]), 2)
        diff_pct = round(float(desv_pct.loc[c_id, feat]), 1)
        c_features[feat] = {
            "valor_cluster": c_val,
            "media_poblacion": g_val,
            "diferencia_pct": diff_pct
        }
    resumen_clusters_para_ia.append({
        "cluster_id": int(c_id),
        "tamaño_n": int(size),
        "porcentaje_poblacion": pct,
        "variables": c_features
    })

# --------------------------------------------------------------------------------------
# FASE 4: PERFILAMIENTO CON IA (GEMINI) Y ESTRATEGIA (Req 11, 12)
# --------------------------------------------------------------------------------------
st.markdown("---")
st.header("🤖 Fase 4: Perfilamiento y Plan Estratégico con Google Gemini")
st.markdown("Envío de centroides matemáticos a Gemini AI para naming de perfil y estrategia en 5 pilares.")

boton_generar_estrategia = st.button("🚀 Generar Estrategia con Gemini AI", type="primary")

if "estrategia_ia" not in st.session_state:
    st.session_state["estrategia_ia"] = None

if boton_generar_estrategia:
    if not gemini_api_key:
        st.error("Por favor ingresa tu Gemini API Key en la barra lateral para continuar.")
    elif not HAS_GENAI:
        st.error("La librería google-genai no está instalada. Ejecuta: pip install google-genai")
    else:
        with st.spinner("Gemini está analizando los centroides y estructurando los 5 pilares estratégicos..."):
            try:
                client = genai.Client(api_key=gemini_api_key)
                prompt_usuario = f"""
                Analiza los siguientes resultados de segmentación matemática y genera la estrategia empresarial:

                SECTOR ECONÓMICO: {sector_seleccionado}
                ALGORITMO UTILIZADO: {algoritmo} (k={k_elegido})
                TOTAL DE REGISTROS: {len(df_limpio)}
                CRITERIO DE SELECCIÓN: {metodo_k} ({justificacion_negocio})

                CENTROIDES Y COMPORTAMIENTO DE LOS GRUPOS:
                {json.dumps(resumen_clusters_para_ia, indent=2, ensure_ascii=False)}

                Responde en JSON con la siguiente estructura:
                {{
                  "executiveSummary": "Resumen ejecutivo para la dirección general...",
                  "clusterStrategies": [
                    {{
                      "clusterId": 1,
                      "commercialName": "Nombre comercial creativo...",
                      "archetypeDescription": "Descripción del arquetipo...",
                      "priority": "Alta / Crítica / Media",
                      "primaryKpi": "KPI principal...",
                      "pillars": {{
                        "producto": "Estrategia de producto...",
                        "precio": "Estrategia de precio...",
                        "innovacion": "Estrategia de innovación...",
                        "comunicacion": "Estrategia de comunicación...",
                        "rentabilidad": "Estrategia de rentabilidad..."
                      }},
                      "quickWin": "Acción inmediata para los primeros 30 días..."
                    }}
                  ]
                }}
                """
                response = client.models.generate_content(
                    model="gemini-3.8-flash",
                    contents=prompt_usuario,
                    config=types.GenerateContentConfig(
                        system_instruction=GEMINI_SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        temperature=0.7
                    )
                )
                datos_ia = json.loads(response.text)
                st.session_state["estrategia_ia"] = datos_ia
                st.success("Estrategia generada con éxito por Google Gemini.")
            except Exception as e:
                st.error(f"Error llamando a Gemini API: {str(e)}")

# Renderizar resultados de la IA
if st.session_state["estrategia_ia"]:
    estrategia = st.session_state["estrategia_ia"]
    st.subheader("4.1 Resumen Ejecutivo para el Comité de Dirección")
    st.info(estrategia.get("executiveSummary", "Sin resumen ejecutivo."))

    st.subheader("4.2 Matriz de Estrategia por Cluster (5 Pilares)")
    for c_strat in estrategia.get("clusterStrategies", []):
        c_id = c_strat["clusterId"]
        with st.expander(f"📍 Cluster {c_id}: {c_strat['commercialName']} (Prioridad: {c_strat['priority']})", expanded=True):
            st.markdown(f"**Arquetipo / Perfil:** {c_strat['archetypeDescription']}")
            st.markdown(f"**🎯 Métrica Clave (KPI):** \`{c_strat['primaryKpi']}\`")
            st.markdown("---")

            p1, p2, p3, p4, p5 = st.columns(5)
            with p1:
                st.markdown('<div class="pillar-box"><strong>📦 1. Producto</strong><br>' + c_strat["pillars"]["producto"] + '</div>', unsafe_allow_html=True)
            with p2:
                st.markdown('<div class="pillar-box"><strong>🏷️ 2. Precio</strong><br>' + c_strat["pillars"]["precio"] + '</div>', unsafe_allow_html=True)
            with p3:
                st.markdown('<div class="pillar-box"><strong>💡 3. Innovación</strong><br>' + c_strat["pillars"]["innovacion"] + '</div>', unsafe_allow_html=True)
            with p4:
                st.markdown('<div class="pillar-box"><strong>📢 4. Comunicación</strong><br>' + c_strat["pillars"]["comunicacion"] + '</div>', unsafe_allow_html=True)
            with p5:
                st.markdown('<div class="pillar-box"><strong>💰 5. Rentabilidad</strong><br>' + c_strat["pillars"]["rentabilidad"] + '</div>', unsafe_allow_html=True)

            st.markdown(f"**⚡ Quick Win Inmediato (30 días):** {c_strat['quickWin']}")

# --------------------------------------------------------------------------------------
# FASE 5: EXPORTACIÓN DE REPORTE HTML INTERACTIVO (Req 13)
# --------------------------------------------------------------------------------------
st.markdown("---")
st.header("📄 Fase 5: Consolidación y Exportación de Reporte HTML")

def generar_html_reporte(sector, total_rows, k_val, algoritmo, centroides_df, estrategia_dict):
    """Construye un documento HTML profesional y autocontenido con todo el análisis."""
    tabla_centroides_html = centroides_df.round(2).to_html(classes="table", border=0)
    
    estrategias_cards = ""
    if estrategia_dict and "clusterStrategies" in estrategia_dict:
        for item in estrategia_dict["clusterStrategies"]:
            p = item["pillars"]
            estrategias_cards += f"""
            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:20px; margin-bottom:20px;">
                <h3 style="color:#1e1b4b; margin-top:0;">Cluster {item['clusterId']}: {item['commercialName']} <span style="font-size:12px; background:#e0e7ff; color:#3730a3; padding:3px 8px; border-radius:12px;">Prioridad: {item['priority']}</span></h3>
                <p style="color:#475569;"><em>{item['archetypeDescription']}</em></p>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-top:15px;">
                    <div style="background:#f8fafc; padding:10px; border-left:3px solid #6366f1; border-radius:4px;"><strong>📦 Producto:</strong><br>{p['producto']}</div>
                    <div style="background:#f8fafc; padding:10px; border-left:3px solid #10b981; border-radius:4px;"><strong>🏷️ Precio:</strong><br>{p['precio']}</div>
                    <div style="background:#f8fafc; padding:10px; border-left:3px solid #f59e0b; border-radius:4px;"><strong>💡 Innovación:</strong><br>{p['innovacion']}</div>
                    <div style="background:#f8fafc; padding:10px; border-left:3px solid #3b82f6; border-radius:4px;"><strong>📢 Comunicación:</strong><br>{p['comunicacion']}</div>
                    <div style="background:#f8fafc; padding:10px; border-left:3px solid #8b5cf6; border-radius:4px;"><strong>💰 Rentabilidad:</strong><br>{p['rentabilidad']}</div>
                </div>
                <p style="margin-top:12px; font-size:13px; color:#1e1b4b;"><strong>🚀 Quick Win:</strong> {item['quickWin']}</p>
            </div>
            """

    html = f"""<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Dossier Estratégico de Segmentación - {sector}</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#f8fafc; color:#1e293b; padding:30px; }}
            .container {{ max-width: 1100px; margin: auto; }}
            .header {{ background: linear-gradient(135deg, #1e1b4b, #4338ca); color:white; padding:30px; border-radius:12px; margin-bottom:25px; }}
            .table {{ width:100%; border-collapse: collapse; margin-top:15px; font-size:14px; background:white; }}
            .table th, .table td {{ padding:10px 14px; border-bottom:1px solid #e2e8f0; text-align:left; }}
            .table th {{ background:#f1f5f9; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Dossier Ejecutivo de Segmentación y Estrategia</h1>
                <p>Sector Económico: <strong>{sector}</strong> | Algoritmo: <strong>{algoritmo}</strong> | Clusters: <strong>k={k_val}</strong> | Total Registros: <strong>{total_rows}</strong></p>
            </div>
            <h2>📊 Centroides Matemáticos del Modelo</h2>
            {tabla_centroides_html}
            <h2 style="margin-top:35px;">🎯 Perfiles Comerciales y Estrategias en 5 Pilares (Google Gemini AI)</h2>
            {estrategias_cards if estrategias_cards else "<p>Estrategia no generada.</p>"}
        </div>
    </body>
    </html>
    """
    return html

html_contenido = generar_html_reporte(
    sector_seleccionado,
    len(df_limpio),
    k_elegido,
    algoritmo,
    centroides_originales,
    st.session_state["estrategia_ia"]
)

st.download_button(
    label="📥 Descargar Reporte HTML Unificado",
    data=html_contenido,
    file_name=f"ClustIQ_Reporte_Segmentacion_{sector_seleccionado.replace(' ', '_')}.html",
    mime="text/html"
)
st.success("Reporte HTML listo para compartir directamente con comités directivos y equipos de negocio.")
`;

export const PYTHON_REQUIREMENTS = `# Dependencias esenciales para la app Streamlit de ClustIQ
streamlit>=1.38.0
pandas>=2.2.0
numpy>=1.26.0
scikit-learn>=1.5.0
scikit-learn-extra>=0.3.0
plotly>=5.24.0
openpyxl>=3.1.5
xlrd>=2.0.1
google-genai>=2.4.0
`;
