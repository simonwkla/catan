import { useTemplateStore } from "@/hook/use-template";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "../ui/field";
import { Switch } from "../ui/switch";

export function RulesSection() {
  const rules = useTemplateStore((state) => state.rules);
  const toggleRule = useTemplateStore((state) => state.toggleRule);

  return (
    <div className="flex flex-col gap-3">
      <FieldGroup className="w-full gap-2">
        {rules.map((r) => (
          <FieldLabel key={r.kind} htmlFor={`switch-${r.kind}`}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{r.name}</FieldTitle>
                <FieldDescription>{r.description}</FieldDescription>
              </FieldContent>
              <Switch id={`switch-${r.kind}`} checked={r.enabled} onCheckedChange={(_checked) => toggleRule(r.kind)} />
            </Field>
          </FieldLabel>
        ))}
      </FieldGroup>
    </div>
  );
}
