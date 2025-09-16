import {body, validationResult } from "express-validator"


export const registerValidation = [
    body("email")
        .isEmail()
        .withMessage((value, { req }) => req.t("enterValidEmail")),

    body("password")
        .isLength({ min: 6 })
        .withMessage((value, { req }) => req.t("passwordMinLength")),

    body("role")
        .optional()
        .isIn(["admin", "user"])
        .withMessage((value, { req }) => req.t("invalidRole")),

    body("userName")
        .notEmpty()
        .withMessage((value, { req }) => req.t("userNameRequired")),

    body("city")
        .notEmpty()
        .withMessage((value, { req }) => req.t("cityRequired")),

    body("postalCode")
        .notEmpty()
        .withMessage((value, { req }) => req.t("postalCodeRequired")),

    body("addressLine1")
        .notEmpty()
        .withMessage((value, { req }) => req.t("addressLine1Required")),

    body("addressLine2")
        .optional(),

    body("phoneNumber")
        .notEmpty()
        .withMessage((value, { req }) => req.t("phoneNumberRequired"))
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage((value, { req }) => req.t("invalidPhoneNumber"))
]

export const loginValidation = [
    body("email")
        .isEmail()
        .withMessage((value, { req }) => req.t("enterValidEmail")),

    body("password")
        .isLength({ min: 6 })
        .withMessage((value, { req }) => req.t("passwordMinLength")),
]

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()})
    }
    next()
}