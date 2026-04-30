// src/components/common/Modal.jsx
import React, { useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Minimize2,
  Maximize2,
  Move,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import "../../styles/components/Modal.css";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  variant = "default",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showHeader = true,
  showFooter = false,
  footer = null,
  className = "",
  onOpen = null,
  onCloseComplete = null,
  initialFocusRef = null,
  isCentered = true,
  isDraggable = false,
  isResizable = false,
  animation = "fade",
  transitionDuration = 300,
  zIndex = 1000,
  preventScroll = true,
  ariaLabel = "Modal dialog",
  ariaDescription = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modalSize, setModalSize] = useState({ width: null, height: null });
  const modalRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragElementRef = useRef(null);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (closeOnEscape && e.key === "Escape") {
        onClose();
      }
    },
    [closeOnEscape, onClose],
  );

  // Handle body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    if (preventScroll) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    }

    document.addEventListener("keydown", handleKeyDown);

    if (onOpen) onOpen();

    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      }
      document.removeEventListener("keydown", handleKeyDown);
      if (onCloseComplete) onCloseComplete();
    };
  }, [
    isOpen,
    preventScroll,
    handleKeyDown,
    onOpen,
    onCloseComplete,
    initialFocusRef,
  ]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Drag functionality
  const handleDragStart = (e) => {
    if (!isDraggable || isFullscreen) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y,
    };
  };

  const handleDragMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setDragPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    },
    [isDragging],
  );

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setDragPosition({ x: 0, y: 0 });
    }
  };

  // Get size class
  const getSizeClass = () => {
    if (isFullscreen) return "modal-fullscreen";
    switch (size) {
      case "small":
        return "modal-small";
      case "large":
        return "modal-large";
      case "xl":
        return "modal-xl";
      default:
        return "modal-medium";
    }
  };

  // Get variant class
  const getVariantClass = () => {
    switch (variant) {
      case "success":
        return "modal-success";
      case "error":
        return "modal-error";
      case "warning":
        return "modal-warning";
      case "info":
        return "modal-info";
      default:
        return "";
    }
  };

  // Get animation variants
  const getAnimationVariants = () => {
    const animations = {
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      scale: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
      },
      slide: {
        initial: { opacity: 0, y: -50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
      },
      slideBottom: {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
      },
      slideLeft: {
        initial: { opacity: 0, x: -50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
      },
      slideRight: {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 50 },
      },
      zoom: {
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.5 },
      },
      rotate: {
        initial: { opacity: 0, rotateX: -90, y: 50 },
        animate: { opacity: 1, rotateX: 0, y: 0 },
        exit: { opacity: 0, rotateX: 90, y: 50 },
      },
      flip: {
        initial: { opacity: 0, rotateY: -90 },
        animate: { opacity: 1, rotateY: 0 },
        exit: { opacity: 0, rotateY: 90 },
      },
    };
    return animations[animation] || animations.fade;
  };

  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Get variant icon
  const getVariantIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle size={24} />;
      case "error":
        return <AlertCircle size={24} />;
      case "warning":
        return <AlertTriangle size={24} />;
      case "info":
        return <Info size={24} />;
      default:
        return null;
    }
  };

  const modalStyle = {
    ...(dragPosition.x !== 0 || dragPosition.y !== 0
      ? {
          transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
        }
      : {}),
    ...(modalSize.width ? { width: modalSize.width } : {}),
    ...(modalSize.height ? { height: modalSize.height } : {}),
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className={`modal-overlay ${getVariantClass()}`}
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: transitionDuration / 1000 }}
          onClick={handleBackdropClick}
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-describedby={ariaDescription || undefined}
        >
          <motion.div
            ref={modalRef}
            className={`modal-container ${getSizeClass()} ${className} ${isDraggable ? "modal-draggable" : ""} ${isDragging ? "modal-dragging" : ""}`}
            variants={getAnimationVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: transitionDuration / 1000,
            }}
            style={modalStyle}
          >
            {showHeader && (
              <div
                className={`modal-header ${isDraggable ? "modal-header-draggable" : ""}`}
                onMouseDown={isDraggable ? handleDragStart : undefined}
                ref={dragElementRef}
              >
                <div className="modal-header-left">
                  {getVariantIcon() && (
                    <div className={`modal-header-icon variant-${variant}`}>
                      {getVariantIcon()}
                    </div>
                  )}
                  <h2 className="modal-title">{title}</h2>
                </div>
                <div className="modal-header-actions">
                  {isResizable && !isFullscreen && (
                    <button
                      className="modal-resize-btn"
                      onClick={() => {
                        // Implement resize functionality
                        const newWidth = prompt("Enter width (px):", "600");
                        if (newWidth)
                          setModalSize({
                            ...modalSize,
                            width: parseInt(newWidth),
                          });
                      }}
                      aria-label="Resize modal"
                    >
                      <Move size={18} />
                    </button>
                  )}
                  <button
                    className="modal-fullscreen-btn"
                    onClick={toggleFullscreen}
                    aria-label={
                      isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                    }
                  >
                    {isFullscreen ? (
                      <Minimize2 size={18} />
                    ) : (
                      <Maximize2 size={18} />
                    )}
                  </button>
                  {showCloseButton && (
                    <button
                      className="modal-close-btn"
                      onClick={onClose}
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="modal-body">{children}</div>

            {showFooter && footer && (
              <div className="modal-footer">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(["small", "medium", "large", "xl"]),
  variant: PropTypes.oneOf(["default", "success", "error", "warning", "info"]),
  showCloseButton: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  showHeader: PropTypes.bool,
  showFooter: PropTypes.bool,
  footer: PropTypes.node,
  className: PropTypes.string,
  onOpen: PropTypes.func,
  onCloseComplete: PropTypes.func,
  initialFocusRef: PropTypes.object,
  isCentered: PropTypes.bool,
  isDraggable: PropTypes.bool,
  isResizable: PropTypes.bool,
  animation: PropTypes.oneOf([
    "fade",
    "scale",
    "slide",
    "slideBottom",
    "slideLeft",
    "slideRight",
    "zoom",
    "rotate",
    "flip",
  ]),
  transitionDuration: PropTypes.number,
  zIndex: PropTypes.number,
  preventScroll: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaDescription: PropTypes.string,
};

Modal.defaultProps = {
  size: "medium",
  variant: "default",
  showCloseButton: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  showHeader: true,
  showFooter: false,
  className: "",
  isCentered: true,
  isDraggable: false,
  isResizable: false,
  animation: "fade",
  transitionDuration: 300,
  zIndex: 1000,
  preventScroll: true,
  ariaLabel: "Modal dialog",
};

export default Modal;
