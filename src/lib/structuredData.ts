import { COURSES, COHORTS } from "@/lib/courses";
import { getSiteUrl } from "@/lib/siteUrl";

/**
 * Build the JSON-LD graph injected on the homepage for SEO.
 *
 * Three entities under one @graph:
 *   - EducationalOrganization (SCCA — the legal entity)
 *   - LocalBusiness            (the Bayamón campus with hours)
 *   - Course                   (the single 18-hour Basic Compounding course
 *                               with its upcoming CourseInstance + instructor)
 *
 * Strings vary per locale (description) so the doc surfaced in Google's
 * crawler matches the page language the user sees.
 *
 * Why no `educationalCredentialAwarded` claim of "ACPE CE": the legal docs
 * disclose SCCA is not currently an ACPE provider. Stating it in schema
 * would be a misrepresentation. Re-add the field if/when SCCA is
 * accredited and surfaces it on Terms §8.
 */
export function homepageJsonLd(locale: "es" | "en"): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const course = COURSES[0]!;
  const cohort = COHORTS[0]!;

  const address = {
    "@type": "PostalAddress",
    streetAddress: "Edificio Médico Santa Cruz, 73 Calle Santa Cruz, Suite 101",
    addressLocality: "Bayamón",
    addressRegion: "PR",
    postalCode: "00960",
    addressCountry: "PR",
  };

  const courseName =
    locale === "es"
      ? "Compounding No Estéril Básico — Farmacéuticos y Técnicos"
      : "Basic Non-Sterile Compounding — Pharmacists & Technicians";
  const courseDescription =
    locale === "es"
      ? "Curso integrado de 18 horas presenciales (3 días · 6 hrs/día) para farmacéuticos y técnicos en Puerto Rico. Cubre USP 〈795〉, USP 〈800〉, Ley de Farmacia de PR y DQSA a través de tres módulos consecutivos."
      : "Integrated 18-hour in-person course (3 days · 6 hrs/day) for pharmacists and pharmacy technicians in Puerto Rico. Covers USP 〈795〉, USP 〈800〉, PR Pharmacy Act, and DQSA across three consecutive modules.";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${siteUrl}/#organization`,
        name: "Santa Cruz Compounding Academy",
        legalName: "Santa Cruz Compounding Academy, LLC",
        url: siteUrl,
        logo: `${siteUrl}/brand/logo-full.png`,
        email: "info@sccompoundingacademy.com",
        telephone: "+1-787-254-8329",
        address,
        sameAs: [
          "https://www.instagram.com/santacruzpharmacare/",
          "https://www.facebook.com/santa.cruz.pharma.care/",
        ],
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#localbusiness`,
        name: "Santa Cruz Compounding Academy",
        url: siteUrl,
        telephone: "+1-787-254-8329",
        email: "info@sccompoundingacademy.com",
        address,
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "07:30",
          closes: "17:00",
        },
      },
      {
        "@type": "Course",
        "@id": `${siteUrl}/#course-${course.id}`,
        name: courseName,
        description: courseDescription,
        provider: { "@id": `${siteUrl}/#organization` },
        inLanguage: locale === "es" ? "es-PR" : "en-US",
        educationalLevel: locale === "es" ? "Educación continua profesional" : "Continuing professional education",
        timeRequired: `PT${course.hours}H`,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "In-person",
          startDate: cohort.startDate,
          endDate: cohort.endDate,
          location: {
            "@type": "Place",
            name: "Santa Cruz Pharma Care",
            address,
          },
          instructor: {
            "@type": "Person",
            name: "Jorge L. Reyes Quiñones",
            jobTitle:
              locale === "es" ? "Farmacéutico · Director del programa" : "Pharmacist · Program Director",
          },
        },
      },
    ],
  };
}
