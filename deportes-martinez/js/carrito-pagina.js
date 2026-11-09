import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=110";
import { setProductos, initCart } from "./cart.js?v=110";
catalogoRapido(list => setProductos(list));
initCart();
