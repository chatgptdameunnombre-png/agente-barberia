import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=113";
import { setProductos, initCart } from "./cart.js?v=113";
catalogoRapido(list => setProductos(list));
initCart();
