import { Request, Response } from "express";
import { Types } from "mongoose";
import { Product } from "../../models/Product";
import User from "../../models/User";
import { AuthRequest } from "../../types/type";
import { logActivity } from "../../utils/activityLog";
import { errorResponse } from "../../utils/response";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
  generateVariants,
} from "../../utils/util";

type Option = {
  name: string;
  values: string[];
};

function updateProductOptionsFunc(
  existingOptions: Option[],
  formerOptions: Option[],
  newOptions: Option[]
): Option[] {
  existingOptions.forEach((existingOption) => {
    const formerOption = formerOptions.find(
      (opt) => opt.name.toLowerCase() === existingOption.name.toLowerCase()
    );
    console.log("formerOption :", formerOption);
  });
}

export const addNewProducts = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const user = _req.user;

  // if (!_req.files || _req.files.length === 0)  {
  //   errorResponse(res, 400, "No files uploaded. Please upload product images.");
  // return;
  // }

  const body = _req.body;
  const updatedVariants = generateVariants(body.options ?? []);

  // return;

  const request = async () => {
    const existingProduct = await Product.findOne({
      $or: [
        {
          name: body.name,
          reference_id: body.reference_id,
        },
      ],
    });

    if (existingProduct) {
      errorResponse(
        res,
        400,
        "Product with this name or Reference already exists, Edit instead",
        {
          message: "Product with this name already exists",
          existingProduct,
        }
      );
      return;
    }
    const product = await Product.create({
      ..._req.body,
      created_by: _req.user?._id,
      is_active: true,
    });

    const log = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "ADD_PRODUCT",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: product.id,
      description: `New product added: ${product.name}`,
      metadata: {
        product_id: product.product_id,
        user_id: _req.user?._id,
      },
    });
    await User.findByIdAndUpdate(user?._id, {
      $push: { logs: log.id },
    });
    await Product.findByIdAndUpdate(user?._id, {
      $push: { logs: log.id },
    });
    return { message: "Product added successfully", product };
  };

  customReqResHandler(res, request);
};

export const getProducts = (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const request = async () => {
    const isUserAdmin = _req.user?.is_admin;
    return isUserAdmin
      ? await Product.find({ is_active: true })
      : await Product.find({ is_active: true }).select(
          "-logs -orders -inventory -created_by -is_archived -archived_at -archived_by"
        );
  };
  customReqResHandler(res, request);
};
export const getSingleProducts = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const id = _req.params.id;
  const request = async () => {
    const product = await checkIfDocumentExistsById(
      id,
      "product_id",
      res,
      Product,
      ["orders"]
    );

    const logs = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "GET_PRODUCT",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: product?._id as Types.ObjectId,
      description: `Product fetched: ${id}`,
      metadata: {
        product_id: product?._id,
        user_id: _req.user?._id,
      },
    });
    await User.findByIdAndUpdate(_req.user?._id, {
      $push: { logs: logs.id },
    });

    return product;
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Product Fetched Successfully",
    statusCode: 200,
  });
};

export const updateProduct = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;
  const id = req.params.id;
  await checkIfDocumentExistsById(id, "product_id", res, Product);
  const body = req.body;

  const request = async () => {
    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      action: "UPDATE_PRODUCT",
      sender: new Types.ObjectId(req.user?._id),
      receiver: new Types.ObjectId(id),
      description: `Product updated: ${body.name}`,
      metadata: {
        product_id: id,
        user_id: req.user?._id,
      },
    });
    await Product.findByIdAndUpdate(
      id,
      {
        ...body,
        $push: { logs: log.id },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log.id },
    });
    return;
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Product updated successfully",
    statusCode: 200,
  });
};

export const updateProductOptions = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;
  const id = req.params.id;
  const product = await checkIfDocumentExistsById(
    id,
    "product_id",
    res,
    Product
  );
  const body = req.body;
  if (!product) return;

  if (!body?.options || body?.options?.length < 1) {
    errorResponse(res, 400, "Options are required");
    return;
  }
  const isProductOptionInDbBefore = product.options
    ?.map((option) => {
      const exists = body.options.find(
        (o: any) => o.name?.toLowerCase() === option.name?.toLowerCase()
      );
      if (exists) {
        return true;
      }
      return false;
    })
    .some((val) => val === true);

  if (isProductOptionInDbBefore) {
    errorResponse(res, 400, "This option already exists");
    return;
  }

  const request = async () => {
    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      action: "UPDATE_PRODUCT_OPTIONS",
      sender: new Types.ObjectId(req.user?._id),
      description: `Product options updated: ${body.name}`,
      metadata: {
        product_id: id,
        user_id: req.user?._id,
      },
    });

    const product_options = product.options;
    const productOptionLength = product?.options?.length;
    const updated_product_options =
      productOptionLength >= 1
        ? [...product.options, ...body?.options]
        : body?.options;

    product.options = updated_product_options;

    product.variants = generateVariants(updated_product_options ?? []);
    product?.save();

    return;

    const updatedProduct = await Product.findOneAndUpdate(
      { product_id: id },
      {
        options:
          productOptionLength >= 1
            ? [...product.options, ...body?.options]
            : body?.options,
        variants: generateVariants(body.options ?? []),
        // variants:
        //   productOptionLength <= 0
        //     ? generateVariants(body.options ?? [])
        //     : [...product.variants, ...generateVariants(body.options ?? [])],
        $push: { logs: log.id },
      },
      { new: true }
    );

    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log.id },
    });
    return updatedProduct;
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Product updated successfully",
    statusCode: 200,
  });
};
export const patchProductOptions = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;
  const id = req.params.id;
  // const options = req.body;
  const former_options = req.body?.former_options;
  const new_options = req.body?.new_options;

  const product = await checkIfDocumentExistsById(
    id,
    "product_id",
    res,
    Product
  );

  const body = req.body;
  if (!product) return;
  // search for options that are in product.options and former_options then update the value to the value in new_options
  const updated_former_options = body.former_options.flatMap((opt: any) =>
    opt.values.map((value: any) => ({
      name: opt.name,
      value,
    }))
  );

  updated_former_options.map(async (opt: any, index) => {
    // console.log("opt :", opt);
    console.log("new_options :", new_options, index);

    // return;
    const productUpdate = await Product.updateOne(
      {
        _id: product?._id,
        "options.name": opt?.name,
        "options.values": opt?.value,
      },
      {
        $set: {
          "options.$[opt].name": new_options[index]?.name,
          "options.$[opt].values": new_options[index]?.values,
          // overwrite the whole array
        },
      },
      {
        arrayFilters: [{ "opt.name": opt?.name }],
      }
    );
    console.log("productUpdate :", productUpdate);
  });
  console.log("updated_former_options :", updated_former_options);

  if (!body?.options || body?.options?.length < 1) {
    errorResponse(res, 400, "Options are required");
    return;
  }

  const request = async () => {
    // await Product.findOneAndUpdate({})
  };
};

export const archiveProduct = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;
  const id = req.params.id;
  await checkIfDocumentExistsById(id, "product_id", res, Product);
  const request = async () => {
    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      action: "ARCHIVE_PRODUCT",
      sender: new Types.ObjectId(req.user?._id),
      receiver: new Types.ObjectId(id),
      description: `Product archived: ${id}`,
      metadata: {
        product_id: id,
        user_id: req.user?._id,
      },
    });
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log.id },
    });
    return await Product.findByIdAndUpdate(
      id,
      { is_active: false, is_archived: true, $push: { logs: log.id } },
      { new: true }
    );
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Product archived successfully",
    statusCode: 200,
  });
};
