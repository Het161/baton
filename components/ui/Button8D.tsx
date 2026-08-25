"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { registerMagnet } from "@/lib/pointerField";
import { useEnvironment } from "@/components/providers/Environment";

type Variant = "ember" | "ice" | "ghost";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** appends an arrow that nudges on hover */
  arrow?: boolean;
  className?: string;
  href?: string;
  /** external / same-page links skip the router */
  plainAnchor?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;

const MAX_TILT = 7;

export function Button8D({
  children,
  variant = "ember",
  size = "md",
  arrow = false,
  className = "",
  href,
  plainAnchor = false,
  ...rest
}: CommonProps) {
  const { reduced, coarse } = useEnvironment();
  const rootRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLElement>(null);
  const [pressed, setPressed] = useState(false);
  const [sweepKey, setSweepKey] = useState(0);

  const allowPhysics = !reduced && !coarse;

  // 1 · magnetic pull — shared listener, pointer-fine only
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !allowPhysics) return;
    return registerMagnet(
      root,
      (x, y) => {
        root.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      },
      { radius: 90, strength: 8 },
    );
  }, [allowPhysics]);

  // 2 · 3D tilt across the button face
  const handleTilt = useCallback(
    (event: React.PointerEvent) => {
      if (!allowPhysics) return;
      const body = bodyRef.current;
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      body.style.transform = `perspective(600px) rotateX(${(-ny * MAX_TILT).toFixed(2)}deg) rotateY(${(nx * MAX_TILT).toFixed(2)}deg)`;
    },
    [allowPhysics],
  );

  const resetTilt = useCallback(() => {
    const body = bodyRef.current;
    if (body) body.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg)";
  }, []);

  // 4 · specular sweep — replays once per hover-enter (and per tap)
  const fireSweep = useCallback(() => {
    if (reduced) return;
    setSweepKey((k) => k + 1);
  }, [reduced]);

  const onPointerEnter = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse") fireSweep();
  };

  const onPointerLeave = () => {
    resetTilt();
    setPressed(false);
  };

  // 5 · press physics — pointer and keyboard alike
  const onPointerDown = (event: React.PointerEvent) => {
    setPressed(true);
    if (event.pointerType !== "mouse") fireSweep();
  };
  const endPress = () => setPressed(false);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") setPressed(true);
  };
  const onKeyUp = (event: React.KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") setPressed(false);
  };

  const content = (
    <>
      <span className="b8d-face" aria-hidden="true">
        <span className="b8d-sheen" />
        {sweepKey > 0 && <span key={sweepKey} className="b8d-sweep" />}
      </span>
      <span className="b8d-label">
        {children}
        {arrow && (
          <span className="b8d-arrow" aria-hidden="true">
            →
          </span>
        )}
      </span>
    </>
  );

  const shared = {
    className: "b8d-body",
    onPointerMove: handleTilt,
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    onPointerUp: endPress,
    onPointerCancel: endPress,
    onKeyDown,
    onKeyUp,
    onBlur: endPress,
  };

  return (
    <span
      ref={rootRef}
      className={["b8d", `b8d-${variant}`, `b8d-${size}`, className].filter(Boolean).join(" ")}
      data-pressed={pressed ? "true" : "false"}
    >
      <span className="b8d-plate" aria-hidden="true" />
      {href ? (
        plainAnchor || href.startsWith("#") || href.startsWith("http") ? (
          <a
            ref={bodyRef as React.RefObject<HTMLAnchorElement>}
            href={href}
            {...shared}
            {...(rest as object)}
          >
            {content}
          </a>
        ) : (
          <Link
            ref={bodyRef as React.RefObject<HTMLAnchorElement>}
            href={href}
            {...shared}
            {...(rest as object)}
          >
            {content}
          </Link>
        )
      ) : (
        <button
          ref={bodyRef as React.RefObject<HTMLButtonElement>}
          type="button"
          {...shared}
          {...rest}
        >
          {content}
        </button>
      )}
    </span>
  );
}
