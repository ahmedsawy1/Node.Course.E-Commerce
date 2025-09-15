import express from "express";
import User from "../models/user.model.js";
import { registerValidation, handleValidationErrors } from "../validators/auth.validator.js";
import { generateToken } from "../helpers/jwt.js";

const router = express.Router();

router.post("/register", registerValidation, handleValidationErrors ,async (req, res) => {
  try {
    const user = new User(req.body);

    const { email } = req.body

    const existingUserByEmail = await User.findOne({email})
    if(existingUserByEmail) {
        return res.status(400).json({
            success: false,
            message: req.t("emailAlreadyExists")
        })
    }

    await user.save();

    const token = generateToken(user)

    res.status(201).json({
      success: true,
      message: req.t("userRegisteredSuccessfully"),
      data: user.toJSON(),
      token: token
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router
