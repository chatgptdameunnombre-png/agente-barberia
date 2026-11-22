(function () {
  var K = "td_medicion";
  var btn = document.getElementById("medBtn");
  var est = document.getElementById("medEstado");
  if (!btn) return;

  function leer() { try { return localStorage.getItem(K); } catch (e) { return null; } }
  function poner(v) { try { localStorage.setItem(K, v); } catch (e) { } }

  function pinta() {
    var apagada = leer() === "no";
    btn.textContent = apagada ? "Volver a permitir la medición" : "Apagar la medición";
    est.textContent = apagada
      ? "Ahorita tu visita NO se está midiendo."
      : "Ahorita tu visita sí se está midiendo, de forma anónima.";
  }

  function volver() {
    var v = document.getElementById("medVolver");
    if (v) v.remove();
    var r;
    try { r = new URL(document.referrer); } catch (e) { return; }
    if (leer() !== "no" || r.hostname === location.hostname || !/(^|\.)tuagentedeia\.com$/.test(r.hostname) || /^panel\./.test(r.hostname)) return;
    r.searchParams.set("td_med", "no");
    v = document.createElement("a");
    v.id = "medVolver";
    v.href = r.href;
    v.textContent = "Regresar a la página donde estabas, también sin medición";
    v.style.cssText = "display:inline-block;margin-top:10px;color:#c9a84c;text-decoration:underline";
    est.parentNode.insertBefore(v, est.nextSibling);
  }

  btn.onclick = function () {
    poner(leer() === "no" ? "si" : "no");
    pinta();
    volver();
  };

  pinta();
  volver();
})();
