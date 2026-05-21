import { COURSES } from "@/lib/courses";
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
/**
 * `nextCohort` is the upcoming open cohort (ISO `yyyy-mm-dd` dates),
 * fetched from the DB by the page. When there is no open cohort the
 * `CourseInstance` node is omitted rather than carrying a stale date.
 */
export function homepageJsonLd(
  locale: "es" | "en",
  nextCohort: { startDate: string; endDate: string } | null,
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const course = COURSES[0]!;

  const address = {
    "@type": "PostalAddress",
    streetAddress: "73 Santa Cruz Medical Building, Suite 201",
    addressLocality: "Bayamón",
    addressRegion: "PR",
    postalCode: "00961",
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
        telephone: "+1-787-798-4646",
        // Schema.org permits multiple `telephone` values for org-level
        // representations of multiple lines.
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+1-787-798-4646",
            contactType: "customer service",
            availableLanguage: ["Spanish", "English"],
          },
          {
            "@type": "ContactPoint",
            telephone: "+1-787-408-5775",
            contactType: "customer service",
            availableLanguage: ["Spanish", "English"],
          },
        ],
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
        telephone: "+1-787-798-4646",
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
        ...(course.acpe && {
          educationalCredentialAwarded:
            locale === "es"
              ? `Crédito CE (${course.acpe.contactHours} horas de contacto / ${course.acpe.ceus} CEUs · ${course.acpe.classification}) bajo patrocinio del ${course.acpe.provider} — ACPE Provider ${course.acpe.providerNumber}`
              : `CE credit (${course.acpe.contactHours} contact hours / ${course.acpe.ceus} CEUs · ${course.acpe.classification}) under sponsorship of ${course.acpe.provider} — ACPE Provider ${course.acpe.providerNumber}`,
          numberOfCredits: {
            "@type": "QuantitativeValue",
            value: course.acpe.ceus,
            unitText: "CEUs",
          },
        }),
        ...(nextCohort && {
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "In-person",
            startDate: nextCohort.startDate,
            endDate: nextCohort.endDate,
            location: {
              "@type": "Place",
              name: "Santa Cruz Pharma Care",
              address,
            },
            instructor: {
              "@type": "Person",
              name: "Jorge L. Reyes Quiñones",
              jobTitle:
                locale === "es"
                  ? "Farmacéutico · Director del programa"
                  : "Pharmacist · Program Director",
            },
          },
        }),
      },
    ],
  };
}
