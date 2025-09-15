import {body, validationResult } from "express-validator"


export const registerValidation = [
    body("email").isEmail().withMessage((value, {req}) => req.t("enterValidEmail")),
    body("password").isLength({min: 6}),
    body("role").optional().isIn(["admin", "user"]),
    body("userName").notEmpty().withMessage((value, {req}) => req.t("User name is required.")),
    body("city").notEmpty().withMessage((value, {req}) => req.t("City name is required.")),
    body("postalCode").notEmpty().withMessage((value, {req}) => req.t("Postal code is required.")),
    body("addressLine1").notEmpty().withMessage((value, {req}) => req.t("First Address is required.")),
    body("addressLine2").optional(),
    body("phoneNumber")
        .notEmpty().withMessage("Phone number is required.")
        .matches(/^\+?[0-9]{10,15}$/).withMessage("Invalid phone number")
]


export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()})
    }
    next()
}