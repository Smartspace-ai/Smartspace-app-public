import { rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Autocomplete, TextField } from '@mui/material';
import { Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { llmModelIcons } from '../../../assets/providers';
import { useModels } from '../../../hooks/use-models';
import { Model } from '../../../models/model';
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog';

interface ModelIdRendererProps {
  data: any;
  handleChange: (path: string, value: any) => void;
  path: string;
  enabled: boolean;
  schema: any;
  label: string;
  description?: string;
  errors?: string;
  required?: boolean;
  uischema?: any;
  visible?: boolean;
}

// Helper function to get provider logo/icon
const getProviderInfo = (providerType: string): { iconSrc: string | null; bgColor: string; textColor: string } => {
  const provider = providerType?.toLowerCase() || '';
  
  switch (provider) {
    case 'anthropic':
      return { iconSrc: llmModelIcons.Anthropic, bgColor: 'transparent', textColor: '#FFFFFF' };
    case 'openai':
      return { iconSrc: llmModelIcons.OpenAi, bgColor: 'transparent', textColor: '#FFFFFF' };
    case 'azureopenai':
    case 'azure':
      return { iconSrc: llmModelIcons.AzureOpenAi, bgColor: 'transparent', textColor: '#FFFFFF' };
    case 'google':
    case 'gemini':
    case 'googlegemini':
      return { iconSrc: llmModelIcons.GoogleGemini, bgColor: 'transparent', textColor: '#FFFFFF' };
    case 'huggingface':
      return { iconSrc: llmModelIcons.HuggingFace, bgColor: 'transparent', textColor: '#FFFFFF' };
    default:
      return { iconSrc: null, bgColor: 'transparent', textColor: '#6B7280' };
  }
};

const ModelIdRenderer: React.FC<ModelIdRendererProps> = ({
  data,
  handleChange,
  path,
  enabled,
  schema,
  label,
  description,
  errors,
  required,
  uischema
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  
  // Debounce search to prevent excessive API calls
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 300);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue]);

  // Use debounced search value directly, only search when there's actual input
  const searchTerm = useMemo(() => {
    return debouncedSearchValue && debouncedSearchValue.length > 0 ? debouncedSearchValue : undefined;
  }, [debouncedSearchValue]);
  
  // Fetch models with search functionality
  const { data: modelsData, isLoading } = useModels({ 
    search: searchTerm,
    take: 1000 
  });
  const [listModels, setListModels] = useState<Model[]>([]);
  useEffect(() => {
    if (modelsData?.data) {
      const sorted = [...modelsData.data].sort((a, b) => {
        const aName = (a.displayName || a.name || '').toLowerCase();
        const bName = (b.displayName || b.name || '').toLowerCase();
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      });
      setListModels(sorted);
    }
  }, [modelsData?.data]);

  const selectedModel = (data && listModels.length) ? listModels.find(model => model.id === data) : null;

  // Compute the input value to show either the search term or the selected model's name
  const displayInputValue = useMemo(() => {
    // If user is actively searching, show their search input
    if (searchValue) {
      return searchValue;
    }
    // If there's a selected model and no search input, show the model's display name
    if (selectedModel && !searchValue) {
      return selectedModel.displayName || selectedModel.name || '';
    }
    // Otherwise, empty
    return '';
  }, [searchValue, selectedModel]);

  const handleModelChange = useCallback((_event: any, newValue: Model | null) => {
    if (newValue) {
      handleChange(path, newValue.id);
    } else {
      handleChange(path, undefined);
    }
    // Clear search when selection is made
    setSearchValue('');
    setDebouncedSearchValue('');
    setIsOpen(false);
  }, [handleChange, path, setIsOpen]);

  const handleInputChange = useCallback((_event: any, newInputValue: string, reason: string) => {
    // Only update search value when user is typing, not when selecting
    if (reason === 'input') {
      setSearchValue(newInputValue);
    }
  }, []);

  // Prevent focus/blur jitter causing flicker by keeping dialog open during typing
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Clear search value when closing dropdown
    setSearchValue('');
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

  // Get readOnly from uischema (set when access === 'Read')
  const readOnly = (uischema as any)?.access === 'Read';
  const isDisabled = !enabled || readOnly;

  if (isMobile) {
    const providerInfo = selectedModel ? getProviderInfo(selectedModel.modelDeploymentProviderType || '') : null;
    return (
      <div className="w-full flex justify-center">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              disabled={isDisabled}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-accent text-foreground/90 hover:bg-accent/80 transition-colors"
              style={{ width: 'fit-content', maxWidth: '100%' }}
            >
              {providerInfo?.iconSrc && (
                <img src={providerInfo.iconSrc} alt="Provider" className="h-4 w-4" />
              )}
              <span className="text-sm truncate">
                {selectedModel ? (selectedModel.displayName || selectedModel.name) : (label || 'Select model')}
              </span>
            </button>
          </DialogTrigger>
          <DialogContent hideClose onOpenAutoFocus={(e) => e.preventDefault()} className="p-0 w-[90vw] max-w-sm sm:max-w-sm h-[70vh] flex flex-col gap-0 data-[state=open]:animate-none data-[state=closed]:animate-none">
            <div className="flex flex-col h-full w-full">
              <div className="flex-1 overflow-y-auto w-full max-w-[360px] mx-auto">
                {isLoading && listModels.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                <ul className="divide-y w-full">
                  {listModels.map((option) => (
                    <li key={option.id} className="px-3 py-2 hover:bg-accent cursor-pointer"
                        onClick={() => handleModelChange(null as any, option)}>
                      <div className="flex items-center gap-2">
                        {getProviderInfo(option.modelDeploymentProviderType || '').iconSrc && (
                          <img src={getProviderInfo(option.modelDeploymentProviderType || '').iconSrc!} className="h-4 w-4" />
                        )}
                        <span className="text-sm">{option.displayName || option.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-2 py-1 border-t bg-background flex justify-center">
                <TextField
                  value={searchValue}
                  onChange={(e) => setSearchValue((e.target as HTMLInputElement).value)}
                  placeholder="Search models..."
                  size="small"
                  className="w-full max-w-[360px] m-0"
                  sx={{ m: 0, p: 0 }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Autocomplete<Model>
      value={selectedModel}
      onChange={handleModelChange}
      inputValue={displayInputValue}
      onInputChange={handleInputChange}
      onOpen={handleOpen}
      onClose={handleClose}
      options={listModels}
      getOptionLabel={(option) => {
        return option.displayName || option.name || '';
      }}
      isOptionEqualToValue={(option, value) => {
        return option.id === value?.id;
      }}
      loading={isLoading}
      disabled={isDisabled}
      clearOnBlur={false}
      selectOnFocus={false}
      handleHomeEndKeys={false}
      blurOnSelect
      filterOptions={(x) => x} // Disable client-side filtering since we handle it server-side
      noOptionsText={
        <div className="flex flex-col items-center py-4 text-gray-500">
          <div className="text-sm">
            {isLoading ? "Loading models..." : (searchValue ? "No models found" : "Start typing to search models...")}
          </div>
          {searchValue && !isLoading && (
            <div className="text-xs mt-1 opacity-75">
              Try adjusting your search terms
            </div>
          )}
        </div>
      }
      renderInput={(params) => {
        const providerInfo = selectedModel ? getProviderInfo(selectedModel.modelDeploymentProviderType || '') : null;
        
        return (
          <TextField
            {...params}
            label={label}
            helperText={description || errors}
            error={!!errors}
            required={required}
            variant="outlined"
            size="small"
            className="compact-field"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                transition: 'all 0.2s ease-in-out',
                '& fieldset': {
                  borderColor: '#e5e7eb',
                  borderWidth: '1px',
                },
                '&:hover': {
                  backgroundColor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#9ca3af',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#6366f1',
                    borderWidth: '2px',
                  },
                },
                '&.Mui-error': {
                  '& fieldset': {
                    borderColor: '#ef4444',
                  },
                },
              },
              '& .MuiInputLabel-root': {
                color: '#6b7280',
                fontSize: '0.875rem',
                fontWeight: 500,
                '&.Mui-focused': {
                  color: '#6366f1',
                },
                '&.Mui-error': {
                  color: '#ef4444',
                },
              },
              '& .MuiFormHelperText-root': {
                fontSize: '0.75rem',
                marginTop: '4px',
                '&.Mui-error': {
                  color: '#ef4444',
                },
              },
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: providerInfo?.iconSrc ? (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: providerInfo.bgColor,
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                >
                  <img 
                    src={providerInfo.iconSrc} 
                    alt="Provider logo"
                    style={{
                      width: 20,
                      height: 20,
                      objectFit: 'contain',
                      marginRight: 0,
                      borderRadius: 4,
                    }}
                  />
                </div>
              ) : null,
              endAdornment: (
                <>
                  {isLoading ? (
                    <div className="flex items-center mr-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        );
      }}
      renderOption={(props, option) => {
        const providerInfo = getProviderInfo(option.modelDeploymentProviderType || '');
        
        return (
          <li 
            {...props} 
            key={option.id}
            className="!px-4 !py-3 hover:!bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-50 last:border-b-0"
          >
            <div className="flex items-center space-x-3">
              {/* Provider Logo */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: providerInfo.bgColor,
                  flexShrink: 0
                }}
              >
                {providerInfo.iconSrc ? (
                  <img 
                    src={providerInfo.iconSrc} 
                    alt="Provider logo"
                    style={{
                      width: 20,
                      height: 20,
                      objectFit: 'contain',
                      marginRight: 0,
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <span style={{ color: providerInfo.textColor, fontSize: '12px' }}>⚡</span>
                )}
              </div>
              
              {/* Model Info */}
              <div className="flex flex-col space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm leading-tight">
                    {option.displayName || option.name}
                  </span>
                  {selectedModel?.id === option.id && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
                {option.displayName && option.name !== option.displayName && (
                  <span className="text-xs text-gray-500 leading-tight">
                    {option.name}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      }}
      sx={{
        '& .MuiAutocomplete-paper': {
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          marginTop: '4px',
          '& .MuiAutocomplete-listbox': {
            padding: 0,
            maxHeight: '280px',
            '& .MuiAutocomplete-option': {
              padding: 0,
              minHeight: 'auto',
              '&.Mui-focused': {
                backgroundColor: '#f8fafc !important',
              },
              '&[aria-selected="true"]': {
                backgroundColor: '#eff6ff !important',
                '&.Mui-focused': {
                  backgroundColor: '#dbeafe !important',
                },
              },
            },
          },
        },
        '& .MuiAutocomplete-popper': {
          zIndex: 1300,
        },
        '& .MuiAutocomplete-clearIndicator': {
          color: '#9ca3af',
          '&:hover': {
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
          },
        },
        '& .MuiAutocomplete-popupIndicator': {
          color: '#9ca3af',
          '&:hover': {
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
          },
        },
      }}
    />
  );
};

// Create the tester function for JSON Forms
export const modelIdRendererTester = rankWith(
  100, // Much higher rank to ensure it takes priority
  (uischema, schema) => {
    // Check if this is a Control element (individual field)
    if (uischema.type !== 'Control' || !(uischema as any).scope) {
      return false;
    }

    // Extract the property path from the scope (e.g., "#/properties/Model" -> "Model")
    const propertyPath = (uischema as any).scope.replace('#/properties/', '');
    
    // Get the individual field schema from the root schema
    const fieldSchema = schema?.properties?.[propertyPath];
    
    if (!fieldSchema) {
      return false;
    }

    // Check if this field has the ModelId indicators
    const hasModelSelector = (fieldSchema as any)['x-model-selector'] === true;
    const hasModelIdTitle = fieldSchema.title === 'ModelId';
    const result = hasModelIdTitle || hasModelSelector;
    
    return result;
  }
);

// Export the wrapped component
export const ModelIdRendererControl = withJsonFormsControlProps(ModelIdRenderer as any); 