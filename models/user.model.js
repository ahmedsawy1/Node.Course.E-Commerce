import mongoose from "mongoose";
import bcrypt from "bcrypt"
import { addCommonVirtuals } from "../helpers/mongoose-plugin.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hashing password before saving.
userSchema.pre("save", async function(next) {
    // skip hashing if password wasn't modified 
    if (!this.isModified("password")) return next()

    try {
        const salt = await bcrypt.genSalt(10)

        this.password = await bcrypt.hash(this.password, salt)

        next()
    } catch (error) {
        next(error)
    }  
})

// Instance Method: Password Comparison
// Compares a plain text password with hashed password stored in DB
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
    const user = this.toObject({ virtuals: true })
    delete user.password;
    return user
}

// _id => id
userSchema.plugin(addCommonVirtuals)

const User = mongoose.model("User", userSchema);
export default User;
