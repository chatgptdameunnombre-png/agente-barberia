import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=102";
import { setProductos, initCart } from "./cart.js?v=102";
catalogoRapido(list => setProductos(list));
initCart();
