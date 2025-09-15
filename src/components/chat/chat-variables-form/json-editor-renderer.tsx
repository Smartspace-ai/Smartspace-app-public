import { ControlProps, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';

interface JsonEditorRendererProps extends ControlProps {
  data: any;
  handleChange: (path: string, value: any) => void;
  path: string;
}

const JsonEditorRenderer: React.FC<JsonEditorRendererProps> = ({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  schema,
  uischema,
  visible,
  enabled
}) => {
  const [jsonValue, setJsonValue] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [displayedParseError, setDisplayedParseError] = useState<string | null>(null);
  const isInitializing = useRef(true);
  const lastValidData = useRef<any>(null);


  // Debounced function to display error messages
  const debouncedSetDisplayError = useCallback(
    debounce((error: string | null) => {
      setDisplayedParseError(error);
    }, 3000), // 300ms debounce for error display
    []
  );

  // Convert data to JSON string only on initial load or when external data changes significantly
  useEffect(() => {
    if (isInitializing.current || (data !== lastValidData.current && data !== undefined)) {
      try {
        const formatted = JSON.stringify(data, null, 2);
        setJsonValue(formatted || '{}');
        setParseError(null);
        setDisplayedParseError(null);
        debouncedSetDisplayError.cancel(); // Cancel any pending error display
        lastValidData.current = data;
        isInitializing.current = false;
      } catch (error) {
        setJsonValue('{}');
        const errorMsg = 'Invalid JSON data';
        setParseError(errorMsg);
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
      setParseError(null);
      setDisplayedParseError(null);
      debouncedSetDisplayError.cancel(); // Cancel any pending error display
      lastValidData.current = parsed;
      handleChange(path, parsed);
    } catch (error) {
      const errorMsg = `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setParseError(errorMsg);
      // Debounce the error display so it doesn't show immediately while typing
      debouncedSetDisplayError(errorMsg);
    }
  };

  // Cleanup debounced functions on unmount
  useEffect(() => {
    return () => {
      debouncedSetDisplayError.cancel();
    };
  }, [debouncedSetDisplayError]);

  if (!visible) {
    return null;
  }

  // Get readOnly from uischema (set when access === 'Read')
  const readOnly = (uischema as any)?.access === 'Read';
  const isDisabled = !enabled || readOnly;

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          color: '#475569', 
          fontSize: '0.875rem', 
          fontWeight: 500, 
          marginBottom: '0.375rem' 
        }}>
          {label}
          {schema.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      
      {description && (
        <div style={{ 
          color: '#6b7280', 
          fontSize: '0.75rem', 
          marginBottom: '0.5rem' 
        }}>
          {description}
        </div>
      )}

      <div style={{ 
        border: errors || displayedParseError ? '1px solid #ef4444' : '1px solid #d1d5db',
        borderRadius: '6px',
        overflow: 'hidden',
        opacity: isDisabled ? 0.6 : 1
      }}>
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
            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
          }}
        />
      </div>

      {displayedParseError && (
        <div style={{ 
          color: '#ef4444', 
          fontSize: '0.75rem', 
          marginTop: '0.25rem' 
        }}>
          {displayedParseError}
        </div>
      )}

      {errors && <div style={{ 
          color: '#ef4444', 
          fontSize: '0.75rem', 
          marginTop: '0.25rem' 
        }}>
          {errors}
        </div>
      }
    </div>
  );
};

// Tester function that matches everything but has the lowest priority
export const jsonEditorTester: RankedTester = rankWith(
  1, // Very low priority - will be used as fallback when no other renderer matches
  () => true // Matches everything
);

// Enhanced component with JsonForms integration
export const JsonEditorRendererControl = withJsonFormsControlProps(JsonEditorRenderer); 