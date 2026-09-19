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

  btn.onclick = function () {
    poner(leer() === "no" ? "si" : "no");
    pinta();
  };

  pinta();
})();
