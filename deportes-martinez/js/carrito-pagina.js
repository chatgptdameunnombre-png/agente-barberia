import { catalogoRapido, guardarCatalogo } from "./catalogo.js?v=105";
import { setProductos, initCart } from "./cart.js?v=105";
catalogoRapido(list => setProductos(list));
initCart();
