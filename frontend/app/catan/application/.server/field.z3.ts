import type { Field, ValidField } from "../../domain/entity/field";
import type { Template } from "../../domain/entity/template";
import { Z3Solver } from "../../domain/service/z3.solver";

async function generateValidField(field: Field, template: Template): Promise<ValidField> {
  return Z3Solver.solve(field, template);
}

export const FieldZ3Application = {
  generateValidField,
};

