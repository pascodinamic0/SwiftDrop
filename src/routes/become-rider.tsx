import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useRiderProfile } from "@/lib/useRiderProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bike, DollarSign, Clock, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { isVerifiedRider } from "@/lib/roles";

export const Route = createFileRoute("/become-rider")({
  head: () => ({ meta: [{ title: "Become a rider — SwiftDrop" }] }),
  component: BecomeRider,
});

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full legal name").max(100),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  homeAddress: z.string().trim().min(5, "Enter your home address").max(200),
  city: z.string().trim().min(2, "Enter your city").max(80),
  governmentId: z.string().trim().min(4, "Enter a government ID number").max(40),
  emergencyContactName: z.string().trim().min(2, "Emergency contact name is required").max(100),
  emergencyContactPhone: z.string().trim().min(7, "Emergency contact phone is required").max(20),
  licensePlate: z.string().trim().max(20).optional(),
  applicationNotes: z.string().trim().max(500).optional(),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
});

function BecomeRider() {
  const { user, roles, refreshRoles } = useAuth();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useRiderProfile();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<"foot" | "bike" | "motorbike" | "car">("bike");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [city, setCity] = useState("");
  const [governmentId, setGovernmentId] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isRider = roles.includes("delivery_agent");
  const verified = isVerifiedRider(profile);
  const canReapply = profile?.verification_status === "rejected";

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.full_name) setFullName(data.full_name);
      if (data?.phone) setPhone(data.phone);
    })();
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    if (profile.vehicle) setVehicle(profile.vehicle);
    if (profile.date_of_birth) setDateOfBirth(profile.date_of_birth);
    if (profile.home_address) setHomeAddress(profile.home_address);
    if (profile.city) setCity(profile.city);
    if (profile.government_id) setGovernmentId(profile.government_id);
    if (profile.emergency_contact_name) setEmergencyContactName(profile.emergency_contact_name);
    if (profile.emergency_contact_phone) setEmergencyContactPhone(profile.emergency_contact_phone);
    if (profile.license_plate) setLicensePlate(profile.license_plate);
    if (profile.application_notes) setApplicationNotes(profile.application_notes);
  }, [profile]);

  const submitApplication = async () => {
    if (!user) {
      navigate({ to: "/auth/rider", search: { mode: "signup" } });
      return;
    }

    const needsVehicleId = vehicle === "motorbike" || vehicle === "car";
    const parsed = applicationSchema.safeParse({
      fullName,
      phone,
      dateOfBirth,
      homeAddress,
      city,
      governmentId,
      emergencyContactName,
      emergencyContactPhone,
      licensePlate: needsVehicleId ? licensePlate.trim() || undefined : licensePlate || undefined,
      applicationNotes: applicationNotes || undefined,
      termsAccepted: termsAccepted ? true : undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (needsVehicleId && !licensePlate.trim()) {
      toast.error("License plate is required for motorbike and car");
      return;
    }

    setSubmitting(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", user.id);
      if (profileError) throw profileError;

      if (!isRider) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: "delivery_agent" });
        if (roleError && !roleError.message.includes("duplicate")) throw roleError;
      }

      const { error: riderError } = await supabase.from("rider_profiles").upsert({
        id: user.id,
        vehicle,
        date_of_birth: dateOfBirth,
        home_address: homeAddress,
        city,
        government_id: governmentId,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        license_plate: licensePlate.trim() || null,
        application_notes: applicationNotes.trim() || null,
        verification_status: "pending",
        rejection_reason: null,
        verified_at: null,
        verified_by: null,
        is_online: false,
        applied_at: new Date().toISOString(),
      });
      if (riderError) throw riderError;

      await refreshRoles();
      await refreshProfile();
      toast.success("Application submitted! We'll review your details shortly.");
      navigate({ to: "/rider" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const showApplicationForm = !isRider || canReapply;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary items-center justify-center mb-4">
            <Bike className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Join the SwiftDrop fleet
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Apply with your details. After verification you can browse and accept delivery jobs near you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {[
            { i: DollarSign, t: "Cash in hand", d: "Customers pay you directly on delivery." },
            { i: Clock, t: "Flexible hours", d: "Go online only when you're free to work." },
            { i: ShieldCheck, t: "Verified riders", d: "We review every application before you take jobs." },
          ].map((f) => (
            <Card key={f.t} className="p-5">
              <f.i className="h-5 w-5 text-primary" />
              <h3 className="font-semibold mt-2">{f.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 mt-8 max-w-2xl mx-auto">
          {profileLoading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : isRider && verified ? (
            <>
              <h2 className="font-display text-2xl font-bold">You're a verified rider</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Open the job portal to see available deliveries and manage active runs.
              </p>
              <Button variant="hero" size="lg" className="w-full mt-4" onClick={() => navigate({ to: "/rider" })}>
                Open job portal
              </Button>
            </>
          ) : isRider && profile?.verification_status === "pending" ? (
            <>
              <h2 className="font-display text-2xl font-bold">Application submitted</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your account is in probation while we verify your details. You'll be notified once approved.
              </p>
              <Button variant="hero" size="lg" className="w-full mt-4" onClick={() => navigate({ to: "/rider" })}>
                View application status
              </Button>
            </>
          ) : showApplicationForm ? (
            <>
              <h2 className="font-display text-2xl font-bold">
                {canReapply ? "Update your application" : "Rider application"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                All fields are required unless marked optional. Applications are reviewed within 1–2 business days.
              </p>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">Full legal name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="homeAddress">Home address</Label>
                  <Input id="homeAddress" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="governmentId">Government ID number</Label>
                  <Input id="governmentId" value={governmentId} onChange={(e) => setGovernmentId(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle type</Label>
                  <Select value={vehicle} onValueChange={(v) => setVehicle(v as typeof vehicle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foot">On foot</SelectItem>
                      <SelectItem value="bike">Bicycle</SelectItem>
                      <SelectItem value="motorbike">Motorbike</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">
                    License plate {(vehicle === "motorbike" || vehicle === "car") ? "" : "(optional)"}
                  </Label>
                  <Input id="licensePlate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Emergency contact name</Label>
                  <Input id="emergencyName" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency contact phone</Label>
                  <Input id="emergencyPhone" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Additional notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={applicationNotes}
                    onChange={(e) => setApplicationNotes(e.target.value)}
                    placeholder="Previous delivery experience, availability, etc."
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(v === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed font-normal">
                  I confirm the information above is accurate and I agree to SwiftDrop's rider terms, background
                  checks, and probation review process.
                </Label>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full mt-5"
                onClick={submitApplication}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : user ? "Submit application" : "Create rider account"}
              </Button>
              {!user && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  Already have a rider account?{" "}
                  <Link to="/auth/rider" className="text-primary font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              )}
            </>
          ) : null}
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
