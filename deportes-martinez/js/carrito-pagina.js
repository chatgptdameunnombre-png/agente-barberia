import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=112";
import { setProductos, initCart } from "./cart.js?v=112";
catalogoRapido(list => setProductos(list));
initCart();
