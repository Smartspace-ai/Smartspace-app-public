### Rich text + file handling behavior (Composer & MarkdownEditor)

Goal
- Provide a smooth chat composer that merges text and files/images into one unified rich-text payload, while preserving clarity and user control.

Behavior rules
1) Single payload
- All message content (text, images, files) is stored and sent as one structured rich-text payload.
- Files are represented as inline tags (e.g., [[file:ID|name]] or ss-file:ID).

2) Drop behavior
- Drop while typing / editor focused: insert at caret (inline in context).
- Drop when editor is empty or unfocused: show files in a bottom attachment bar under the composer.
- Never automatically flood inline when dropping multiple files.

3) Inline vs summary
- Inline placement is preferred for contextual clarity (e.g., image in sentence flow).
- All files (inline or not) appear summarized in a compact attachment strip at the bottom of the message for scannability.
- The summary deduplicates files and lists only unique attachments.

4) Attachment bar design
- Shows thumbnail/file cards with upload progress.
- Each card has: name, type icon/preview, progress or retry state.
- User can reorder, remove, or “insert into message” to move inline.
- On send: both inline and attached files go in the same payload.

5) Visual conventions
- Inline images render with small previews and optional captions.
- Non-image files render as compact chips (📄 spec.pdf, 🗎 trace.log).
- Attachment bar uses subtle borders/shadows, like Slack or ChatGPT style.

6) Sending
- Send button available when all files are uploaded or can send async with progress indicators.
- Backend extracts and deduplicates file tags from rich text to produce a manifest.

7) Copy/export rules
- Each file node has a readable fallback ([file: name.ext]) for text copy.
- Copying a message segment that includes a file tag should keep both rich and plain variants.

8) Accessibility
- Alt text/captions required for inline images.
- Keyboard navigation moves through file chips.
- Screen reader names each file node.

Outcome
- Feels natural and chat-like (drag, drop, type freely).
- Context preserved (files appear where mentioned).
- Still clean to scan (summary bar at bottom).
- Backend can reliably extract structured attachments.


