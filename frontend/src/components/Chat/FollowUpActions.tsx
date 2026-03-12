interface Action {
  label: string;
  msg: string;
}

const FOLLOW_UPS: Record<string, Action[]> = {
  compress_pdf: [
    { label: 'Convert to Word', msg: 'Convert to Word' },
    { label: 'Add page numbers', msg: 'Add page numbers' },
    { label: 'Summarize', msg: 'Summarize this document' },
  ],
  pdf_to_word: [
    { label: 'Track changes', msg: 'Enable track changes' },
    { label: 'Add page numbers', msg: 'Add page numbers' },
  ],
  pdf_to_jpg: [
    { label: 'Remove background', msg: 'Remove background' },
    { label: 'Compress image', msg: 'Compress this image' },
  ],
  pdf_to_png: [
    { label: 'Remove background', msg: 'Remove background' },
    { label: 'Compress image', msg: 'Compress this image' },
  ],
  word_to_pdf: [
    { label: 'Compress PDF', msg: 'Compress this PDF' },
    { label: 'Add page numbers', msg: 'Add page numbers' },
    { label: 'Password protect', msg: 'Password protect this PDF' },
  ],
  summarize_document: [
    { label: 'Study questions', msg: 'Generate study questions from this document' },
    { label: 'Key terms', msg: 'Extract key terms and definitions' },
    { label: 'Get citation', msg: 'Get citation for this document' },
  ],
  generate_study_questions: [
    { label: 'Summarize', msg: 'Summarize this document' },
    { label: 'Key terms', msg: 'Extract key terms and definitions' },
    { label: 'Get citation', msg: 'Get citation for this document' },
  ],
  extract_key_terms: [
    { label: 'Summarize', msg: 'Summarize this document' },
    { label: 'Study questions', msg: 'Generate study questions from this document' },
    { label: 'Get citation', msg: 'Get citation for this document' },
  ],
  generate_citation: [
    { label: 'Summarize', msg: 'Summarize this document' },
    { label: 'Study questions', msg: 'Generate study questions from this document' },
  ],
  ocr: [
    { label: 'Summarize', msg: 'Summarize this document' },
    { label: 'Extract text', msg: 'Extract text from this document' },
    { label: 'Study questions', msg: 'Generate study questions from this document' },
  ],
  extract_text: [
    { label: 'Summarize', msg: 'Summarize this document' },
    { label: 'Key terms', msg: 'Extract key terms and definitions' },
  ],
  transcribe_audio: [
    { label: 'Summarize transcript', msg: 'Summarize this document' },
    { label: 'Key terms', msg: 'Extract key terms and definitions' },
    { label: 'Study questions', msg: 'Generate study questions from this document' },
  ],
  remove_background: [
    { label: 'Compress image', msg: 'Compress this image' },
    { label: 'Convert to PDF', msg: 'Convert to PDF' },
  ],
  resize_image: [
    { label: 'Compress image', msg: 'Compress this image' },
    { label: 'Remove background', msg: 'Remove background' },
  ],
  merge_pdf: [
    { label: 'Compress PDF', msg: 'Compress this PDF' },
    { label: 'Add page numbers', msg: 'Add page numbers' },
  ],
  split_pdf: [
    { label: 'Compress PDF', msg: 'Compress this PDF' },
    { label: 'Convert to Word', msg: 'Convert to Word' },
  ],
  add_watermark_pdf: [
    { label: 'Password protect', msg: 'Password protect this PDF' },
    { label: 'Compress PDF', msg: 'Compress this PDF' },
  ],
  password_protect_pdf: [
    { label: 'Add watermark', msg: 'Add watermark CONFIDENTIAL' },
    { label: 'Compress PDF', msg: 'Compress this PDF' },
  ],
};

interface Props {
  toolName: string;
  onSend: (msg: string) => void;
  disabled?: boolean;
}

export default function FollowUpActions({ toolName, onSend, disabled }: Props) {
  const actions = FOLLOW_UPS[toolName];
  if (!actions || actions.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid var(--border)',
      }}
    >
      {actions.map(({ label, msg }) => (
        <button
          key={label}
          type="button"
          onClick={() => onSend(msg)}
          disabled={disabled}
          style={{
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 500,
            border: '1px solid var(--border)',
            background: 'var(--white)',
            color: 'var(--text-primary)',
            cursor: disabled ? 'default' : 'pointer',
            fontFamily: 'Geist, sans-serif',
            transition: 'background 120ms ease, border-color 120ms ease',
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--white)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          }}
        >
          {label} →
        </button>
      ))}
    </div>
  );
}
