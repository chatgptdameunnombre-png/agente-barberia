import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=108";
import { setProductos, initCart } from "./cart.js?v=108";
catalogoRapido(list => setProductos(list));
initCart();
