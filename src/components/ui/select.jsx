import * as React from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

const SelectContext = React.createContext(null);

function useSelectContext(componentName) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error(`${componentName} must be used inside Select`);
  }
  return context;
}

function getTextContent(children) {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getTextContent).join("");
  }

  if (React.isValidElement(children)) {
    return getTextContent(children.props.children);
  }

  return "";
}

function Select({
  value,
  defaultValue,
  onValueChange,
  children,
  className = "",
}) {
  const triggerRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const [labels, setLabels] = React.useState({});

  const selectedValue = value ?? internalValue;

  const setSelectedValue = React.useCallback(
    (nextValue) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
      setOpen(false);
    },
    [onValueChange, value]
  );

  const registerItem = React.useCallback((itemValue, label) => {
    setLabels((current) => {
      if (current[itemValue] === label) {
        return current;
      }
      return { ...current, [itemValue]: label };
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      const trigger = triggerRef.current;
      let targetNode = event?.target ?? null;
      if (targetNode?.nodeType === Node.TEXT_NODE) {
        targetNode = targetNode.parentElement;
      }

      const clickedInsideAnySelectContent = targetNode?.closest?.(
        "[data-hbc-select-content='true']"
      );

      if (trigger?.contains(targetNode) || clickedInsideAnySelectContent) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      selectedValue,
      selectedLabel: labels[selectedValue],
      setSelectedValue,
      registerItem,
      triggerRef,
    }),
    [labels, open, registerItem, selectedValue, setSelectedValue]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={`relative inline-block align-top ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function SelectGroup({ children }) {
  return children;
}

function SelectValue({ placeholder = "", children }) {
  const { selectedLabel, selectedValue } = useSelectContext("SelectValue");
  return (
    <span className="truncate">
      {children ?? selectedLabel ?? selectedValue ?? placeholder}
    </span>
  );
}

const SelectTrigger = React.forwardRef(
  ({ className = "", size = "default", children, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = useSelectContext("SelectTrigger");
    const baseStyles =
      "flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm whitespace-nowrap outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900";
    const sizeStyles = size === "sm" ? "h-8" : "h-11";

    const setRefs = React.useCallback(
      (node) => {
        triggerRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef, triggerRef]
    );

    return (
      <button
        ref={setRefs}
        type="button"
        aria-expanded={open}
        className={`${baseStyles} ${sizeStyles} ${className}`}
        onClick={() => setOpen((current) => !current)}
        {...props}
      >
        {children}
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 opacity-50 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef(
  ({ className = "", children, position = "popper", ...props }, ref) => {
    const { open, triggerRef } = useSelectContext("SelectContent");
    const [rect, setRect] = React.useState(null);

    React.useLayoutEffect(() => {
      if (!open) return;

      const updateRect = () => {
        const nextRect = triggerRef.current?.getBoundingClientRect();
        if (!nextRect) return;

        setRect({
          left: nextRect.left,
          top: nextRect.bottom + 4,
          width: nextRect.width,
        });
      };

      updateRect();
      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect, true);

      return () => {
        window.removeEventListener("resize", updateRect);
        window.removeEventListener("scroll", updateRect, true);
      };
    }, [open, triggerRef]);

    const baseStyles =
      "z-[100] max-h-96 min-w-[8rem] overflow-auto rounded-md border border-gray-200 bg-white p-1 text-gray-900 shadow-lg";

    if (!open) {
      return <div className="hidden">{children}</div>;
    }

    return createPortal(
      <div
        ref={ref}
        data-hbc-select-content="true"
        className={`${baseStyles} ${className}`}
        style={{
          position: "fixed",
          left: rect?.left ?? 0,
          top: rect?.top ?? 0,
          minWidth: rect?.width,
        }}
        {...props}
      >
        {children}
      </div>,
      document.body
    );
  }
);
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`px-2 py-1.5 text-xs font-semibold text-gray-500 ${className}`}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef(
  ({ className = "", children, value, disabled = false, ...props }, ref) => {
    const { selectedValue, setSelectedValue, registerItem } =
      useSelectContext("SelectItem");
    const label = React.useMemo(() => getTextContent(children), [children]);
    const selected = selectedValue === value;

    React.useEffect(() => {
      registerItem(value, label);
    }, [label, registerItem, value]);

    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={selected}
        disabled={disabled}
        className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-left text-sm outline-none hover:bg-purple-50 hover:text-purple-900 focus:bg-purple-50 focus:text-purple-900 disabled:pointer-events-none disabled:opacity-50 ${className}`}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!disabled) {
            setSelectedValue(value);
          }
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!disabled) {
            setSelectedValue(value);
          }
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSelectedValue(value);
          }
        }}
        {...props}
      >
        <span className="truncate">{children}</span>
        {selected && (
          <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <CheckIcon className="h-4 w-4" />
          </span>
        )}
      </button>
    );
  }
);
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`-mx-1 my-1 h-px bg-gray-200 ${className}`} {...props} />
));
SelectSeparator.displayName = "SelectSeparator";

const SelectScrollUpButton = React.forwardRef((props, ref) => (
  <div ref={ref} {...props} />
));
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = React.forwardRef((props, ref) => (
  <div ref={ref} {...props} />
));
SelectScrollDownButton.displayName = "SelectScrollDownButton";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
