import { firebaseConfig } from "./config.js?v=96";

const DOCS = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/`;
const KEY = "dm_catalogo_v1";

function valor(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(valor);
  if ("mapValue" in v) return campos(v.mapValue.fields || {});
  return null;
}

function campos(f) {
  const o = {};
  for (const k in f) o[k] = valor(f[k]);
  return o;
}

function guardado() {
  try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); return Array.isArray(c) && c.length ? c : null; } catch { return null; }
}

export async function catalogoRapido(cb) {
  const c = guardado();
  if (c) cb(c);
  try {
    let lista = [], tok = "";
    do {
      const r = await fetch(`${DOCS}productos?key=${firebaseConfig.apiKey}&pageSize=300${tok ? "&pageToken=" + tok : ""}`);
      if (!r.ok) return;
      const d = await r.json();
      lista = lista.concat((d.documents || []).map(x => ({ ...campos(x.fields || {}), id: x.name.split("/").pop() })));
      tok = d.nextPageToken || "";
    } while (tok);
    lista.sort((a, b) => (String(a.nombre) < String(b.nombre) ? -1 : String(a.nombre) > String(b.nombre) ? 1 : 0));
    const txt = JSON.stringify(lista);
    try { if (txt.length < 1500000) localStorage.setItem(KEY, txt); } catch {}
    if (!c || JSON.stringify(c) !== txt) cb(lista);
  } catch {}
}

export async function fotosRapido(id) {
  try {
    const r = await fetch(`${DOCS}productos_fotos/${encodeURIComponent(id)}?key=${firebaseConfig.apiKey}`);
    if (!r.ok) return null;
    const d = await r.json();
    return valor(d.fields?.imagenes) || [];
  } catch { return null; }
}

export function guardarCatalogo(lista) {
  try { const txt = JSON.stringify(lista); if (txt.length < 1500000) localStorage.setItem(KEY, txt); } catch {}
}
