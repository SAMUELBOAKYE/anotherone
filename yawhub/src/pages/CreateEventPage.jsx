// src/pages/CreateEventPage.jsx - Complete Fixed Version
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EventForm from "../components/event/EventForm";
import { createEvent } from "../api/events";
import {
  validateEventData,
  sanitizeEventData,
  validateImageFile,
} from "../utils/eventValidation";
import { uploadImage } from "../utils/imageUpload";
import ErrorAlert from "../components/common/ErrorAlert";

// Constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
const AUTO_SAVE_INTERVAL = 30000;
const MAX_DRAFT_AGE = 7 * 24 * 60 * 60 * 1000;

const CreateEventPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const autoSaveTimerRef = useRef(null);
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draftSaved, setDraftSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    venue: "",
    category: "",
    capacity: "",
    price: "",
    isFree: true,
    isVirtual: false,
    virtualLink: "",
    image: null,
    imagePreview: null,
    speakers: [],
    tags: [],
    registrationDeadline: "",
    contactEmail: "",
    contactPhone: "",
    additionalInfo: "",
  });
  const [dirty, setDirty] = useState(false);

  // ============================================================
  // IMAGE HANDLING FUNCTIONS
  // ============================================================

  const handleImageUpload = useCallback(async (file) => {
    if (!file) return false;

    const validation = validateImageFile(file, {
      maxSize: MAX_IMAGE_SIZE,
      allowedTypes: ALLOWED_IMAGE_TYPES,
    });

    if (!validation.isValid) {
      setError(validation.error);
      return false;
    }

    try {
      setUploadProgress(0);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: reader.result,
        }));
        setDirty(true);
      };
      reader.readAsDataURL(file);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          setUploadProgress(progress);
        }
        if (progress >= 90) {
          clearInterval(interval);
        }
      }, 200);

      return true;
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      return false;
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      imagePreview: null,
    }));
    setDirty(true);
    setUploadProgress(0);
  }, []);

  // ============================================================
  // DRAFT MANAGEMENT FUNCTIONS
  // ============================================================

  const saveDraft = useCallback(() => {
    try {
      const draftData = {
        data: {
          ...formData,
          imagePreview: formData.imagePreview,
        },
        timestamp: Date.now(),
        userId: user?.id,
      };
      localStorage.setItem("event_draft", JSON.stringify(draftData));
      setLastSaved(new Date());
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  }, [formData, user]);

  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem("event_draft");
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        const draftAge = Date.now() - (parsedDraft.timestamp || 0);
        if (draftAge < MAX_DRAFT_AGE) {
          setFormData((prev) => ({
            ...prev,
            ...parsedDraft.data,
            imagePreview: parsedDraft.data.imagePreview || null,
          }));
          setDirty(true);
          setDraftSaved(true);
        } else {
          localStorage.removeItem("event_draft");
        }
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
    }
  }, []);

  const handleClearDraft = useCallback(() => {
    const confirmClear = window.confirm("Clear draft? This cannot be undone.");
    if (confirmClear) {
      localStorage.removeItem("event_draft");
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        venue: "",
        category: "",
        capacity: "",
        price: "",
        isFree: true,
        isVirtual: false,
        virtualLink: "",
        image: null,
        imagePreview: null,
        speakers: [],
        tags: [],
        registrationDeadline: "",
        contactEmail: "",
        contactPhone: "",
        additionalInfo: "",
      });
      setDirty(false);
      setDraftSaved(false);
      setError(null);
    }
  }, []);

  // ============================================================
  // FORM HANDLING FUNCTIONS
  // ============================================================

  const handleFormChange = useCallback((updatedData) => {
    setFormData((prev) => ({ ...prev, ...updatedData }));
    setDirty(true);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (eventData) => {
      setLoading(true);
      setError(null);

      try {
        const validation = validateEventData(eventData);
        if (!validation.isValid) {
          setError(validation.errors.join(", "));
          setLoading(false);
          return;
        }

        const sanitizedData = sanitizeEventData(eventData);

        if (eventData.image) {
          try {
            const uploadResult = await uploadImage(eventData.image, {
              onProgress: (progress) => setUploadProgress(progress),
            });
            sanitizedData.imageUrl = uploadResult.url;
          } catch (err) {
            setError("Failed to upload image. Please try again.");
            setLoading(false);
            return;
          }
        }

        const response = await createEvent(sanitizedData);

        if (response.success) {
          setSuccess(true);
          localStorage.removeItem("event_draft");
          setTimeout(() => {
            navigate(`/events/${response.event.id}`, {
              state: { message: "Event created successfully!" },
            });
          }, 2000);
        } else {
          throw new Error(response.message || "Failed to create event");
        }
      } catch (err) {
        setError(err.message || "Failed to create event. Please try again.");
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    },
    [navigate],
  );

  const handleCancel = useCallback(() => {
    if (dirty) {
      const confirmCancel = window.confirm("You have unsaved changes. Leave?");
      if (!confirmCancel) return;
    }
    navigate(-1);
  }, [dirty, navigate]);

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname,
          message: "Please login to create an event",
        },
      });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    if (dirty && !success) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(saveDraft, AUTO_SAVE_INTERVAL);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, dirty, success, saveDraft]);

  // ============================================================
  // RENDER
  // ============================================================

  if (!isAuthenticated) return null;

  if (success) {
    return (
      <div className="create-event-page">
        <div className="container">
          <div className="success-message">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3>Event Created Successfully!</h3>
              <p>Redirecting to event page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-event-page">
      <div className="page-header">
        <div className="container">
          <div className="page-header-content">
            <div className="page-header-text">
              <h1>Create New Event</h1>
              <p>Organize and manage university events</p>
            </div>
            <div className="page-header-actions">
              {draftSaved && (
                <div className="draft-badge">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Draft saved</span>
                </div>
              )}
              {lastSaved && (
                <div className="last-saved">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        <div className="event-form-container">
          <EventForm
            ref={formRef}
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            uploadProgress={uploadProgress}
            loading={loading}
            isEditing={false}
          />
        </div>

        {dirty && !success && (
          <div className="draft-actions">
            <button
              onClick={handleClearDraft}
              className="clear-draft-btn"
              disabled={loading}
            >
              Clear Draft
            </button>
            <button
              onClick={saveDraft}
              className="save-draft-btn"
              disabled={loading}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEventPage;
