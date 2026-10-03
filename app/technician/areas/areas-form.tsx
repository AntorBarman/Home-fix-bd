"use client";
import { useState } from "react";
import { toast } from "sonner";
import { updateAreasAction } from "@/lib/actions/technician";
const areas = ["dhanmondi","mirpur","uttara","mohammadpur","gulshan","banani","airport"];
export function AreasForm({ initial }: { initial: string[] }) { const [selected, setSelected] = useState(initial); async function save() { const formData = new FormData(); formData.set("serviceAreas", JSON.stringify(selected)); const result = await updateAreasAction(formData); if (result?.success) toast.success("Service areas saved."); else toast.error(result?.error ?? "Unable to save."); } return <><div className="mt-8 grid gap-3 sm:grid-cols-3">{areas.map((area) => <label className="flex gap-2 border border-border p-4 text-sm" key={area}><input type="checkbox" checked={selected.includes(area)} onChange={() => setSelected((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area])} />{area}</label>)}</div><button type="button" onClick={save} className="mt-6 bg-foreground px-5 py-3 text-sm text-background">Save areas</button></>; }
