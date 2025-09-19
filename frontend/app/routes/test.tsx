import { Form, useActionData } from "@remix-run/react";
import { init } from "z3-solver";

export const action = async () => {
    const {Context} = await init();
    // simple test 
    const {Solver, Or, Int}= Context("catan") 
    const solver = new Solver();

    const x = Int.const("x");
    const y = Int.const("y");
    const z = Int.const("z");

    solver.add(Or(x.eq(1), y.eq(1), z.eq(1)));
    solver.add(Or(x.eq(2), y.eq(2), z.eq(2)));
    solver.add(Or(x.eq(3), y.eq(3), z.eq(3)));

    console.log("solver is checking");
    const result = await solver.check();
    if(result !== "sat"){
        throw new Error("Solver returned unsat");
    }

    console.log("solver is done");
    const model = solver.model();
    console.log("model", model);

    return {model};
}

export default function Page(){

    return (
    <div>
    <Form method="POST">
    <button className="bg-blue-500 text-white p-2 rounded-md">
        Do the stuff now
    </button>
    </Form>
    <div>
    </div>
</div>
    );
}