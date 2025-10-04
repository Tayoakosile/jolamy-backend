"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllInventory = void 0;
const Product_1 = require("../../models/Product");
const dayjs_1 = __importDefault(require("dayjs"));
const User_1 = __importDefault(require("../../models/User"));
// Get all products
function getUnitsSoldInDays(data, days) {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days);
    return data
        .filter((sale) => new Date(sale.date_sold) >= cutoff && sale.isOrderDelivered)
        .reduce((sum, sale) => sum + sale.total_quantity_sold, 0);
}
const getAllInventory = async (req, res) => {
    try {
        const products = (await Product_1.Product.find().populate("orders"));
        const productsForInventory = products?.map((product) => {
            // unit_sold_last_30_days: 0,
            //   unit_sold_last_60_days: 0,
            //   unit_sold_last_90_days: 0,
            //   total_units_sold: product.total_boxes_sold || 0,
            const dataOrders = product?.orders
                .map((order) => {
                const deliveredOrder = order?.delivery_steps[order?.delivery_steps.length - 1];
                const isOrderDelivered = deliveredOrder.label?.includes("delivered");
                // console.log("deliveredOrder :", deliveredOrder);
                if (isOrderDelivered) {
                    const total_quantity_sold = order?.total_quantity;
                    const date_sold = (0, dayjs_1.default)(order?.updated_at)?.toDate();
                    return {
                        total_quantity_sold,
                        total_amount: order?.total_amount,
                        date_sold,
                        isOrderDelivered,
                    };
                }
                return null;
            })
                .filter((order) => !!order);
            const total = dataOrders.reduce((sum, item) => sum + (item.total_quantity_sold ?? 0), 0);
            const total_revenue_generated = dataOrders.reduce((sum, item) => sum + (item.total_amount ?? 0), 0);
            return {
                product_id: product.product_id,
                product_name: product.name,
                product_image: product.product_images,
                product_description: product.description,
                category: product.category,
                quantity_in_stock: product.total_boxes_in_stock || "unlimited",
                pricing: {
                    distributor_bonus_per_box: product.distributor_bonus_per_box,
                    sales_agent_bonus_per_box: product.sales_agent_bonus_per_box,
                    unit_type: product.unit_type,
                    inventory_alert_threshold: product.inventory_alert_threshold,
                    is_unlimited: product.total_boxes_in_stock == null,
                    distributor_pricing: product.distributor_price_per_box,
                    sales_agent_pricing: product.sales_agent_price_per_box,
                },
                total_boxes_sold: product.total_boxes_sold || 0,
                units_per_box: product.units_per_box,
                minimum_order_quantity: product.min_order_quantity,
                maximum_order_quantity: product.max_order_quantity,
                status: product.total_boxes_in_stock == null
                    ? "in_stock"
                    : product.total_boxes_in_stock === 0
                        ? "out_of_stock"
                        : product.total_boxes_in_stock <= product.inventory_alert_threshold
                            ? "low_stock"
                            : "in_stock",
                unit_sold_last_30_days: getUnitsSoldInDays(dataOrders, 30),
                unit_sold_last_60_days: getUnitsSoldInDays(dataOrders, 60),
                is_archived: product.is_archived,
                is_active: product.is_active,
                unit_sold_last_90_days: getUnitsSoldInDays(dataOrders, 90),
                total_units_sold: total,
                total_revenue_generated: total_revenue_generated,
                sku: product?.sku,
                variants: product.variants,
                created_at: product.created_at,
                updated_at: product.updated_at,
                // Add more fields as necessary
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
        // }
        //
        const distributors = await User_1.default.find({
            user_role: "distributor",
            $expr: { $gt: [{ $size: "$orders" }, 1] },
            is_verified: true,
            status: "approved",
        })
            .select("-logs -files -dob -account_details -address")
            .populate("stock_logs")
            .populate("orders");
        const all_distributors_stock = distributors.map((distributor) => {
            const currentStockLog = distributor?.stock_logs?.[distributor.stock_logs.length - 1];
            if (!currentStockLog)
                return;
            return {
                name: `${distributor?.first_name} ${distributor?.last_name}`,
                business_name: distributor.business_name,
                stock: currentStockLog?.new_stock,
                last_supplied: currentStockLog?.created_at,
                last_order_volume: currentStockLog?.quantity,
                email: distributor.email,
                user_role: distributor.user_role,
                phone_number: distributor.phone_number,
                user_id: distributor.user_id,
                is_stock_low: (currentStockLog?.new_stock ?? 0) < 50,
                is_stock_critical: (currentStockLog?.new_stock ?? 0) <= 70,
                is_stock_healthy: (currentStockLog?.new_stock ?? 0) > 70,
                status: (currentStockLog?.new_stock ?? 0) < 50
                    ? "critical"
                    : (currentStockLog?.new_stock ?? 0) <= 70
                        ? "low"
                        : "healthy",
            };
        }).filter((dist) => !!dist);
        console.log("all_distributors_stock :", all_distributors_stock);
        res.json({
            products: productsForInventory,
            distributors: all_distributors_stock,
        });
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
