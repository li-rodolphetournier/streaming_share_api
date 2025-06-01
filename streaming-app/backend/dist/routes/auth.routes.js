"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../controllers/auth.controller");
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/reset-password", authController.resetPassword);
router.use(auth_middleware_1.authMiddleware.authenticate);
router.get("/profile", authController.getProfile);
router.put("/profile", authController.updateProfile);
router.post("/change-password", authController.changePassword);
router.post("/logout", authController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map