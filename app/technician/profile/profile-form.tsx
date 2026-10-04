"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProfileAction } from "@/lib/actions/technician";
import type { Service, Technician } from "@/types";
import { SubmitButton } from "@/components/ui/submit-button";

const areas = ["dhanmondi", "mirpur", "uttara", "mohammadpur", "gulshan", "banani", "airport"];
const days = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
export function TechnicianProfileForm({ technician, services }: { technician: Technician; services: Service[] }) {
  const [skills, setSkills] = useState(technician.skills);
  const [selectedAreas, setSelectedAreas] = useState(technician.serviceAreas);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(formData: FormData) {
    formData.set("skills", JSON.stringify(skills)); formData.set("serviceAreas", JSON.stringify(selectedAreas));
    formData.set("availability", JSON.stringify(days.map((day) => ({ day, slots: String(formData.get(`slot-${day}`) ?? "").split(",").map((slot) => slot.trim()).filter(Boolean) }))));
    const result = await updateProfileAction(formData);
    if (result?.success) {
      setMessage("Profile saved for review.");
      toast.success("Technician profile saved.");
      router.refresh();
    } else {
      const fieldErrors = "fieldErrors" in (result ?? {}) ? Object.values(result.fieldErrors ?? {}).flat().join(" ") : "";
      const errorMessage = fieldErrors || result?.error || "Unable to save profile.";
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  }
  return <form action={submit} className="mt-8 grid gap-5"><label className="grid gap-2 text-sm font-medium">Photo URL / ছবির URL<input name="photo" defaultValue={technician.photo} className="min-h-11 border border-border px-3" /></label><label className="grid gap-2 text-sm font-medium">Bengali name / বাংলা নাম<input name="nameBn" defaultValue={technician.nameBn} required className="min-h-11 border border-border px-3" /></label><fieldset className="grid gap-3"><legend className="text-sm font-medium">Skills / দক্ষতা</legend>{skills.map((skill, index) => <div className="grid gap-2 border border-border p-3 sm:grid-cols-3" key={`${skill.serviceSlug}-${index}`}><select value={skill.serviceSlug} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, serviceSlug: event.target.value } : item))} className="min-h-10 border border-border px-2">{services.map((service) => <option value={service.slug} key={service.slug}>{service.name}</option>)}</select>  <select value={skill.level} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, level: event.target.value as typeof item.level } : item))} className="min-h-10 border border-border px-2"><option value="junior">Junior</option><option value="mid">Mid</option><option value="senior">Senior</option></select><input type="number" min="0" value={skill.yearsExperience} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, yearsExperience: Number(event.target.value) } : item))} className="min-h-10 border border-border px-2" /></div>)}<button type="button" onClick={() => setSkills((current) => [...current, { serviceSlug: services[0]?.slug ?? "", level: "junior", yearsExperience: 0 }])} className="border border-foreground px-3 py-2 text-sm">Add skill / দক্ষতা যোগ করুন</button></fieldset><fieldset><legend className="text-sm font-medium">Service areas / সেবার এলাকা</legend><div className="mt-3 flex flex-wrap gap-3">{areas.map((area) => <label className="flex gap-2 text-sm" key={area}><input type="checkbox" checked={selectedAreas.includes(area)} onChange={() => setSelectedAreas((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area])} />{area}</label>)}</div></fieldset><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Visit charge / ভিজিট চার্জ<input name="visitCharge" type="number" defaultValue={technician.visitCharge} min="0" required className="min-h-11 border border-border px-3" /></label><label className="grid gap-2 text-sm font-medium">Experience years / অভিজ্ঞতা<input name="experienceYears" type="number" defaultValue={technician.experienceYears} min="0" required className="min-h-11 border border-border px-3" /></label></div><fieldset className="grid gap-3"><legend className="text-sm font-medium">Availability / সময়সূচি (comma-separated slots)</legend>{days.map((day) => <label className="grid gap-2 text-sm" key={day}>{day}<input name={`slot-${day}`} defaultValue={technician.availability?.find((item) => item.day === day)?.slots.join(", ")} placeholder="10:00-14:00, 16:00-20:00" className="min-h-10 border border-border px-3" /></label>)}</fieldset><label className="grid gap-2 text-sm font-medium">NID number / জাতীয় পরিচয়পত্র<input name="nidNumber" pattern="([0-9]{10}|[0-9]{13}|[0-9]{17})" defaultValue={technician.nidNumber} className="min-h-11 border border-border px-3" /></label><label className="grid gap-2 text-sm font-medium">NID image URL / NID ছবির URL<input name="nidImageUrl" defaultValue={technician.nidImageUrl} className="min-h-11 border border-border px-3" /></label>{message && <p className="text-sm text-success">{message}</p>}  <SubmitButton pendingText="Saving profile...">Save profile / সংরক্ষণ করুন</SubmitButton></form>;
}
