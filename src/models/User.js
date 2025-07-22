const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { JWT_SECRET = "eLearning", JWT_EXPIRES_IN = "7d" } = process.env;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid email address.",
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      // If you want to hide password by default when querying:
      // select: false,
    },
  },
  { timestamps: true }
);

// Instance: sign JWT for this user
userSchema.methods.getJWT = function () {
  return jwt.sign(
    { id: this._id.toString(), email: this.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Instance: compare plaintext to hashed password
userSchema.methods.validatePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
