import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, step_level")
    .order("step_level", { ascending: false })
    .order("name");

  return <OnboardingForm competitions={competitions ?? []} />;
}
