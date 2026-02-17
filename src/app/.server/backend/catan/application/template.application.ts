import { Field } from "@/.server/backend/catan/model/field";
import { Template } from "@/.server/backend/catan/model/template";

export class TemplateApplication {
  createDefaultTemplate = (size: number): [Template, Field] => {
    const field = Field.empty(size);
    const template = Template.default(field);
    return [template, field];
  };
}
