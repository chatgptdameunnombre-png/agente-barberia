(function () {
  var OJO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var TACHADO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 7 10 7a10.4 10.4 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

  var css = document.createElement('style');
  css.textContent =
    '.vc-caja{position:relative;display:block;margin-bottom:13px}' +
    '.vc-caja>input{margin-bottom:0!important;padding-right:52px!important}' +
    '.vc-ojo{position:absolute;top:50%;right:8px;transform:translateY(-50%);width:40px;height:40px;' +
    'display:flex;align-items:center;justify-content:center;border:none;border-radius:10px;background:transparent;' +
    'color:rgba(232,226,208,.55);cursor:pointer;transition:color .2s,background .2s;-webkit-tap-highlight-color:transparent}' +
    '.vc-ojo:hover,.vc-ojo:focus-visible{color:#dfc06a;background:rgba(201,168,76,.10);outline:none}' +
    '.vc-ojo[aria-pressed="true"]{color:#dfc06a}';
  document.head.appendChild(css);

  function pon(input) {
    if (input.dataset.vc) return;
    input.dataset.vc = '1';
    var caja = document.createElement('span');
    caja.className = 'vc-caja';
    input.parentNode.insertBefore(caja, input);
    caja.appendChild(input);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'vc-ojo';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Mostrar contraseña');
    b.innerHTML = TACHADO;
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      var ver = input.type === 'password';
      input.type = ver ? 'text' : 'password';
      b.innerHTML = ver ? OJO : TACHADO;
      b.setAttribute('aria-pressed', ver ? 'true' : 'false');
      b.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
    caja.appendChild(b);
  }

  function todos() {
    document.querySelectorAll('input[type="password"]').forEach(pon);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', todos);
  else todos();
})();
