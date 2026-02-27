import { useCallback, useEffect, useRef, useState } from "react";

const hoverCapableMediaQuery = "(hover: hover) and (pointer: fine)";
const defaultWidth = 330;
const defaultHeight = 210;
const defaultPadding = 12;
const defaultOffset = 18;

function getHoverPreviewPosition(clientX, clientY, width, height, padding, offset) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = clientX + offset;
  let top = clientY - 24;

  if (left + width > viewportWidth - padding) {
    left = clientX - width - offset;
  }
  if (left < padding) {
    left = padding;
  }

  if (top + height > viewportHeight - padding) {
    top = viewportHeight - height - padding;
  }
  if (top < padding) {
    top = padding;
  }

  return { left, top };
}

export function useHoverMediaPreview(options = {}) {
  const width = options.width ?? defaultWidth;
  const height = options.height ?? defaultHeight;
  const padding = options.padding ?? defaultPadding;
  const offset = options.offset ?? defaultOffset;

  const [preview, setPreview] = useState(null);
  const [isEnabled, setIsEnabled] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(hoverCapableMediaQuery).matches : false
  );

  const cardRef = useRef(null);
  const previewRafRef = useRef(null);
  const previewNextPosRef = useRef(null);

  const cancelPreviewFrame = useCallback(() => {
    if (previewRafRef.current != null) {
      window.cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = null;
    }
  }, []);

  const clearPreview = useCallback(() => {
    cancelPreviewFrame();
    previewNextPosRef.current = null;
    setPreview(null);
  }, [cancelPreviewFrame]);

  const queuePreviewPosition = useCallback(
    (clientX, clientY) => {
      previewNextPosRef.current = getHoverPreviewPosition(
        clientX,
        clientY,
        width,
        height,
        padding,
        offset
      );

      if (previewRafRef.current != null) return;

      previewRafRef.current = window.requestAnimationFrame(() => {
        previewRafRef.current = null;

        const node = cardRef.current;
        const pos = previewNextPosRef.current;
        if (!node || !pos) return;

        node.style.left = `${pos.left}px`;
        node.style.top = `${pos.top}px`;
      });
    },
    [height, offset, padding, width]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(hoverCapableMediaQuery);
    const handleCapabilityChange = (event) => {
      setIsEnabled(event.matches);
      if (!event.matches) {
        clearPreview();
      }
    };

    setIsEnabled(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleCapabilityChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleCapabilityChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleCapabilityChange);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(handleCapabilityChange);
      }
    };
  }, [clearPreview]);

  useEffect(() => {
    if (!isEnabled) return;

    window.addEventListener("resize", clearPreview);
    window.addEventListener("scroll", clearPreview, true);

    return () => {
      window.removeEventListener("resize", clearPreview);
      window.removeEventListener("scroll", clearPreview, true);
    };
  }, [isEnabled, clearPreview]);

  useEffect(() => () => cancelPreviewFrame(), [cancelPreviewFrame]);

  const getTriggerProps = useCallback(
    (source) => {
      const resolveSource = typeof source === "function" ? source : () => source;

      return {
        onMouseEnter: (event) => {
          if (!isEnabled) return;

          const data = resolveSource();
          if (!data?.image || !data?.title) return;

          const { left, top } = getHoverPreviewPosition(
            event.clientX,
            event.clientY,
            width,
            height,
            padding,
            offset
          );

          cancelPreviewFrame();
          previewNextPosRef.current = { left, top };

          setPreview({
            left,
            top,
            title: data.title,
            image: data.image,
            meta: data.meta || "",
          });
        },
        onMouseMove: (event) => {
          if (!isEnabled || !cardRef.current) return;
          queuePreviewPosition(event.clientX, event.clientY);
        },
        onMouseLeave: () => {
          if (!isEnabled) return;
          clearPreview();
        },
      };
    },
    [isEnabled, width, height, padding, offset, cancelPreviewFrame, clearPreview, queuePreviewPosition]
  );

  return { preview, cardRef, isEnabled, clearPreview, getTriggerProps };
}
