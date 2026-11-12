import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=122";
import { setProductos, initCart } from "./cart.js?v=122";
catalogoRapido(list => setProductos(list));
initCart();
