import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=115";
import { setProductos, initCart } from "./cart.js?v=115";
catalogoRapido(list => setProductos(list));
initCart();
