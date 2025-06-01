"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegisterData = validateRegisterData;
exports.validateLoginData = validateLoginData;
exports.validateCreateMediaData = validateCreateMediaData;
exports.validateCreateLibraryData = validateCreateLibraryData;
exports.validateSearchParams = validateSearchParams;
exports.validateRatingData = validateRatingData;
const joi_1 = __importDefault(require("joi"));
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        "string.email": "Format d'email invalide",
        "any.required": "L'email est requis",
    }),
    password: joi_1.default.string().min(6).required().messages({
        "string.min": "Le mot de passe doit contenir au moins 6 caractères",
        "any.required": "Le mot de passe est requis",
    }),
    firstName: joi_1.default.string().optional().allow(""),
    lastName: joi_1.default.string().optional().allow(""),
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        "string.email": "Format d'email invalide",
        "any.required": "L'email est requis",
    }),
    password: joi_1.default.string().required().messages({
        "any.required": "Le mot de passe est requis",
    }),
});
const createMediaSchema = joi_1.default.object({
    title: joi_1.default.string().required().messages({
        "any.required": "Le titre est requis",
    }),
    originalTitle: joi_1.default.string().optional().allow(""),
    description: joi_1.default.string().optional().allow(""),
    filePath: joi_1.default.string().required().messages({
        "any.required": "Le chemin du fichier est requis",
    }),
    thumbnailPath: joi_1.default.string().optional().allow(""),
    posterPath: joi_1.default.string().optional().allow(""),
    backdropPath: joi_1.default.string().optional().allow(""),
    type: joi_1.default.string()
        .valid("movie", "tv", "music", "photo")
        .required()
        .messages({
        "any.only": "Le type doit être movie, tv, music ou photo",
        "any.required": "Le type est requis",
    }),
    libraryId: joi_1.default.number().integer().positive().required().messages({
        "number.positive": "L'ID de la bibliothèque doit être positif",
        "any.required": "L'ID de la bibliothèque est requis",
    }),
    metadata: joi_1.default.object().optional(),
    movieInfo: joi_1.default.object().optional(),
});
const createLibrarySchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({
        "any.required": "Le nom est requis",
    }),
    path: joi_1.default.string().required().messages({
        "any.required": "Le chemin est requis",
    }),
    type: joi_1.default.string()
        .valid("movie", "tv", "music", "photo")
        .required()
        .messages({
        "any.only": "Le type doit être movie, tv, music ou photo",
        "any.required": "Le type est requis",
    }),
    description: joi_1.default.string().optional().allow(""),
    autoScan: joi_1.default.boolean().optional(),
    scanInterval: joi_1.default.number().integer().min(1).optional(),
});
function validateData(schema, data) {
    const { error } = schema.validate(data, { abortEarly: false });
    if (error) {
        const errors = error.details.map((detail) => detail.message);
        return { isValid: false, errors };
    }
    return { isValid: true };
}
function validateRegisterData(data) {
    return validateData(registerSchema, data);
}
function validateLoginData(data) {
    return validateData(loginSchema, data);
}
function validateCreateMediaData(data) {
    return validateData(createMediaSchema, data);
}
function validateCreateLibraryData(data) {
    return validateData(createLibrarySchema, data);
}
function validateSearchParams(params) {
    const schema = joi_1.default.object({
        query: joi_1.default.string().optional().allow(""),
        type: joi_1.default.string().valid("movie", "tv", "music", "photo").optional(),
        genre: joi_1.default.array().items(joi_1.default.string()).optional(),
        year: joi_1.default.number()
            .integer()
            .min(1900)
            .max(new Date().getFullYear() + 5)
            .optional(),
        rating: joi_1.default.number().min(0).max(10).optional(),
        libraryId: joi_1.default.number().integer().positive().optional(),
        page: joi_1.default.number().integer().min(1).optional(),
        limit: joi_1.default.number().integer().min(1).max(100).optional(),
        sortBy: joi_1.default.string()
            .valid("title", "createdAt", "viewCount", "rating", "year")
            .optional(),
        sortOrder: joi_1.default.string().valid("ASC", "DESC").optional(),
    });
    return validateData(schema, params);
}
function validateRatingData(data) {
    const schema = joi_1.default.object({
        rating: joi_1.default.number().min(0).max(10).required().messages({
            "number.min": "La note doit être entre 0 et 10",
            "number.max": "La note doit être entre 0 et 10",
            "any.required": "La note est requise",
        }),
        review: joi_1.default.string().optional().allow(""),
        isSpoiler: joi_1.default.boolean().optional(),
    });
    return validateData(schema, data);
}
//# sourceMappingURL=validation.js.map