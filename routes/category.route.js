import express from "express"
import  { Category } from "../models/category.model.js"
import { adminOnly } from "../middleware/roles.middleware.js";

const router = express.Router();

router.post("/", adminOnly, async (req, res) => {
  try {
    if (!req.body.name || req.body.name.trim().length < 3) {
      return res.status(400).send({
        message: req.t("categoryNameValidation"),
      });
    }
    const newCategory = await Category.create({
      name: req.body.name,
    });

    return res.status(201).send(newCategory);
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const categoriesList = await Category.find();
    if (!categoriesList || categoriesList.length === 0) {
      return res.send({message: req.t("noCategories")})
    }
    res.send(categoriesList);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", adminOnly, async(req, res) => {
  try{
    const catg = await Category.findByIdAndDelete(req.params.id)
    if(!catg) {
      return res.status(404).send({message: req.t("categoryNotFound")})
    }

    return res.send({message: req.t("categoryDeletedSuccessfully")})
  }
  catch (err) {
    res.status(400).send({ message: err.message });
  }
})

router.put("/:id", adminOnly,  async(req, res) => {
    try{
    const catg = await Category.findByIdAndUpdate(req.params.id, {
      name: req.body.name
    })
    if(!catg) {
      return res.status(404).send({message: req.t("categoryNotFound")})
    }

    return res.send({message: req.t("categoryUpdatedSuccessfully")})
  }
  catch (err) {
    res.status(400).send({ message: err.message });
  }
})

export default router
