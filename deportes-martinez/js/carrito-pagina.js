import { db } from "./db.js?v=94";
import { setProductos, initCart } from "./cart.js?v=94";

db.onProducts(list => setProductos(list));
initCart();
