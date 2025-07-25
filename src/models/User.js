const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { JWT_SECRET = "eLearning", JWT_EXPIRES_IN = "7d" } = process.env;

// Custom URL validator that allows empty strings
const optionalUrlValidator = {
  validator: function(value) {
    // Allow empty strings or null/undefined
    if (!value || value.trim() === '') return true;
    // Otherwise validate as URL
    return validator.isURL(value);
  },
  message: "Invalid URL format."
};

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
    },

    photoURL: {
      type: String,
      validate: optionalUrlValidator,
      default:
        "https://t3.ftcdn.net/jpg/07/24/59/76/240_F_724597608_pmo5BsVumFcFyHJKlASG2Y2KpkkfiYUU.jpg",
    },

    // Additional profile fields
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    bio: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { 
      type: String, 
      enum: ["Male", "Female", "Other", "Prefer not to say", ""],
      default: ""
    },
    profession: { type: String, trim: true },
    experience: { type: String, trim: true },

    interests: [{ 
      type: String, 
      trim: true,
      validate: {
        validator: function(value) {
          return value && value.trim().length > 0;
        },
        message: "Interest cannot be empty"
      }
    }],

    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
        validate: optionalUrlValidator,
      },
      github: {
        type: String,
        trim: true,
        validate: optionalUrlValidator,
      },
      twitter: {
        type: String,
        trim: true,
        validate: optionalUrlValidator,
      },
    },

    stats: {
      coursesEnrolled: { type: Number, default: 0 },
      coursesCompleted: { type: Number, default: 0 },
      certificatesEarned: { type: Number, default: 0 },
      studyHours: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Pre-save middleware to clean up empty strings and arrays
userSchema.pre('save', function(next) {
  // Clean up interests array - remove empty strings
  if (this.interests) {
    this.interests = this.interests.filter(interest => 
      interest && interest.trim().length > 0
    );
  }

  // Clean up social links - remove empty strings
  if (this.socialLinks) {
    Object.keys(this.socialLinks).forEach(key => {
      if (!this.socialLinks[key] || this.socialLinks[key].trim() === '') {
        this.socialLinks[key] = undefined;
      }
    });
  }

  // Clean up photoURL if empty
  if (this.photoURL && this.photoURL.trim() === '') {
    this.photoURL = undefined;
  }

  next();
});

// Pre-update middleware for findOneAndUpdate operations
userSchema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
  const update = this.getUpdate();
  
  // Clean up interests if being updated
  if (update.interests) {
    update.interests = update.interests.filter(interest => 
      interest && interest.trim().length > 0
    );
  }

  // Clean up social links if being updated
  if (update.socialLinks) {
    Object.keys(update.socialLinks).forEach(key => {
      if (!update.socialLinks[key] || update.socialLinks[key].trim() === '') {
        update.socialLinks[key] = undefined;
      }
    });
  }

  // Clean up photoURL if empty
  if (update.photoURL && update.photoURL.trim() === '') {
    update.photoURL = undefined;
  }

  next();
});

// Virtual field for referencing enrollments
userSchema.virtual("enrollments", {
  ref: "Enrollment",
  localField: "_id",
  foreignField: "user",
});

// JWT token method
userSchema.methods.getJWT = function () {
  return jwt.sign({ id: this._id.toString(), email: this.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Password validation method
userSchema.methods.validatePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", userSchema);
module.exports = User;