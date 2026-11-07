import mongoose, { Schema } from 'mongoose'

const recipeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    ingredients: {
      type: [String],
      required: true,
      validate: {
        validator: (items) =>
          Array.isArray(items) &&
          items.length > 0 &&
          items.every((item) => typeof item === 'string' && item.trim()),
        message: 'ingredients must be a non-empty list of strings',
      },
    },
    imageUrl: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  },
  { timestamps: true },
)

export const Recipe = mongoose.model('recipe', recipeSchema)
