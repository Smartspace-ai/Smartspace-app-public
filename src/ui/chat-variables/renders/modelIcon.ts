import azureAiIcon from '@lobehub/icons-static-svg/icons/azureai-color.svg';
import bedrockIcon from '@lobehub/icons-static-svg/icons/bedrock-color.svg';
import claudeIcon from '@lobehub/icons-static-svg/icons/claude-color.svg';
import cohereIcon from '@lobehub/icons-static-svg/icons/cohere-color.svg';
import deepseekIcon from '@lobehub/icons-static-svg/icons/deepseek-color.svg';
import geminiIcon from '@lobehub/icons-static-svg/icons/gemini-color.svg';
import huggingfaceIcon from '@lobehub/icons-static-svg/icons/huggingface-color.svg';
import metaIcon from '@lobehub/icons-static-svg/icons/meta-color.svg';
import microsoftIcon from '@lobehub/icons-static-svg/icons/microsoft-color.svg';
import mistralIcon from '@lobehub/icons-static-svg/icons/mistral-color.svg';
import openaiIcon from '@lobehub/icons-static-svg/icons/openai.svg';
import perplexityIcon from '@lobehub/icons-static-svg/icons/perplexity-color.svg';
import qwenIcon from '@lobehub/icons-static-svg/icons/qwen-color.svg';
import xaiIcon from '@lobehub/icons-static-svg/icons/xai.svg';

import type { Model } from '@/domains/models/model';

const PUBLISHER_ICONS: Record<string, string> = {
  openai: openaiIcon,
  anthropic: claudeIcon,
  google: geminiIcon,
  meta: metaIcon,
  mistral: mistralIcon,
  microsoft: microsoftIcon,
  deepseek: deepseekIcon,
  cohere: cohereIcon,
  xai: xaiIcon,
  huggingface: huggingfaceIcon,
  amazon: bedrockIcon,
  perplexity: perplexityIcon,
  alibaba: qwenIcon,
};

const FOUNDRY_ICONS: Record<string, string> = {
  openai: openaiIcon,
  anthropic: claudeIcon,
  azureopenai: azureAiIcon,
  azure: azureAiIcon,
  google: geminiIcon,
  gemini: geminiIcon,
  googlegemini: geminiIcon,
  huggingface: huggingfaceIcon,
};

export function getModelIcon(model: Model | null | undefined): string | null {
  if (!model) return null;
  const publisher = model.modelPublisher?.toLowerCase();
  if (publisher && PUBLISHER_ICONS[publisher]) {
    return PUBLISHER_ICONS[publisher];
  }
  const foundry = model.modelDeploymentProviderType?.toLowerCase();
  if (foundry && FOUNDRY_ICONS[foundry]) {
    return FOUNDRY_ICONS[foundry];
  }
  return null;
}
