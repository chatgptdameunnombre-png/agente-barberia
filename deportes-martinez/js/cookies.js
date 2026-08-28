const KEY = "dm_medicion";

function guardar(v) {
  try { localStorage.setItem(KEY, v); } catch { }
}

/* Quien no quiera que se mida su visita lo puede desactivar desde los términos
   (legales.html): ahí vive el botón, el aviso de inicio solo confirma. */
export function apagarMedicion() { guardar("no"); }
export function prenderMedicion() { guardar("si"); }

export function permiteMedicion() {
  try { return localStorage.getItem(KEY) !== "no"; } catch { return true; }
}

function mostrar() {
  let elegido = null;
  try { elegido = localStorage.getItem(KEY); } catch { }
  if (elegido) return;
  const b = document.createElement("div");
  b.id = "ckBanner";
  b.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:9998;background:#0f0f12;border:1px solid #26262e;border-radius:16px;padding:16px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;box-shadow:0 20px 50px rgba(0,0,0,.5);max-width:720px;margin:0 auto";
  b.innerHTML = `
    <p style="flex:1;min-width:240px;margin:0;font-size:13.5px;color:#c0c0c4;line-height:1.5">
      Usamos almacenamiento del navegador para tu carrito y para medir de forma anónima qué jerseys se ven más.
      <a href="legales.html#datos" style="color:#e8b923;text-decoration:underline">Cómo lo usamos</a>.
    </p>
    <div style="display:flex;gap:8px">
      <button id="ckSi" style="background:#e8b923;border:none;color:#1a1405;border-radius:10px;padding:10px 22px;font-weight:700;font-size:13.5px;cursor:pointer">Entendido</button>
    </div>`;
  document.body.appendChild(b);
  b.querySelector("#ckSi").onclick = () => { guardar("si"); b.remove(); };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mostrar);
else mostrar();
