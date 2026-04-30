import { useState, useCallback, useMemo, useRef, useEffect } from "react";

/**
 * Custom hook for form management with validation, error handling, and submission state.
 *
 * @param {Object} options - Configuration options
 * @param {Object} [options.initialValues={}] - Initial form values
 * @param {Function} [options.validate] - Validation function (sync or async)
 * @param {Function} [options.onSubmit] - Submit handler
 * @param {boolean} [options.validateOnChange=true] - Validate on every change
 * @param {boolean} [options.validateOnBlur=false] - Validate on blur
 * @param {boolean} [options.clearErrorsOnChange=true] - Clear field error on change
 * @param {boolean} [options.clearErrorsOnSubmit=true] - Clear errors before submit
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @param {Function} [options.transform] - Transform values before validation/submit
 * @param {boolean} [options.stopValidationOnFirstError=false] - Stop validation on first error
 * @returns {Object} Form state and methods
 */
export const useForm = (options = {}) => {
  const {
    initialValues = {},
    validate,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = false,
    clearErrorsOnChange = true,
    clearErrorsOnSubmit = true,
    debug = false,
    transform,
    stopValidationOnFirstError = false,
  } = options;

  const debugRef = useRef(debug);
  useEffect(() => {
    debugRef.current = debug;
  }, [debug]);

  const log = useCallback((...args) => {
    if (debugRef.current && process.env.NODE_ENV === "development") {
      console.log("[useForm]", ...args);
    }
  }, []);

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [submitError, setSubmitError] = useState(null);

  const initialValuesRef = useRef(initialValues);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const transformValues = useCallback(
    (formValues) => {
      if (transform && typeof transform === "function") {
        try {
          const transformed = transform(formValues);
          log("Values transformed:", transformed);
          return transformed;
        } catch (error) {
          console.error("[useForm] Transform error:", error);
          return formValues;
        }
      }
      return formValues;
    },
    [transform, log],
  );

  // Validation function with abort support
  const runValidation = useCallback(
    async (formValues, fieldsToValidate = null) => {
      if (!validate) return {};

      // Cancel previous validation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        setIsValidating(true);

        let validationResult;
        const transformedValues = transformValues(formValues);

        if (fieldsToValidate) {
          // Validate specific fields
          const partialValues = {};
          fieldsToValidate.forEach((field) => {
            partialValues[field] = transformedValues[field];
          });
          validationResult = await validate(partialValues, transformedValues);
        } else {
          // Validate all fields
          validationResult = await validate(transformedValues);
        }

        // Check if validation was aborted
        if (abortController.signal.aborted) {
          log("Validation aborted");
          return {};
        }

        const validationErrors = validationResult || {};
        log("Validation result:", validationErrors);

        return validationErrors;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("[useForm] Validation error:", error);
        }
        return {};
      } finally {
        if (
          isMountedRef.current &&
          abortController === abortControllerRef.current
        ) {
          setIsValidating(false);
        }
      }
    },
    [validate, transformValues, log],
  );

  // Validate form
  const validateForm = useCallback(async () => {
    const validationErrors = await runValidation(values);

    if (isMountedRef.current) {
      setErrors(validationErrors);
    }

    return Object.keys(validationErrors).length === 0;
  }, [values, runValidation]);

  // Validate single field
  const validateField = useCallback(
    async (name, value) => {
      const validationErrors = await runValidation({ [name]: value }, [name]);
      const error = validationErrors[name] || "";

      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }

      return !error;
    },
    [runValidation],
  );

  // Validate multiple fields
  const validateFields = useCallback(
    async (fieldNames) => {
      const partialValues = {};
      fieldNames.forEach((name) => {
        partialValues[name] = values[name];
      });

      const validationErrors = await runValidation(partialValues, fieldNames);
      const newErrors = {};
      const isValid = {};

      fieldNames.forEach((name) => {
        const error = validationErrors[name] || "";
        newErrors[name] = error;
        isValid[name] = !error;
      });

      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
      }

      return isValid;
    },
    [values, runValidation],
  );

  // Handle field change
  const handleChange = useCallback(
    (e) => {
      let name, value, type, checked;

      // Handle different input types
      if (e && e.target) {
        name = e.target.name;
        value = e.target.value;
        type = e.target.type;
        checked = e.target.checked;
      } else if (typeof e === "string") {
        // Handle direct value updates
        name = e;
        value = arguments[1];
      } else {
        // Handle custom input
        name = e.name;
        value = e.value;
        type = e.type;
      }

      if (!name) {
        console.warn("[useForm] Input must have a name attribute");
        return;
      }

      // Determine new value
      let newValue;
      if (type === "checkbox") {
        newValue = checked !== undefined ? checked : value;
      } else if (type === "radio") {
        newValue = value;
      } else {
        newValue = value;
      }

      log("Field changed:", name, newValue);

      // Update values
      setValues((prev) => ({
        ...prev,
        [name]: newValue,
      }));

      // Clear error if configured
      if (clearErrorsOnChange && errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }

      // Validate on change if configured
      if (validateOnChange && validate) {
        validateField(name, newValue);
      }
    },
    [
      errors,
      validateOnChange,
      validate,
      validateField,
      clearErrorsOnChange,
      log,
    ],
  );

  // Handle field blur
  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;

      if (!name) return;

      log("Field blurred:", name);

      // Mark as touched
      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validate on blur if configured
      if (validateOnBlur && validate) {
        validateField(name, values[name]);
      }
    },
    [values, validateOnBlur, validate, validateField, log],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (submitHandler = onSubmit, event) => {
      // Prevent default if event is provided
      if (event && event.preventDefault) {
        event.preventDefault();
      }

      if (!submitHandler) {
        console.warn("[useForm] No submit handler provided");
        return;
      }

      log("Form submission started");

      setSubmitError(null);
      setIsSubmitting(true);
      setSubmitCount((prev) => prev + 1);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Clear errors if configured
      if (clearErrorsOnSubmit) {
        setErrors({});
      }

      // Validate all fields
      const isValid = await validateForm();

      if (!isValid) {
        log("Form validation failed");
        setIsSubmitting(false);
        return false;
      }

      try {
        log("Form submission executing");
        const transformedValues = transformValues(values);
        const result = await submitHandler(transformedValues, {
          setErrors,
          setValues,
          resetForm: () => resetForm(),
          setSubmitting: setIsSubmitting,
          setSubmitError,
        });

        log("Form submission successful");
        return result;
      } catch (error) {
        log("Form submission error:", error);

        // Handle submission errors
        const errorMessage =
          error.response?.data?.message || error.message || "Submission failed";
        setSubmitError(errorMessage);

        if (error.errors) {
          setErrors(error.errors);
        }

        if (error.fieldErrors) {
          setErrors(error.fieldErrors);
        }

        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [values, validateForm, onSubmit, transformValues, clearErrorsOnSubmit, log],
  );

  // Reset form
  const resetForm = useCallback(
    (newValues = initialValuesRef.current) => {
      log("Form reset");
      setValues(newValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setIsValidating(false);
      setSubmitError(null);
      setSubmitCount(0);
    },
    [log],
  );

  // Set field value programmatically
  const setFieldValue = useCallback(
    (name, value, shouldValidate = true) => {
      log("Setting field value:", name, value);

      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (shouldValidate && validate) {
        validateField(name, value);
      }
    },
    [validate, validateField, log],
  );

  // Set field error programmatically
  const setFieldError = useCallback(
    (name, error) => {
      log("Setting field error:", name, error);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [log],
  );

  // Set multiple values at once
  const setValuesBulk = useCallback(
    async (newValues, shouldValidate = true) => {
      log("Setting bulk values:", newValues);

      setValues((prev) => ({
        ...prev,
        ...newValues,
      }));

      if (shouldValidate && validate) {
        // Validate all changed fields
        const fieldNames = Object.keys(newValues);
        if (stopValidationOnFirstError) {
          for (const field of fieldNames) {
            const isValid = await validateField(field, newValues[field]);
            if (!isValid) break;
          }
        } else {
          fieldNames.forEach((field) => {
            validateField(field, newValues[field]);
          });
        }
      }
    },
    [validate, validateField, stopValidationOnFirstError, log],
  );

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && !isValidating;
  }, [errors, isValidating]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  // Check if form has been touched
  const isTouched = useMemo(() => {
    return Object.keys(touched).length > 0;
  }, [touched]);

  // Get field props for easy spreading
  const getFieldProps = useCallback(
    (name, options = {}) => ({
      name,
      value: values[name] !== undefined ? values[name] : "",
      onChange: handleChange,
      onBlur: handleBlur,
      error: errors[name],
      touched: touched[name],
      ...options,
    }),
    [values, errors, touched, handleChange, handleBlur],
  );

  // Get field status
  const getFieldStatus = useCallback(
    (name) => {
      const isTouched = touched[name];
      const error = errors[name];
      const value = values[name];
      const initialValue = initialValuesRef.current[name];

      return {
        isTouched,
        hasError: !!error,
        error,
        isValid: isTouched && !error,
        isDirty: value !== initialValue,
        value,
        initialValue,
      };
    },
    [values, errors, touched],
  );

  // Get form summary
  const getFormSummary = useCallback(() => {
    const totalFields = Object.keys(values).length;
    const filledFields = Object.values(values).filter(
      (v) => v !== null && v !== undefined && v !== "",
    ).length;
    const errorFields = Object.keys(errors).length;
    const touchedFields = Object.keys(touched).length;

    return {
      totalFields,
      filledFields,
      errorFields,
      touchedFields,
      completionRate: totalFields ? (filledFields / totalFields) * 100 : 0,
      isValid,
      isDirty,
      isTouched,
    };
  }, [values, errors, touched, isValid, isDirty, isTouched]);

  // Focus first error field
  const focusFirstError = useCallback(() => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [errors]);

  return {
    values,
    errors,
    touched,
    submitError,
    isSubmitting,
    isValidating,
    isValid,
    isDirty,
    isTouched,
    submitCount,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setValues: setValuesBulk,
    setErrors,
    setTouched,
    validateForm,
    validateField,
    validateFields,
    getFieldProps,
    getFieldStatus,
    getFormSummary,
    focusFirstError,
    clearForm: () => resetForm(initialValuesRef.current),
    reset: resetForm,
  };
};

/**
 * Enhanced version with array field support for dynamic form fields.
 */
export const useDynamicForm = (options = {}) => {
  const form = useForm(options);
  const { values, setValues, validateField, validateOnChange } = form;

  const addArrayField = useCallback(
    (fieldName, newItem = {}, shouldValidate = false) => {
      const currentArray = values[fieldName] || [];
      const newArray = [...currentArray, newItem];

      setValues({
        [fieldName]: newArray,
      });

      if (shouldValidate && validateOnChange) {
        validateField(`${fieldName}[${currentArray.length}]`, newItem);
      }

      return currentArray.length;
    },
    [values, setValues, validateField, validateOnChange],
  );

  const removeArrayField = useCallback(
    (fieldName, index) => {
      const currentArray = values[fieldName] || [];
      const newArray = currentArray.filter((_, i) => i !== index);

      setValues({
        [fieldName]: newArray,
      });

      form.setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${fieldName}[${index}]`];
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith(`${fieldName}[${index}].`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    },
    [values, setValues, form],
  );

  const updateArrayField = useCallback(
    (fieldName, index, updates, shouldValidate = true) => {
      const currentArray = values[fieldName] || [];
      const newArray = currentArray.map((item, i) =>
        i === index ? { ...item, ...updates } : item,
      );

      setValues({
        [fieldName]: newArray,
      });

      if (shouldValidate && validateOnChange) {
        Object.keys(updates).forEach((field) => {
          validateField(`${fieldName}[${index}].${field}`, updates[field]);
        });
      }
    },
    [values, setValues, validateField, validateOnChange],
  );

  const moveArrayField = useCallback(
    (fieldName, fromIndex, toIndex) => {
      const currentArray = values[fieldName] || [];
      const newArray = [...currentArray];
      const [movedItem] = newArray.splice(fromIndex, 1);
      newArray.splice(toIndex, 0, movedItem);

      setValues({ [fieldName]: newArray });
    },
    [values, setValues],
  );

  const swapArrayFields = useCallback(
    (fieldName, indexA, indexB) => {
      const currentArray = values[fieldName] || [];
      const newArray = [...currentArray];
      [newArray[indexA], newArray[indexB]] = [
        newArray[indexB],
        newArray[indexA],
      ];

      setValues({ [fieldName]: newArray });
    },
    [values, setValues],
  );

  const insertArrayField = useCallback(
    (fieldName, index, newItem = {}) => {
      const currentArray = values[fieldName] || [];
      const newArray = [
        ...currentArray.slice(0, index),
        newItem,
        ...currentArray.slice(index),
      ];

      setValues({ [fieldName]: newArray });
    },
    [values, setValues],
  );

  const clearArrayField = useCallback(
    (fieldName) => {
      setValues({ [fieldName]: [] });

      form.setErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith(`${fieldName}[`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    },
    [setValues, form],
  );

  return {
    ...form,
    arrayHelpers: {
      add: addArrayField,
      remove: removeArrayField,
      update: updateArrayField,
      move: moveArrayField,
      swap: swapArrayFields,
      insert: insertArrayField,
      clear: clearArrayField,
    },
  };
};

/**
 * Hook for multi-step/wizard forms.
 */
export const useWizardForm = (options = {}) => {
  const {
    steps = [],
    initialValues = {},
    validate,
    onSubmit,
    preserveStepData = false,
    onStepChange,
    ...formOptions
  } = options;

  const [currentStep, setCurrentStep] = useState(0);
  const [stepHistory, setStepHistory] = useState([0]);
  const [stepData, setStepData] = useState({});
  const [isNavigating, setIsNavigating] = useState(false);

  const form = useForm({
    initialValues,
    validate,
    ...formOptions,
  });

  const { values, setValues, validateForm, setErrors, errors } = form;

  const validateCurrentStep = useCallback(async () => {
    const currentStepConfig = steps[currentStep];

    if (currentStepConfig?.validate) {
      const stepValidation = await currentStepConfig.validate(values);
      if (Object.keys(stepValidation).length > 0) {
        setErrors(stepValidation);
        return false;
      }
    }

    return true;
  }, [currentStep, steps, values, setErrors]);

  const saveStepData = useCallback(() => {
    if (preserveStepData) {
      setStepData((prev) => ({
        ...prev,
        [currentStep]: values,
      }));
    }
  }, [currentStep, values, preserveStepData]);

  const loadStepData = useCallback(
    (step) => {
      if (preserveStepData && stepData[step]) {
        setValues(stepData[step]);
      }
    },
    [preserveStepData, stepData, setValues],
  );

  const goToStep = useCallback(
    async (step, skipValidation = false) => {
      if (step === currentStep) return true;
      if (step < 0 || step >= steps.length) return false;

      setIsNavigating(true);

      if (step > currentStep && !skipValidation) {
        const isValid = await validateCurrentStep();
        if (!isValid) {
          setIsNavigating(false);
          return false;
        }
      }

      saveStepData();
      setCurrentStep(step);
      setStepHistory((prev) => [...prev, step]);
      loadStepData(step);
      setErrors({});

      if (onStepChange && typeof onStepChange === "function") {
        onStepChange(step, steps[step]);
      }

      setIsNavigating(false);
      return true;
    },
    [
      currentStep,
      steps.length,
      validateCurrentStep,
      saveStepData,
      loadStepData,
      setErrors,
      onStepChange,
    ],
  );

  const nextStep = useCallback(async () => {
    if (currentStep < steps.length - 1) {
      return await goToStep(currentStep + 1);
    }
    return false;
  }, [currentStep, steps.length, goToStep]);

  const prevStep = useCallback(async () => {
    if (currentStep > 0) {
      return await goToStep(currentStep - 1);
    }
    return false;
  }, [currentStep, goToStep]);

  const jumpToStep = useCallback(
    (step) => {
      return goToStep(step, true);
    },
    [goToStep],
  );

  const handleFinalSubmit = useCallback(
    async (submitHandler = onSubmit) => {
      if (!submitHandler) {
        console.warn("[useWizardForm] No submit handler provided");
        return false;
      }

      const isCurrentStepValid = await validateCurrentStep();
      if (!isCurrentStepValid) return false;

      const isFormValid = await validateForm();
      if (!isFormValid) return false;

      try {
        return await submitHandler(values, {
          setErrors,
          setValues,
          resetForm: form.resetForm,
        });
      } catch (error) {
        console.error("[useWizardForm] Submission error:", error);
        throw error;
      }
    },
    [
      validateCurrentStep,
      validateForm,
      values,
      onSubmit,
      form.resetForm,
      setErrors,
      setValues,
    ],
  );

  const getStepStatus = useCallback(
    (stepIndex) => {
      if (stepIndex === currentStep) return "current";
      if (stepIndex < currentStep) return "completed";
      return "pending";
    },
    [currentStep],
  );

  const getStepValidationStatus = useCallback(
    async (stepIndex) => {
      const stepConfig = steps[stepIndex];
      if (!stepConfig?.validate) return true;

      const stepValidation = await stepConfig.validate(values);
      return Object.keys(stepValidation).length === 0;
    },
    [steps, values],
  );

  const goToFirstErrorStep = useCallback(async () => {
    for (let i = 0; i < steps.length; i++) {
      const stepConfig = steps[i];
      if (stepConfig?.validate) {
        const stepValidation = await stepConfig.validate(values);
        if (Object.keys(stepValidation).length > 0) {
          await goToStep(i, true);
          return i;
        }
      }
    }
    return -1;
  }, [steps, values, goToStep]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canGoNext = !isLastStep;
  const canGoPrev = !isFirstStep;

  return {
    ...form,
    currentStep,
    totalSteps: steps.length,
    stepConfig: steps[currentStep],
    stepHistory,
    isNavigating,
    goToStep,
    nextStep,
    prevStep,
    jumpToStep,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
    getStepStatus,
    getStepValidationStatus,
    goToFirstErrorStep,
    validateCurrentStep,
    handleFinalSubmit,
    stepData,
    saveStepData,
  };
};

useForm.displayName = "useForm";
useDynamicForm.displayName = "useDynamicForm";
useWizardForm.displayName = "useWizardForm";

export default useForm;
