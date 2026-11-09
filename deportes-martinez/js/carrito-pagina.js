import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=107";
import { setProductos, initCart } from "./cart.js?v=107";
catalogoRapido(list => setProductos(list));
initCart();
