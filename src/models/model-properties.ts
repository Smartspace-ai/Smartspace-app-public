export class ModelProperties {
  frequencyPenalty?: number;
  presencePenalty?: number;
  temperature?: number;
  topP?: number;
  [key: string]: any;

  constructor(params?: ModelProperties) {
    Object.assign(this, params || {});
  }
}

/**
 * Property
 */
export const ModelPropertiesTooltips: Record<string, string> = {
  FrequencyPenalty: `Frequency Penalty' helps prevent repetition. Set it above 0 to discourage repeating the same points, or below 0 to stay on a topic longer.`,
  PresencePenalty: `Use 'Presence Penalty' to encourage the conversation to cover new ground. Set above 0 to explore new topics, or go below 0 to focus more on what's already mentioned. It's like guiding a conversation to either stay on track or discover new territories.`,
  Temperature: `Think of 'Temperature' as a dial for creativity. Turn it up towards 0.8 for more unpredictable and varied responses. Dial it down towards 0.2 when you want the output to be more reliable and consistent. Just use this or 'top_p' for the best results, not both at the same time.`,
  TopP: `'top_p' is like fishing with a net that only catches the most likely ideas. Set it to 0.1 to only consider the most common ideas. It's an alternative to 'Temperature', so it's best to adjust this setting or 'Temperature', but not both.`,
};
