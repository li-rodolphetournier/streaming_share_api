import Joi from "joi";

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

// Schéma de validation pour l'inscription
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Format d'email invalide",
    "any.required": "L'email est requis",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Le mot de passe doit contenir au moins 6 caractères",
    "any.required": "Le mot de passe est requis",
  }),
  firstName: Joi.string().optional().allow(""),
  lastName: Joi.string().optional().allow(""),
});

// Schéma de validation pour la connexion
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Format d'email invalide",
    "any.required": "L'email est requis",
  }),
  password: Joi.string().required().messages({
    "any.required": "Le mot de passe est requis",
  }),
});

// Schéma de validation pour la création de média
const createMediaSchema = Joi.object({
  title: Joi.string().required().messages({
    "any.required": "Le titre est requis",
  }),
  originalTitle: Joi.string().optional().allow(""),
  description: Joi.string().optional().allow(""),
  filePath: Joi.string().required().messages({
    "any.required": "Le chemin du fichier est requis",
  }),
  thumbnailPath: Joi.string().optional().allow(""),
  posterPath: Joi.string().optional().allow(""),
  backdropPath: Joi.string().optional().allow(""),
  type: Joi.string()
    .valid("movie", "tv", "music", "photo")
    .required()
    .messages({
      "any.only": "Le type doit être movie, tv, music ou photo",
      "any.required": "Le type est requis",
    }),
  libraryId: Joi.number().integer().positive().required().messages({
    "number.positive": "L'ID de la bibliothèque doit être positif",
    "any.required": "L'ID de la bibliothèque est requis",
  }),
  metadata: Joi.object().optional(),
  movieInfo: Joi.object().optional(),
});

// Schéma de validation pour la création de bibliothèque
const createLibrarySchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Le nom est requis",
  }),
  path: Joi.string().required().messages({
    "any.required": "Le chemin est requis",
  }),
  type: Joi.string()
    .valid("movie", "tv", "music", "photo")
    .required()
    .messages({
      "any.only": "Le type doit être movie, tv, music ou photo",
      "any.required": "Le type est requis",
    }),
  description: Joi.string().optional().allow(""),
  autoScan: Joi.boolean().optional(),
  scanInterval: Joi.number().integer().min(1).optional(),
});

// Fonction utilitaire pour valider les données
function validateData(schema: Joi.ObjectSchema, data: any): ValidationResult {
  const { error } = schema.validate(data, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return { isValid: false, errors };
  }

  return { isValid: true };
}

// Fonctions de validation exportées
export function validateRegisterData(data: any): ValidationResult {
  return validateData(registerSchema, data);
}

export function validateLoginData(data: any): ValidationResult {
  return validateData(loginSchema, data);
}

export function validateCreateMediaData(data: any): ValidationResult {
  return validateData(createMediaSchema, data);
}

export function validateCreateLibraryData(data: any): ValidationResult {
  return validateData(createLibrarySchema, data);
}

// Validation pour les paramètres de recherche
export function validateSearchParams(params: any): ValidationResult {
  const schema = Joi.object({
    query: Joi.string().optional().allow(""),
    type: Joi.string().valid("movie", "tv", "music", "photo").optional(),
    genre: Joi.array().items(Joi.string()).optional(),
    year: Joi.number()
      .integer()
      .min(1900)
      .max(new Date().getFullYear() + 5)
      .optional(),
    rating: Joi.number().min(0).max(10).optional(),
    libraryId: Joi.number().integer().positive().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string()
      .valid("title", "createdAt", "viewCount", "rating", "year")
      .optional(),
    sortOrder: Joi.string().valid("ASC", "DESC").optional(),
  });

  return validateData(schema, params);
}

// Validation pour les notes
export function validateRatingData(data: any): ValidationResult {
  const schema = Joi.object({
    rating: Joi.number().min(0).max(10).required().messages({
      "number.min": "La note doit être entre 0 et 10",
      "number.max": "La note doit être entre 0 et 10",
      "any.required": "La note est requise",
    }),
    review: Joi.string().optional().allow(""),
    isSpoiler: Joi.boolean().optional(),
  });

  return validateData(schema, data);
}
