import { Lock } from "lucide-react";
import { match } from "ts-pattern";
import { useBoardStore } from "@/store/board-store";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "../ui/field";
import { Switch } from "../ui/switch";

export function RulesSection() {
  const rules = useBoardStore((state) => state.rules);
  const toggleRule = useBoardStore((state) => state.toggleRule);

  return (
    <FieldGroup className="w-full gap-2">
      {rules.map((rule) => (
        <FieldLabel key={rule.kind} htmlFor={`switch-${rule.kind}`}>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>{rule.name}</FieldTitle>
              <FieldDescription>{rule.description}</FieldDescription>
            </FieldContent>
            {match(rule.requirement)
              .with("required", () => <Lock className="size-4 text-muted-foreground" aria-label="Required rule" />)
              .with("optional", () => (
                <Switch
                  id={`switch-${rule.kind}`}
                  checked={rule.enabled}
                  onCheckedChange={() => toggleRule(rule.kind)}
                />
              ))
              .exhaustive()}
          </Field>
        </FieldLabel>
      ))}
    </FieldGroup>
  );
}
