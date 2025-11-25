/**
 * Form utility functions for FO management
 * DRY: Shared form transformation and normalization logic
 */

/**
 * Normalize image field value
 * Converts dash, whitespace, or empty strings to empty string
 */
export const normalizeImageField = (value: string | null | undefined): string => {
  const trimmed = value?.trim() || '';
  return trimmed === '-' ? '' : trimmed;
};

/**
 * Normalize all image fields in form data
 */
export const normalizeImageFields = (data: {
  isp_image?: string;
  pole_image?: string;
  junction_box_image?: string;
}): {
  isp_image: string;
  pole_image: string;
  junction_box_image: string;
} => {
  return {
    isp_image: normalizeImageField(data.isp_image),
    pole_image: normalizeImageField(data.pole_image),
    junction_box_image: normalizeImageField(data.junction_box_image),
  };
};

/**
 * Create transform function for Inertia useForm
 * Normalizes image fields before submission
 */
export const createImageFieldTransform = () => {
  return (data: {
    isp_image?: string;
    pole_image?: string;
    junction_box_image?: string;
    [key: string]: any;
  }) => {
    return {
      ...data,
      ...normalizeImageFields(data),
    };
  };
};