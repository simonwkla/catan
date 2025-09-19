import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { ReactElement, useEffect, useState } from "react";
import { useFetcher, useLoaderData, useRevalidator, useSearchParams } from "@remix-run/react";
import { FieldComponent } from "@components/Field";
import { SideBar } from "@components/SideBar";
import type { Field } from "app/catan/domain/entity/field";
import { PartialTemplate, Template } from "app/catan/domain/entity/template";
import { Catan } from "@catan";
import { CatanServer } from "app/catan/index.server";
export const meta: MetaFunction = () => {
  return [{ title: "New Remix App" }, { name: "description", content: "Welcome to Remix!" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sizeParam = url.searchParams.get("size");
  const size = Math.max(0, Math.min(10, Number(sizeParam ?? 1))) || 1;
  const field = Catan.generateEmptyField(size);
  const template = Catan.generateEmptyTemplate();
  return json({ field, template, size });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const payload = formData.get("payload");
  if (typeof payload !== "string") return json({ error: "invalid payload" }, { status: 400 });

  const { field, template } = JSON.parse(payload) as { field: Field; template: PartialTemplate };

  // Merge with an empty template to ensure all keys exist
  const fullTemplate = PartialTemplate.toTemplate(template);

  const solved = await CatanServer.generateValidField(field, fullTemplate);
  return json({ field: solved });
}


export default function _index(): ReactElement {
  const initial = useLoaderData<typeof loader>();
  const fetcherGenerate = useFetcher<{ field: Field }>();
  const [field, setField] = useState<Field>(initial.field);
  const [template, setTemplate] = useState<PartialTemplate>(initial.template);
  const revalidate = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (fetcherGenerate.state === "idle" && fetcherGenerate.data?.field) {
      setField(fetcherGenerate.data.field);
    }
  }, [fetcherGenerate.state, fetcherGenerate.data]);

  const onSubmit = () => {
    // Post the current field and template to the server to run Z3
    const payload = JSON.stringify({ field, template });
    const formData = new FormData();
    formData.set("payload", payload);
    fetcherGenerate.submit(formData, { method: "post" });
  };

  return (
    <div className="flex h-screen w-screen bg-background">
      <div className="flex-shrink flex-grow">
        <FieldComponent field={field} onChange={setField} />
      </div>
      <div className="w-1/3 flex-shrink-0 border-l-2 border-black">
        <SideBar
          className="w-full"
          totalTilesCount={field.tiles.length}
          fieldSize={initial.size}
          onSizeChange={(n) => {
            revalidate.revalidate();
            setSearchParams({ size: n.toString() });
          }}
          onTemplateChange={(t) => setTemplate({ ...template, ...t })}
          template={template}
          onSubmit={onSubmit}
          disabled={fetcherGenerate.state !== "idle"}
        />
      </div>
    </div>
  );
}
