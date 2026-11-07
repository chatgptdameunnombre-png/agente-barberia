import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=97";
import { setProductos, initCart } from "./cart.js?v=97";
catalogoRapido(list => setProductos(list));
initCart();
