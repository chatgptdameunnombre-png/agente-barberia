import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=120";
import { setProductos, initCart } from "./cart.js?v=120";
catalogoRapido(list => setProductos(list));
initCart();
