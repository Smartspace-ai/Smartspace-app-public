import { MentionUser } from '@/models/mention-user';
import {
    Avatar,
    IconButton,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Popover,
    SxProps,
    TextField,
    Theme,
} from '@mui/material';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getCaretCoordinates } from './textarea-caret';

interface PopoverPosition {
  top: number;
  left: number;
  direction: 'above' | 'below';
}

interface MentionInputProps {
  value: { plain: string; withMentions: string };
  onChange: React.Dispatch<
    React.SetStateAction<{
      plain: string;
      withMentions: string;
    }>
  >;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  users: MentionUser[];
  mentionList: MentionUser[];
  setMentionList: React.Dispatch<React.SetStateAction<MentionUser[]>>;
  minRows?: number;
  maxRows?: number;
  inputSx?: SxProps<Theme>;
  autoFocus?: boolean;
  shouldFocus?: boolean;
  placeholder?: string;
  showFullscreenToggle?: boolean;
}

export const MentionInput = (props: MentionInputProps) => {
  const { value, onChange, setSearchTerm, users, mentionList, setMentionList, minRows, maxRows, inputSx, autoFocus, shouldFocus, placeholder, showFullscreenToggle = true } =
    props;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [selectIndex, setSelectIndex] = useState(0);
  const [openPopover, setOpenPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({
    top: 0,
    left: 0,
    direction: 'above',
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExpand, setShowExpand] = useState(false);

  const closePopover = () => {
    setOpenPopover(false);
    setSelectIndex(0);
    setPopoverPosition({ top: 0, left: 0, direction: 'above' });
  };

  const getActiveMention = () => {
    const el = inputRef.current;
    if (!el) return null;
    const caret = el.selectionEnd ?? 0;
    const text = el.value ?? '';
    const atIndex = text.lastIndexOf('@', Math.max(0, caret - 1));
    if (atIndex === -1) return null;
    const candidate = text.slice(atIndex + 1, caret);
    if (/\s/.test(candidate)) return null;
    return { atIndex, candidate, caret };
  };

  const updateAtAnchorPosition = () => {
    const el = inputRef.current;
    if (!el) return;

    const caret = el.selectionEnd ?? 0;
    const atIndex = el.value.lastIndexOf('@', caret - 1);
    if (atIndex === -1) return;

    const coords = getCaretCoordinates(el, atIndex);
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 24;

    const topInViewport = rect.top + coords.top - el.scrollTop;
    const leftInViewport = rect.left + coords.left - el.scrollLeft;

    const direction: 'above' | 'below' =
      window.innerHeight - topInViewport < 300 ? 'above' : 'below';

    setPopoverPosition({
      top: direction === 'above' ? topInViewport : topInViewport + lineHeight,
      left: leftInViewport,
      direction,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Determine if the caret is currently within an active mention context
    const el = inputRef.current;
    let active = null as null | { atIndex: number; candidate: string; caret: number };
    if (el) {
      // Temporarily set element value so selection math is accurate during change
      // (React controlled input already has this value queued.)
      el.value = newValue;
      active = getActiveMention();
    }

    if (active) {
      setSearchTerm(active.candidate);
      setOpenPopover(true);
      updateAtAnchorPosition();
    } else {
      setOpenPopover(false);
    }

    const { withMentions, mentionList: newMentionList } =
      buildWithMentionsFromPlain(newValue, mentionList);
    onChange({ plain: newValue, withMentions });
    setMentionList(newMentionList);

    // line count check for expand toggle
    
    if (el) {
      const style = window.getComputedStyle(el);
      let lineHeight = parseFloat(style.lineHeight || '');
      if (!lineHeight || Number.isNaN(lineHeight)) {
        const fontSize = parseFloat(style.fontSize || '16');
        lineHeight = fontSize * 1.4;
      }
      if (lineHeight > 0) {
        const computedHeight = Math.min(el.scrollHeight, el.clientHeight || el.scrollHeight);
        const lines = Math.round(computedHeight / lineHeight);
        setShowExpand(lines >= 4);
      }
    }
  };

  const handleUserSelect = (user: MentionUser) => {
    if (inputRef.current) {
      const caretPosition = inputRef.current.selectionStart ?? 0;
      const recentAt = value.plain.lastIndexOf('@', caretPosition - 1);
      const inserted = user.displayName + ' ';
      const newPlainValue =
        value.plain.slice(0, recentAt + 1) +
        inserted +
        value.plain.slice(caretPosition);

      const updatedMentionList = mentionList.some((m) => m.id === user.id)
        ? mentionList
        : [...mentionList, user];

      const { withMentions, mentionList: newMentionList } =
        buildWithMentionsFromPlain(newPlainValue, updatedMentionList);

      onChange({ plain: newPlainValue, withMentions });
      setMentionList(newMentionList);
      closePopover();

      // Place caret just after the inserted mention and trailing space
      requestAnimationFrame(() => {
        const pos = recentAt + 1 + inserted.length;
        inputRef.current?.setSelectionRange(pos, pos);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const active = getActiveMention();
    const shouldHandleMentionKeys = openPopover && !!active;
    if (shouldHandleMentionKeys) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectIndex < users.length - 1) {
          setSelectIndex(selectIndex + 1);
        } else {
          setSelectIndex(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectIndex > 0) {
          setSelectIndex(selectIndex - 1);
        } else {
          setSelectIndex(users.length - 1);
        }
      } else if (e.key === 'Enter') {
        if (users.length > 0) {
          e.preventDefault();
          handleUserSelect(users[selectIndex]);
          return;
        }
      }
    }
    if (e.key === 'Backspace') {
      const el = inputRef.current;
      if (!el) return;
      const selectionStart = el.selectionStart ?? 0;
      const selectionEnd = el.selectionEnd ?? 0;
      if (selectionStart !== selectionEnd) return;
      const caret = selectionStart;
      if (caret === 0) return;
      const text = value.plain;
      const atIndex = text.lastIndexOf('@', caret - 1);
      if (atIndex === -1) return;
      const candidate = text.slice(atIndex + 1, caret);
      if (!candidate) return;
      const matchedUser = mentionList.find((u) => u.displayName === candidate);
      if (!matchedUser) return;
      const nextChar = text.charAt(caret);
      const boundaryOkay = caret === text.length || /\W/.test(nextChar);
      if (!boundaryOkay) return;

      e.preventDefault();
      const newPlain = text.slice(0, atIndex) + text.slice(caret);
      const { withMentions, mentionList: newMentionList } =
        buildWithMentionsFromPlain(newPlain, mentionList);

      setMentionList(newMentionList);
      onChange({ plain: newPlain, withMentions });

      requestAnimationFrame(() => {
        const pos = atIndex;
        inputRef.current?.setSelectionRange(pos, pos);
      });
    }
  };

  //this should keep the popover positioned correctly if the window scrolls or the textarea scrolls
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const recalc = () => {
      if (openPopover) updateAtAnchorPosition();
    };

    el.addEventListener('scroll', recalc, { passive: true });
    window.addEventListener('scroll', recalc, { passive: true });
    window.addEventListener('resize', recalc);

    return () => {
      el.removeEventListener('scroll', recalc);
      window.removeEventListener('scroll', recalc);
      window.removeEventListener('resize', recalc);
    };
  }, [openPopover]);

  // Focus when explicitly requested
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true } as any);
      }, 30);
    }
  }, [shouldFocus]);

  // When value updates externally, recompute expand visibility
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      const style = window.getComputedStyle(el);
      let lineHeight = parseFloat(style.lineHeight || '');
      if (!lineHeight || Number.isNaN(lineHeight)) {
        const fontSize = parseFloat(style.fontSize || '16');
        lineHeight = fontSize * 1.4;
      }
      if (lineHeight > 0) {
        const computedHeight = Math.min(el.scrollHeight, el.clientHeight || el.scrollHeight);
        const lines = Math.round(computedHeight / lineHeight);
        setShowExpand(lines >= 4);
      }
    }
  }, [value.plain]);

  return (
    <>
      {!isFullscreen && (
        <div style={{ position: 'relative' }}>
          <TextField
            inputRef={inputRef}
            minRows={minRows ?? 4}
            maxRows={maxRows ?? 10}
            multiline
            fullWidth
            value={value.plain}
            placeholder={placeholder}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            sx={[
              {
                '& .MuiInputBase-root': {
                  px: 1,
                  py: 0.5,
                  backgroundColor: 'var(--card, var(--background, #fff))',
                },
                '& .MuiInputBase-inputMultiline': {
                  overflowY: 'auto',
                  fontSize: '16px',
                  WebkitTextSizeAdjust: '100%',
                  backgroundColor: 'var(--card, var(--background, #fff))',
                },
                '& .MuiInputBase-input': {
                  backgroundColor: 'var(--card, var(--background, #fff))',
                },
              },
              inputSx,
            ]}
          />
          {showFullscreenToggle && showExpand && (
            <IconButton
              onClick={() => setIsFullscreen(true)}
              size="small"
              aria-label="Expand"
              sx={{ position: 'absolute', top: 4, right: 4 }}
            >
              <Maximize2 size={16} />
            </IconButton>
          )}
        </div>
      )}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: '5vh', height: '95vh', left: 0, right: 0, zIndex: 1300 }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--background, #fff)', border: '1px solid var(--border, rgba(0,0,0,0.12))', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFullscreen(false);
              }}
              size="small"
              aria-label="Collapse"
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
            >
              <Minimize2 size={16} />
            </IconButton>
            <div style={{ width: '100%', height: '100%', padding: 8 }}>
              <TextField
                inputRef={inputRef}
                multiline
                fullWidth
                value={value.plain}
                placeholder={placeholder}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoFocus
                minRows={Math.max(minRows ?? 10, 10)}
                sx={{
                  height: '100%',
                  '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start', backgroundColor: 'var(--card, var(--background, #fff))' },
                  '& .MuiInputBase-inputMultiline': { height: '100%', overflowY: 'auto', fontSize: '16px', WebkitTextSizeAdjust: '100%', backgroundColor: 'var(--card, var(--background, #fff))' },
                  '& .MuiInputBase-input': { backgroundColor: 'var(--card, var(--background, #fff))' },
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
      <Popover
        disablePortal
        disableAutoFocus={true}
        open={
          users.length > 0 &&
          openPopover &&
          popoverPosition.top !== 0 &&
          popoverPosition.left !== 0
        }
        onClose={closePopover}
        anchorReference="anchorPosition"
        anchorPosition={popoverPosition}
        anchorOrigin={{
          vertical: popoverPosition.direction === 'above' ? 'top' : 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: popoverPosition.direction === 'above' ? 'bottom' : 'top',
          horizontal: 'left',
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <List>
          {users.map((user, index) => (
            <ListItemButton
              key={user.id}
              selected={index === selectIndex}
              onClick={(e) => {
                e.stopPropagation();
                handleUserSelect(user);
              }}
            >
              <ListItemAvatar>
                <Avatar src={user.display} />
              </ListItemAvatar>
              <ListItemText primary={user.displayName} />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  );
};

const buildWithMentionsFromPlain = (
  plain: string,
  list: MentionUser[],
): { withMentions: string; mentionList: MentionUser[] } => {
  if (!list || list.length === 0)
    return { withMentions: plain, mentionList: [] };

  const displayNameToId = new Map(list.map((u) => [u.displayName, u.id]));
  const alternation = list
    .map((u) => u.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');

  const mentionRegex = new RegExp(`@(${alternation})(?=$|\\W)`, 'g');

  const newWithMentions = plain.replace(
    mentionRegex,
    (_match, displayName: string) => {
      const id = displayNameToId.get(displayName);
      return id ? `@[${displayName}](${id})` : _match;
    },
  );

  const mentionedIds = new Set(
    [...newWithMentions.matchAll(/@\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]),
  );
  const newMentionList = list.filter((user) => mentionedIds.has(user.id));

  return {
    withMentions: newWithMentions,
    mentionList: newMentionList as MentionUser[],
  };
};
