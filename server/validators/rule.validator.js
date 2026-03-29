const mongoose = require("mongoose");

/**
 * Validate create approval rule request
 * Checks: category, steps with proper structure, ruleTypes
 */
exports.validateCreateRule = (req) => {
  const errors = [];
  const {
    name,
    category,
    steps,
    isManagerApprover,
    employeeId,
    managerId,
    description,
    isSequence,
    minApprovalPercentage
  } = req.body;

  // Name validation
  if (!name || typeof name !== "string") {
    errors.push("name is required and must be a string");
  }

  if (description !== undefined && typeof description !== "string") {
    errors.push("description must be a string");
  }

  if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
    errors.push("employeeId is required and must be a valid ObjectId");
  }

  if (managerId !== undefined && managerId !== null && !mongoose.Types.ObjectId.isValid(managerId)) {
    errors.push("managerId must be a valid ObjectId when provided");
  }

  // Category validation
  if (category !== undefined && typeof category !== "string") {
    errors.push("category must be a string when provided");
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

          if (approver.isRequired !== undefined && typeof approver.isRequired !== "boolean") {
            errors.push(`steps[${idx}].approvers[${aidx}]: isRequired must be a boolean`);
          }

          if (approver.order !== undefined && typeof approver.order !== "number") {
            errors.push(`steps[${idx}].approvers[${aidx}]: order must be a number`);
          }
        });
      }
    });
  }

  // isManagerApprover validation (optional)
  if (isManagerApprover !== undefined && typeof isManagerApprover !== "boolean") {
    errors.push("isManagerApprover must be a boolean if provided");
  }

  if (isSequence !== undefined && typeof isSequence !== "boolean") {
    errors.push("isSequence must be a boolean if provided");
  }

  if (
    minApprovalPercentage !== undefined &&
    (typeof minApprovalPercentage !== "number" || minApprovalPercentage < 0 || minApprovalPercentage > 100)
  ) {
    errors.push("minApprovalPercentage must be a number between 0 and 100 if provided");
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
  const {
    name,
    category,
    steps,
    isManagerApprover,
    isActive,
    employeeId,
    managerId,
    description,
    isSequence,
    minApprovalPercentage
  } = req.body;

  // Name validation (optional)
  if (name !== undefined && typeof name !== "string") {
    errors.push("name must be a string");
  }

  if (description !== undefined && typeof description !== "string") {
    errors.push("description must be a string");
  }

  if (employeeId !== undefined && !mongoose.Types.ObjectId.isValid(employeeId)) {
    errors.push("employeeId must be a valid ObjectId");
  }

  if (managerId !== undefined && managerId !== null && !mongoose.Types.ObjectId.isValid(managerId)) {
    errors.push("managerId must be a valid ObjectId");
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

            if (approver.isRequired !== undefined && typeof approver.isRequired !== "boolean") {
              errors.push(`steps[${idx}].approvers[${aidx}]: isRequired must be a boolean`);
            }

            if (approver.order !== undefined && typeof approver.order !== "number") {
              errors.push(`steps[${idx}].approvers[${aidx}]: order must be a number`);
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

  if (isSequence !== undefined && typeof isSequence !== "boolean") {
    errors.push("isSequence must be a boolean");
  }

  if (
    minApprovalPercentage !== undefined &&
    (typeof minApprovalPercentage !== "number" || minApprovalPercentage < 0 || minApprovalPercentage > 100)
  ) {
    errors.push("minApprovalPercentage must be a number between 0 and 100");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
