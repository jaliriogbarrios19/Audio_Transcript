import type { PromptTemplate } from "../types";
import { DEFAULT_TEMPLATES } from "../types";

export function getAll(
  templates: PromptTemplate[]
): PromptTemplate[] {
  return templates.length > 0 ? templates : DEFAULT_TEMPLATES;
}

export function add(
  templates: PromptTemplate[],
  name: string,
  prompt: string
): PromptTemplate[] {
  return [...templates, { name, prompt }];
}

export function update(
  templates: PromptTemplate[],
  index: number,
  name: string,
  prompt: string
): PromptTemplate[] {
  return templates.map((t, i) => (i === index ? { name, prompt } : t));
}

export function remove(
  templates: PromptTemplate[],
  index: number
): PromptTemplate[] {
  return templates.filter((_, i) => i !== index);
}
