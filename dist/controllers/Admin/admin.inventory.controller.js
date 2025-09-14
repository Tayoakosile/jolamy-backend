"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllInventory = void 0;
const Product_1 = require("../../models/Product");
// Get all products
const getAllInventory = async (req, res) => {
    try {
        const products = await Product_1.Product.find();
        res.json(products);
        const productsForInventory = products?.map((product) => {
            return {
                product_name: product.name,
            };
        });
        console.log("productsForInventory :", productsForInventory);
        // {
        // product_name
        //product_stock
        //distributor_pricing
        // sales_agent_pricing
        //status: low_stock, out_of_stock, in_stock,
        //unit_sold_last_30_days
        //unit_sold_last_60_days
        //
        //
        //
        //
        //
        // }
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
};
exports.getAllInventory = getAllInventory;
// Get a single product by ID
const getProductById = async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching product", error });
    }
};
exports.getProductById = getProductById;
// Create a new product
const createProduct = async (req, res) => {
    try {
        // console.log('req.body.options; :', req.body.options);
        // return;
        const newProduct = new Product_1.Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    }
    catch (error) {
        res.status(400).json({ message: "Error creating product", error });
    }
};
exports.createProduct = createProduct;
// Update a product
const updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product_1.Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct)
            return res.status(404).json({ message: "Product not found" });
        res.json(updatedProduct);
    }
    catch (error) {
        res.status(400).json({ message: "Error updating product", error });
    }
};
exports.updateProduct = updateProduct;
// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product_1.Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct)
            return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
    }
};
exports.deleteProduct = deleteProduct;
