const mongoose = require("mongoose");

/**
 * Validate create approval rule request
 * Checks: category, steps with proper structure, ruleTypes
 */
exports.validateCreateRule = (req) => {
  const errors = [];
  const { name, category, steps, isManagerApprover } = req.body;

  // Name validation
  if (!name || typeof name !== "string") {
    errors.push("name is required and must be a string");
  }

  // Category validation
  if (!category || typeof category !== "string") {
    errors.push("category is required and must be a string");
  }

  // Steps validation
  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push("steps must be a non-empty array");
  } else {
    steps.forEach((step, idx) => {
      if (step.stepIndex === undefined || typeof step.stepIndex !== "number") {
        errors.push(`steps[${idx}]: stepIndex is required and must be a number`);
      }

      if (!["sequential", "percentage", "specific", "hybrid"].includes(step.ruleType)) {
        errors.push(`steps[${idx}]: ruleType must be one of sequential, percentage, specific, hybrid`);
      }

      if (step.threshold !== undefined && typeof step.threshold !== "number") {
        errors.push(`steps[${idx}]: threshold must be a number if provided`);
      }

      if (step.isParallel !== undefined && typeof step.isParallel !== "boolean") {
        errors.push(`steps[${idx}]: isParallel must be a boolean`);
      }

      if (!Array.isArray(step.approvers) || step.approvers.length === 0) {
        errors.push(`steps[${idx}]: approvers must be a non-empty array`);
      } else {
        step.approvers.forEach((approver, aidx) => {
          if (!approver.userId || !mongoose.Types.ObjectId.isValid(approver.userId)) {
            errors.push(`steps[${idx}].approvers[${aidx}]: userId must be a valid ObjectId`);
          }
        });
      }
    });
  }

  // isManagerApprover validation (optional)
  if (isManagerApprover !== undefined && typeof isManagerApprover !== "boolean") {
    errors.push("isManagerApprover must be a boolean if provided");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate update approval rule request
 * All fields are optional
 */
exports.validateUpdateRule = (req) => {
  const errors = [];
  const { name, category, steps, isManagerApprover, isActive } = req.body;

  // Name validation (optional)
  if (name !== undefined && typeof name !== "string") {
    errors.push("name must be a string");
  }

  // Category validation (optional)
  if (category !== undefined && typeof category !== "string") {
    errors.push("category must be a string");
  }

  // Steps validation (optional)
  if (steps !== undefined) {
    if (!Array.isArray(steps) || steps.length === 0) {
      errors.push("steps must be a non-empty array if provided");
    } else {
      steps.forEach((step, idx) => {
        if (step.stepIndex === undefined || typeof step.stepIndex !== "number") {
          errors.push(`steps[${idx}]: stepIndex is required and must be a number`);
        }

        if (!["sequential", "percentage", "specific", "hybrid"].includes(step.ruleType)) {
          errors.push(`steps[${idx}]: ruleType must be one of sequential, percentage, specific, hybrid`);
        }

        if (step.threshold !== undefined && typeof step.threshold !== "number") {
          errors.push(`steps[${idx}]: threshold must be a number`);
        }

        if (step.isParallel !== undefined && typeof step.isParallel !== "boolean") {
          errors.push(`steps[${idx}]: isParallel must be a boolean`);
        }

        if (!Array.isArray(step.approvers) || step.approvers.length === 0) {
          errors.push(`steps[${idx}]: approvers must be a non-empty array`);
        } else {
          step.approvers.forEach((approver, aidx) => {
            if (!approver.userId || !mongoose.Types.ObjectId.isValid(approver.userId)) {
              errors.push(`steps[${idx}].approvers[${aidx}]: userId must be a valid ObjectId`);
            }
          });
        }
      });
    }
  }

  // isManagerApprover validation (optional)
  if (isManagerApprover !== undefined && typeof isManagerApprover !== "boolean") {
    errors.push("isManagerApprover must be a boolean");
  }

  // isActive validation (optional)
  if (isActive !== undefined && typeof isActive !== "boolean") {
    errors.push("isActive must be a boolean");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
