export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
}
export declare function validateRegisterData(data: any): ValidationResult;
export declare function validateLoginData(data: any): ValidationResult;
export declare function validateCreateMediaData(data: any): ValidationResult;
export declare function validateCreateLibraryData(data: any): ValidationResult;
export declare function validateSearchParams(params: any): ValidationResult;
export declare function validateRatingData(data: any): ValidationResult;
//# sourceMappingURL=validation.d.ts.map