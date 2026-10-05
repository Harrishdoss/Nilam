'use client';
import { createContext, useContext } from 'react';
import type { Role } from '@/lib/types';
export const PortalContext = createContext<{ role: Role }>({ role: 'government' });
export const usePortal = () => useContext(PortalContext);
