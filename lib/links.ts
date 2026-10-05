import type { Role } from './types';
/** how GIS layers connect to the rest of the platform */
export const LAYER_SIM: Record<string, string> = { mutation: 'SIM-024', cadastral: 'SIM-019', climate: 'SIM-011', disputes: 'SIM-015', conversion: 'SIM-008', urban: 'SIM-008', ror: 'SIM-031', p_mutation: 'SIM-024', p_flood: 'SIM-011', p_dispute: 'SIM-015', p_landuse: 'SIM-008' };
export const LAYER_THEME: Record<string, string> = { mutation: 'Registration & mutation', cadastral: 'Urban land', climate: 'Climate & resilience', disputes: 'Land disputes', conversion: 'Land-use change', urban: 'Land-use change', ror: 'Digital land records', p_mutation: 'Registration & mutation', p_flood: 'Climate & resilience', p_dispute: 'Land disputes', p_landuse: 'Land-use change' };
export const LAYER_ARTICLE: Record<string, string> = { ror: 'ART-01', cadastral: 'ART-02', mutation: 'ART-05', climate: 'ART-06', conversion: 'ART-04', urban: 'ART-04', disputes: 'ART-01', p_mutation: 'ART-05', p_flood: 'ART-06', p_dispute: 'ART-01', p_landuse: 'ART-04' };
export const portalOf = (r: Role) => `/portal/${r}`;
