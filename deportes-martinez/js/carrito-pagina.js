import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=117";
import { setProductos, initCart } from "./cart.js?v=117";
catalogoRapido(list => setProductos(list));
initCart();
