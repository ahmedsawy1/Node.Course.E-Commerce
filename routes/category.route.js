const express = require("express");
const { Category } = require("../models/category.model");

const router = express.Router();

router.post("/", async (req, res) => {
  try {

    if ( !req.body.name || req.body.name.trim().length < 3) {
        return res.status(400).send({
            message: req.t("categoryNameValidation")
        })
    }
    const newCategory = await Category.create({
      name: req.body.name,
    });

    return res.status(201).send(newCategory);
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
});

module.exports = router;
