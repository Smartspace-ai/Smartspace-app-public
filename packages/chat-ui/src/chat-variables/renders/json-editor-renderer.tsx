import type { ControlProps, RankedTester } from '@jsonforms/core';
import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import debounce from 'lodash.debounce';
import React, { useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';

import {
  fieldErrorClass,
  fieldHintClass,
  fieldLabelClass,
  scaleFor,
  type FieldSurface,
} from './fieldStyles';

type AccessUiSchema = { access?: 'Read' | 'Write' };

const JsonEditorRenderer: React.FC<ControlProps> = ({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  uischema,
  visible,
  enabled,
  required,
  config,
}) => {
  const [jsonValue, setJsonValue] = useState<string>('');
  const [displayedParseError, setDisplayedParseError] = useState<string | null>(
    null
  );
  const isInitializing = useRef(true);
  const lastValidData = useRef<unknown>(null);

  // Debounced function to display error messages
  const debouncedSetDisplayError = useRef(
    debounce((error: string | null) => {
      setDisplayedParseError(error);
    }, 300)
  );

  // Convert data to JSON string only on initial load or when external data changes significantly
  useEffect(() => {
    if (
      isInitializing.current ||
      (data !== lastValidData.current && data !== undefined)
    ) {
      try {
        const formatted = JSON.stringify(data, null, 2);
        setJsonValue(formatted || '{}');
        setDisplayedParseError(null);
        debouncedSetDisplayError.current.cancel(); // Cancel any pending error display
        lastValidData.current = data;
        isInitializing.current = false;
      } catch (error) {
        setJsonValue('{}');
        const errorMsg = 'Invalid JSON data';
        setDisplayedParseError(errorMsg);
        isInitializing.current = false;
      }
    }
  }, [data, debouncedSetDisplayError]);

  const handleEditorChange = (value: string) => {
    // Always update the editor value to preserve user input and whitespace
    setJsonValue(value);

    try {
      const parsed = JSON.parse(value);
      setDisplayedParseError(null);
      debouncedSetDisplayError.current.cancel(); // Cancel any pending error display
      lastValidData.current = parsed;
      handleChange(path, parsed);
    } catch (error) {
      const errorMsg = `Invalid JSON: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      // Debounce the error display so it doesn't show immediately while typing
      debouncedSetDisplayError.current(errorMsg);
    }
  };

  // Cleanup debounced functions on unmount
  useEffect(() => {
    const d = debouncedSetDisplayError.current;
    return () => {
      d.cancel();
    };
  }, []);

  if (!visible) {
    return null;
  }

  // Get readOnly from uischema (set when access === 'Read')
  const readOnly =
    (uischema as unknown as AccessUiSchema | undefined)?.access === 'Read';
  const isDisabled = !enabled || readOnly;
  const scale = scaleFor(
    ((config ?? {}) as { surface?: FieldSurface }).surface ?? 'form'
  );

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label className={fieldLabelClass(scale)}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}

      {description && <div className={fieldHintClass}>{description}</div>}

      <div
        className={`overflow-hidden rounded-md border ${
          errors || displayedParseError ? 'border-destructive' : 'border-input'
        } ${isDisabled ? 'opacity-60' : ''}`}
      >
        <AceEditor
          mode="json"
          theme="github"
          name={`json-editor-${path}`}
          onChange={handleEditorChange}
          value={jsonValue}
          width="100%"
          fontSize={14}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          readOnly={isDisabled}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: false,
            showLineNumbers: true,
            showGutter: false,
            tabSize: 2,
            minLines: 5,
            maxLines: 8,
            wrap: true,
          }}
          style={{
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          }}
        />
      </div>

      {displayedParseError && (
        <div className={fieldErrorClass}>{displayedParseError}</div>
      )}

      {errors && <div className={fieldErrorClass}>{errors}</div>}
    </div>
  );
};

// Tester function that matches everything but has the lowest priority
export const jsonEditorTester: RankedTester = rankWith(
  1, // Very low priority - will be used as fallback when no other renderer matches
  () => true // Matches everything
);

// Enhanced component with JsonForms integration
export const JsonEditorRendererControl =
  withJsonFormsControlProps(JsonEditorRenderer);
