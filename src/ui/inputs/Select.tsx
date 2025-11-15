import { Check, ChevronDown, X } from 'lucide-react';
import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Option = { label: string; value: string };
type Props = {
  options: Option[];
  value?: string | string[];
  onChange?: (next: string | string[] | undefined) => void;
  placeholder?: string;
  multiple?: boolean;
  compact?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  maxMenuHeight?: number;
  ariaLabel?: string;
  className?: string;
  sizeStyles?: string; // pass your existing sizing utility string
};

export const BCSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  multiple = false,
  compact = false,
  disabled = false,
  clearable = true,
  searchable = true,
  maxMenuHeight = 280,
  ariaLabel,
  className,
  sizeStyles = 'px-3 py-2 text-sm',
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const listboxId = useId();

  const normalizedValue = useMemo<string[]>(() => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }, [value]);

  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o] as const)), [options]);
  const resolvedLabel =
    !value || (Array.isArray(value) && value.length === 0)
      ? placeholder
      : Array.isArray(value)
        ? value.map((v) => byValue.get(v)?.label ?? v).join(', ')
        : (byValue.get(value as string)?.label ?? (value as string));

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const isSelected = (value: string) => {
    return normalizedValue.includes(value);
  };

  const toggle = (value: string) => {
    if (!onChange) return;
    if (multiple) {
      if (isSelected(value)) onChange(normalizedValue.filter((x) => x !== value));
      else onChange([...normalizedValue, value]);
    } else {
      onChange(value);
      setOpen(false);
    }
  };

  const clear = () => {
    onChange?.(multiple ? [] : undefined);
    setQuery('');
  };

  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const menuContainer = useMemo(() => {
    let el = document.getElementById('bcselect-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bcselect-portal';
      document.body.appendChild(el);
    }
    return el;
  }, []);

  const positionMenu = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const estimatedH = Math.min(maxMenuHeight, 320) + (searchable ? 48 : 0);
    const fitsBelow = r.bottom + estimatedH <= viewportH;
    setMenuStyle({
      position: 'fixed',
      top: Math.round(fitsBelow ? r.bottom + 8 : r.top - estimatedH - 8),
      left: Math.round(r.left),
      width: Math.round(r.width),
      zIndex: 60_000,
      maxHeight: maxMenuHeight,
    } as React.CSSProperties);
  };

  useLayoutEffect(() => {
    if (!open) return;
    positionMenu();
  }, [open, normalizedValue.length, options.length]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => {
      positionMenu();
    };
    const onResize = () => positionMenu();
    const onDocClick = (e: MouseEvent) => {
      if (!buttonRef.current) return;
      const target = e.target as Node;
      const inButton = buttonRef.current.contains(target);
      const inMenu = listRef.current?.parentElement?.contains(target) ?? false;
      if (!inButton && !inMenu) setOpen(false);
    };

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onDocClick);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) toggle(opt.value);
    }
  };

  return (
    <div className={'w-full inline-block ' + (className ?? '')}>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={onKeyDown}
          className={[
            'w-full flex items-center justify-between rounded-xl border text-left',
            'bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100',
            'shadow-sm data-[state=open]:ring-4 data-[state=open]:ring-indigo-100',
            'border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed',
            sizeStyles,
          ].join(' ')}
          data-state={open ? 'open' : 'closed'}
        >
          {/* Value area */}
          <span className="min-w-0 flex-1 truncate text-slate-700">
            {(!multiple || compact) && (
              <span className={resolvedLabel === placeholder ? 'text-slate-400' : undefined}>
                {resolvedLabel}
              </span>
            )}
            {multiple && !compact && (
              <span className="flex flex-wrap gap-1.5 -my-1">
                {normalizedValue.length === 0 && (
                  <span className="my-1 text-slate-400">{placeholder}</span>
                )}
                {normalizedValue.map((v) => (
                  <Chip
                    key={v}
                    label={byValue.get(v)?.label ?? v}
                    onRemove={() => toggle(v)}
                    disabled={disabled}
                  />
                ))}
              </span>
            )}
          </span>
          {/* Right controls */}
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {clearable &&
              ((multiple && normalizedValue.length > 0) || (!multiple && normalizedValue[0])) && (
                <button
                  type="button"
                  aria-label="Clear selection"
                  onClick={(e) => {
                    e.stopPropagation();
                    clear();
                  }}
                  className="rounded-md p-1 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              )}
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
        {/* Popover in a portal */}
        {open &&
          createPortal(
            <div
              style={menuStyle}
              className="rounded-xl border border-slate-200 bg-white shadow-xl"
            >
              {searchable && (
                <div className="border-b border-slate-200 p-2">
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type to filter..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveIndex(0);
                      }
                    }}
                  />
                </div>
              )}
              <ul
                id={listboxId}
                role="listbox"
                aria-multiselectable={multiple || undefined}
                ref={listRef}
                className="max-h-[inherit] overflow-auto py-1"
                onKeyDown={onKeyDown}
              >
                {filtered.length === 0 && (
                  <li className="px-3 py-2 text-sm text-slate-500">No results</li>
                )}
                {filtered.map((opt, idx) => {
                  const selected = isSelected(opt.value);
                  const active = idx === activeIndex;
                  return (
                    <li key={opt.value} role="option" aria-selected={selected} data-index={idx}>
                      <button
                        type="button"
                        className={[
                          'w-full flex items-center gap-2 px-3 py-2 text-left text-sm',
                          active ? 'bg-indigo-50' : '',
                          selected ? 'text-slate-900' : 'text-slate-700',
                          'hover:bg-indigo-50 focus:outline-none',
                        ].join(' ')}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => toggle(opt.value)}
                      >
                        {multiple ? (
                          <span
                            className={[
                              'inline-flex h-4 w-4 items-center justify-center rounded-sm border',
                              selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300',
                            ].join(' ')}
                          >
                            {selected && <Check className="h-3 w-3 text-white" />}
                          </span>
                        ) : (
                          <span
                            className={[
                              'h-2.5 w-2.5 rounded-full border',
                              selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300',
                            ].join(' ')}
                          />
                        )}
                        <span className="truncate">{opt.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>,
            menuContainer,
          )}
      </div>
    </div>
  );
};

const Chip = ({
  label,
  onRemove,
  disabled,
}: {
  label: string;
  onRemove: () => void;
  disabled?: boolean;
}) => {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs">
      {label}
      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded p-0.5 hover:bg-slate-200"
        >
          <X className="h-3 w-3 text-slate-600" />
        </button>
      )}
    </span>
  );
};
