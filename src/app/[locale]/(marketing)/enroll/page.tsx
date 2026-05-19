// EN counterpart of /es/inscripcion — re-exports the same handler so
// both localised URLs render the same component, picking up locale from
// params (next-intl translates the path; the file structure mirrors it).
export { default, generateMetadata } from "../inscripcion/page";
