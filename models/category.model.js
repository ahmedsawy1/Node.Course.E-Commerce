import mongoose from "mongoose"
import { addCommonVirtuals } from "../helpers/mongoose-plugin.js"

const categorySchema = mongoose.Schema({
    name: String
})

categorySchema.plugin(addCommonVirtuals)

export const Category = mongoose.model("Category", categorySchema)