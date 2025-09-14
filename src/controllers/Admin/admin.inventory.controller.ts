import { Request, Response } from "express";
import { Product } from "../../models/Product";

// Get all products
export const getAllInventory = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
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
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
};

// Get a single product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
};

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    // console.log('req.body.options; :', req.body.options);
    // return;
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: "Error creating product", error });
  }
};

// Update a product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: "Error updating product", error });
  }
};

// Delete a product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct)
      return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
};
