import {
    getAllProducts,
    getProductById,
    getProductByBarcode,
    getProductsWithLeft,
    getLowStockProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../services/products.service.js";

export async function listProducts(req, res, next) {
    try {
        const products = await getAllProducts();
        res.json(products);
    } catch (err) {
        next(err);
    }
}

export async function getProduct(req, res, next) {
    try {
        const { id } = req.params;
        const product = await getProductById(id);
        if (!product) return res.status(404).json({ message: "Товар не найден" });
        res.json(product);
    } catch (err) {
        next(err);
    }
}

export async function getProductByBarcodeController(req, res, next) {
    try {
        const { code } = req.params;
        const product = await getProductByBarcode(code);
        if (!product) return res.status(404).json({ message: "Товар не найден" });
        res.json(product);
    } catch (err) {
        next(err);
    }
}

export async function getProductsLeftController(req, res, next) {
    try {
        const rows = await getProductsWithLeft();
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

export async function getLowStockController(req, res, next) {
    try {
        const rows = await getLowStockProducts();
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

export async function createProductController(req, res, next) {
    try {
        const product = await createProduct(req.body);
        res.status(201).json(product);
    } catch (err) {
        next(err);
    }
}

export async function updateProductController(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await updateProduct(id, req.body);
        if (!updated) return res.status(404).json({ message: "Товар не найден" });
        res.json(updated);
    } catch (err) {
        next(err);
    }
}

export async function deleteProductController(req, res, next) {
    try {
        const { id } = req.params;
        await deleteProduct(id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
