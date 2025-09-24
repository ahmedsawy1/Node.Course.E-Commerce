import express from "express";
import { ProductModel } from "../models/product.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import {
  getFileURL,
  handleUploadError,
  uploadMultiple,
} from "../middleware/upload.middleware.js";
import { adminOnly, userAndAdmin } from "../middleware/roles.middleware.js";
import {
  createProductValidation,
  handleValidationErrors,
} from "../validators/product.validator.js";

const router = express.Router();

router.post(
  "/",
  adminOnly,
  uploadMultiple,
  handleUploadError,
  createProductValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      let imageURLs = [];
      if (req.files && req.files.length > 0) {
        imageURLs = req.files.map((file) => getFileURL(req, file.filename));
      }

      let newProduct = new ProductModel({
        title: req.body.title,
        price: parseFloat(req.body.price), // "1.6" => 1.6
        category: req.body.category,
        countInStock: parseInt(req.body.countInStock), // "1" => 1
        description: req.body.description,
        images: imageURLs,
      });

      newProduct = await newProduct.save();

      return res.status(201).json({
        success: true,
        message: req.t("productCreatedSuccessfully"),
        data: newProduct,
      });
    } catch (error) {
      handleRouteError(error, res);
    }
  }
);

router.get("/", userAndAdmin, async (req, res) => {
  try {
    const search = req.query.search;
    const categoryID = req.query.categoryID;

    // Pagination Params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (categoryID) {
      filter.category = categoryID;
    }

    const totalCount = await ProductModel.countDocuments(filter);

    const productsList = await ProductModel.find(filter)
      .populate("category", "name")
      .skip(skip)
      .limit(limit);

    const sharedDataResponse = {
      search,
      categoryID,
      page,
      limit,
      totalProducts: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    };

    if (!productsList || productsList.length === 0) {
      return res.send({
        message: req.t("noProducts"),
        data: [],
        ...sharedDataResponse,
      });
    }

    res.send({
      data: productsList,
      ...sharedDataResponse,
    });
  } catch (error) {
    handleRouteError(error, res);
  }
});

export default router;
