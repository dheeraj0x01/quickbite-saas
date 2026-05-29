import { redirect } from "next/navigation";

/**
 * Root marketing route.
 *
 * For the demo we send visitors directly to the customer flow for table 1
 * of the seeded "spice-garden" restaurant. In production this should
 * become a marketing/landing page or a restaurant picker.
 */
export default function Home() {
  redirect("/r/spice-garden/t/1");
}
