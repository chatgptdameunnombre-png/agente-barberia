import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=109";
import { setProductos, initCart } from "./cart.js?v=109";
catalogoRapido(list => setProductos(list));
initCart();
